import { useEffect, useState } from 'react';
import type { Field, CropAssessment, WeatherData } from '@/types';
import { Sprout, Droplets, Sun, Wind, Activity, ArrowRight } from '@/components/ui/Icons';
import FieldPulse3D, { isWebGLAvailable } from '@/components/ui/FieldPulse3D';

interface FieldPulseProps {
  fields: Field[];
  assessments: CropAssessment[];
  weather: WeatherData | null;
  onOpenField: (id: string) => void;
}

function getHealthScore(assessments: CropAssessment[]): number {
  if (assessments.length === 0) return 75;
  const latest = assessments[0];
  if (latest.severity === 'High') return 25;
  if (latest.severity === 'Moderate') return 50;
  if (latest.severity === 'Low') return 70;
  return 75;
}

function healthColor(score: number): string {
  if (score >= 65) return '#4d7c5e';
  if (score >= 40) return '#c99846';
  return '#c45a4a';
}

function healthLabel(score: number): string {
  if (score >= 65) return 'Healthy';
  if (score >= 40) return 'Monitor';
  return 'Attention';
}

export default function FieldPulse({ fields, assessments, weather, onOpenField }: FieldPulseProps) {
  const [pulsePhase, setPulsePhase] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [use3D, setUse3D] = useState(false);
  const [render3D, setRender3D] = useState(false);

  useEffect(() => {
    setUse3D(isWebGLAvailable());
  }, []);

  useEffect(() => {
    if (use3D) {
      const timer = setTimeout(() => setRender3D(true), 100);
      return () => clearTimeout(timer);
    }
  }, [use3D]);

  useEffect(() => {
    if (!use3D) {
      const interval = setInterval(() => {
        setPulsePhase(p => (p + 1) % 100);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [use3D]);

  if (fields.length === 0) return null;

  const displayFields = fields.slice(0, 4);
  const activeField = displayFields[selectedIdx] ?? displayFields[0];
  const fieldAssessments = assessments.filter(a => a.field_id === activeField?.id);
  const score = getHealthScore(fieldAssessments);
  const color = healthColor(score);
  const label = healthLabel(score);

  const show3D = use3D && render3D && activeField;

  const handle3DError = () => {
    setUse3D(false);
    setRender3D(false);
  };

  const wave1 = Math.sin(pulsePhase * 0.06) * 4;
  const wave2 = Math.sin(pulsePhase * 0.04 + 1.5) * 3;
  const pulseOpacity = 0.3 + Math.sin(pulsePhase * 0.08) * 0.15;
  const breatheScale = 1 + Math.sin(pulsePhase * 0.05) * 0.02;

  return (
    <section className="card p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-700 text-white">
            <Activity size={16} />
          </div>
          <h2 className="font-serif text-lg font-medium text-forest-900">Field Pulse</h2>
        </div>
        {weather && (
          <div className="flex items-center gap-3 text-2xs text-forest-400">
            <span className="flex items-center gap-1"><Sun size={12} /> {weather.temperature}C</span>
            <span className="flex items-center gap-1"><Droplets size={12} /> {weather.humidity}%</span>
            <span className="flex items-center gap-1"><Wind size={12} /> {weather.wind_speed} km/h</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Visualization */}
        <div className="lg:col-span-3">
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-b from-sky-50 to-forest-50 border border-forest-100">
            {show3D ? (
              <div className="absolute inset-0">
                <ErrorBoundaryFallback onError={handle3DError}>
                  <FieldPulse3D field={activeField} assessments={fieldAssessments} weather={weather} />
                </ErrorBoundaryFallback>
              </div>
            ) : (
            <svg viewBox="0 0 320 200" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e8f0e9" />
                  <stop offset="100%" stopColor="#f5f9f3" />
                </linearGradient>
                <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.4" />
                </linearGradient>
                <radialGradient id="pulseGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Sky */}
              <rect x="0" y="0" width="320" height="120" fill="url(#skyGrad)" />

              {/* Sun/Weather orb */}
              <circle
                cx="260" cy="40" r="18"
                fill={weather ? (weather.is_day ? '#f5c95c' : '#6b7d8e') : '#c4d4c5'}
                opacity="0.7"
                style={{ transformOrigin: '260px 40px', transform: `scale(${breatheScale})` }}
              />
              {weather && weather.is_day && (
                <circle cx="260" cy="40" r="24" fill="#f5c95c" opacity="0.15" style={{ transformOrigin: '260px 40px', transform: `scale(${breatheScale})` }} />
              )}

              {/* Rolling hills */}
              <path
                d={`M 0 ${110 + wave1} Q 80 ${95 + wave1} 160 ${105 + wave2} T 320 ${100 + wave1} L 320 200 L 0 200 Z`}
                fill="url(#groundGrad)"
              />
              <path
                d={`M 0 ${130 + wave2} Q 60 ${120 + wave1} 140 ${128 + wave2} T 320 ${125 + wave1} L 320 200 L 0 200 Z`}
                fill={color}
                opacity="0.2"
              />

              {/* Field rows (perspective lines) */}
              {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
                const y = 140 + i * 8;
                const xStart = 160 - (i + 1) * 20;
                const xEnd = 160 + (i + 1) * 20;
                return (
                  <line
                    key={i}
                    x1={xStart + wave1 * 0.3}
                    y1={y}
                    x2={xEnd + wave2 * 0.3}
                    y2={y}
                    stroke={color}
                    strokeWidth="1.5"
                    opacity={0.3 + i * 0.08}
                  />
                );
              })}

              {/* Crops - small plants growing from field rows */}
              {[0, 1, 2, 3, 4, 5, 6].map(i => {
                const cx = 60 + i * 35 + wave1 * 0.5;
                const cy = 145 + (i % 3) * 8;
                const h = 12 + (i % 3) * 4 + Math.sin(pulsePhase * 0.03 + i) * 2;
                return (
                  <g key={i}>
                    <line x1={cx} y1={cy} x2={cx + wave1 * 0.2} y2={cy - h} stroke={color} strokeWidth="1.5" opacity="0.6" />
                    <circle cx={cx + wave1 * 0.2} cy={cy - h} r="3" fill={color} opacity={0.5 + Math.sin(pulsePhase * 0.04 + i) * 0.2} />
                  </g>
                );
              })}

              {/* Central pulse ring */}
              <circle cx="160" cy="150" r="30" fill="url(#pulseGrad)" opacity={pulseOpacity} />
              <circle
                cx="160" cy="150" r="20"
                fill="none"
                stroke={color}
                strokeWidth="1"
                opacity={0.4}
                style={{ transformOrigin: '160px 150px', transform: `scale(${1 + Math.sin(pulsePhase * 0.1) * 0.3})` }}
              />

              {/* Health score text */}
              <text x="160" y="155" textAnchor="middle" className="font-serif" fontSize="14" fontWeight="600" fill={color}>
                {score}
              </text>
              <text x="160" y="168" textAnchor="middle" fontSize="6" fill={color} opacity="0.7" letterSpacing="1">
                HEALTH
              </text>

              {/* Water/rain indicator */}
              {weather && weather.humidity > 70 && (
                <g opacity={pulseOpacity * 0.5}>
                  {[0, 1, 2, 3, 4].map(i => (
                    <line
                      key={i}
                      x1={40 + i * 50}
                      y1={20 + (pulsePhase + i * 20) % 40}
                      x2={37 + i * 50}
                      y2={25 + (pulsePhase + i * 20) % 40}
                      stroke="#6ba8d5"
                      strokeWidth="1"
                      opacity="0.5"
                    />
                  ))}
                </g>
              )}
            </svg>
            )}

            {/* Overlay info */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <div
                className="px-2.5 py-1 rounded-full text-2xs font-medium uppercase tracking-wider"
                style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
              >
                {label}
              </div>
            </div>

            {fieldAssessments.length > 0 && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="px-2.5 py-1 rounded-lg bg-white/80 backdrop-blur-sm text-2xs text-forest-600">
                  Last scan: {new Date(fieldAssessments[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-white/80 backdrop-blur-sm text-2xs text-forest-600">
                  {fieldAssessments[0].possible_issue ?? 'No issues detected'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Field selector list */}
        <div className="lg:col-span-2 space-y-2">
          {displayFields.map((field, i) => {
            const fAssessments = assessments.filter(a => a.field_id === field.id);
            const fScore = getHealthScore(fAssessments);
            const fColor = healthColor(fScore);
            const isActive = i === selectedIdx;
            return (
              <button
                key={field.id}
                onClick={() => setSelectedIdx(i)}
                aria-pressed={isActive}
                aria-label={`Select ${field.name} in Field Pulse`}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isActive
                    ? 'border-forest-300 bg-forest-50 ring-1 ring-forest-200'
                    : 'border-forest-100 hover:border-forest-200 hover:bg-forest-50/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: fColor, boxShadow: `0 0 6px ${fColor}80` }}
                    />
                    <span className="text-sm font-medium text-forest-900">{field.name}</span>
                  </div>
                  <span className="text-2xs font-medium" style={{ color: fColor }}>
                    {healthLabel(fScore)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-2xs text-forest-400">
                  {field.crop_type && <span className="flex items-center gap-1"><Sprout size={10} /> {field.crop_type}</span>}
                  {field.growth_stage && <span>{field.growth_stage}</span>}
                  {fAssessments.length > 0 && <span>{fAssessments.length} scan{fAssessments.length > 1 ? 's' : ''}</span>}
                </div>
                {/* Mini health bar */}
                <div className="mt-2 h-1 rounded-full bg-forest-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${fScore}%`, backgroundColor: fColor }}
                  />
                </div>
              </button>
            );
          })}
          {fields.length > 4 && (
            <p className="text-2xs text-forest-400 text-center pt-1">
              +{fields.length - 4} more fields
            </p>
          )}
          <button
            onClick={() => onOpenField(activeField.id)}
            className="w-full text-sm text-forest-500 hover:text-forest-700 flex items-center justify-center gap-1 pt-2"
          >
            View field details <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}

import { Component, type ReactNode } from 'react';

class ErrorBoundaryFallback extends Component<{ children: ReactNode; onError: () => void }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { this.props.onError(); }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
