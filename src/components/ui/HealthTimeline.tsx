import { useMemo, useState } from 'react';
import type { CropAssessment, WeatherData, WeatherForecast } from '@/types';
import { Droplets, Sun, Wind, AlertTriangle, CloudRain, FlaskConical } from '@/components/ui/Icons';

interface HealthTimelineProps {
  assessments: CropAssessment[];
  onViewAssessment?: (assessmentId: string) => void;
}

type StatusLevel = 'healthy' | 'monitor' | 'attention';

function severityToStatus(severity: string | null): StatusLevel {
  if (severity === 'High') return 'attention';
  if (severity === 'Moderate') return 'monitor';
  return 'healthy';
}

function statusColor(status: StatusLevel): string {
  switch (status) {
    case 'healthy': return '#4d7c5e';
    case 'monitor': return '#c99846';
    case 'attention': return '#c45a4a';
  }
}

function statusLabel(status: StatusLevel): string {
  switch (status) {
    case 'healthy': return 'Healthy';
    case 'monitor': return 'Monitor';
    case 'attention': return 'Attention';
  }
}

interface TimelinePoint {
  id: string;
  date: Date;
  status: StatusLevel;
  issue: string;
  severity: string | null;
  confidence: string | null;
  explanation: string | null;
}

export default function HealthTimeline({ assessments, onViewAssessment }: HealthTimelineProps) {
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);

  const points = useMemo<TimelinePoint[]>(() => {
    if (assessments.length === 0) return [];
    return [...assessments].reverse().map(a => ({
      id: a.id,
      date: new Date(a.created_at),
      status: severityToStatus(a.severity),
      issue: a.possible_issue ?? 'Assessment',
      severity: a.severity,
      confidence: a.assessment_confidence,
      explanation: a.assessment_explanation,
    }));
  }, [assessments]);

  if (points.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-forest-500">Your health timeline will appear as you record more scans.</p>
      </div>
    );
  }

  const w = 600;
  const h = 180;
  const padX = 50;
  const padY = 30;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  const single = points.length === 1;
  const xStep = single ? 0 : chartW / (points.length - 1);
  const svgPoints = points.map((p, i) => ({
    x: single ? w / 2 : padX + i * xStep,
    y: padY + chartH / 2,
    ...p,
  }));

  const pathD = svgPoints.length >= 2
    ? svgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : '';

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Health timeline showing assessment history">
        <line x1={padX} y1={padY + chartH / 2} x2={w - padX} y2={padY + chartH / 2} stroke="#e8ede9" strokeWidth="1" strokeDasharray="2 4" />

        {pathD && (
          <path d={pathD} fill="none" stroke="#c4d4c5" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        )}

        {svgPoints.map((p, i) => {
          const color = statusColor(p.status);
          const isSelected = selectedPoint === p.id;
          const radius = single ? (isSelected ? 10 : 8) : (isSelected ? 8 : 6);
          const innerRadius = single ? (isSelected ? 6 : 5) : (isSelected ? 4 : 3);
          return (
            <g
              key={p.id}
              onClick={() => setSelectedPoint(isSelected ? null : p.id)}
              style={{ cursor: 'pointer' }}
              role="button"
              aria-label={`${p.issue}, ${statusLabel(p.status)}, ${p.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            >
              {single && (
                <circle cx={p.x} cy={p.y} r={radius + 6} fill={color} opacity={0.12} />
              )}
              <circle cx={p.x} cy={p.y} r={radius} fill="white" stroke={color} strokeWidth="2.5" />
              <circle cx={p.x} cy={p.y} r={innerRadius} fill={color} />
              <text x={p.x} y={p.y - 16} textAnchor="middle" fontSize="7" fontWeight="600" fill={color}>
                {statusLabel(p.status)}
              </text>
              <text x={p.x} y={padY + chartH + 16} textAnchor="middle" fontSize="7" fill="#9ca89e">
                {p.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            </g>
          );
        })}

        {svgPoints.length >= 2 && (
          <text
            x={w - padX}
            y={padY - 8}
            textAnchor="end"
            fontSize="8"
            fontWeight="600"
            fill={svgPoints[svgPoints.length - 1].status === 'healthy' ? '#4d7c5e' : svgPoints[svgPoints.length - 1].status === 'monitor' ? '#c99846' : '#c45a4a'}
          >
            {svgPoints[0].status === 'attention' && svgPoints[svgPoints.length - 1].status === 'healthy' ? 'Improving' :
             svgPoints[0].status === 'healthy' && svgPoints[svgPoints.length - 1].status === 'attention' ? 'Declining' : 'Stable'}
          </text>
        )}
      </svg>

      {selectedPoint && (() => {
        const p = points.find(pt => pt.id === selectedPoint);
        if (!p) return null;
        const color = statusColor(p.status);
        return (
          <div className="mt-4 p-4 rounded-xl border border-forest-100 bg-forest-50/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-2xs font-medium" style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}>
                {statusLabel(p.status)}
              </span>
              {p.severity && <span className="text-xs text-forest-500">Severity: {p.severity}</span>}
              {p.confidence && <span className="text-xs text-forest-500">Confidence: {p.confidence}</span>}
            </div>
            <p className="text-sm font-medium text-forest-900 mb-1">{p.issue}</p>
            <p className="text-xs text-forest-500 mb-1">{p.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            {p.explanation && <p className="text-xs text-forest-500 mt-2 line-clamp-3">{p.explanation}</p>}
            {onViewAssessment && (
              <button onClick={() => onViewAssessment(p.id)} className="btn-secondary text-sm mt-3">
                <FlaskConical size={14} /> View assessment
              </button>
            )}
          </div>
        );
      })()}

      {!selectedPoint && single && (
        <p className="text-2xs text-forest-500 text-center mt-2">
          First recorded assessment. Future scans will add more points to this timeline.
        </p>
      )}

      {!selectedPoint && !single && (
        <p className="text-2xs text-forest-400 text-center mt-2">Tap a point to see details</p>
      )}

      <div className="flex items-center justify-center gap-4 mt-3 text-2xs text-forest-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor('healthy') }} /> Healthy</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor('monitor') }} /> Monitor</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor('attention') }} /> Attention</span>
      </div>
    </div>
  );
}

interface WeatherRiskGaugeProps {
  weather: WeatherData | null;
  forecast: WeatherForecast[];
}

export function WeatherRiskGauge({ weather, forecast }: WeatherRiskGaugeProps) {
  if (!weather) return null;

  let riskScore = 0;
  const riskFactors: { label: string; level: 'low' | 'moderate' | 'high'; icon: React.ReactNode }[] = [];

  if (weather.humidity >= 80) {
    riskScore += 30;
    riskFactors.push({ label: 'High humidity - disease risk', level: 'high', icon: <Droplets size={12} /> });
  } else if (weather.humidity >= 65) {
    riskScore += 15;
    riskFactors.push({ label: 'Moderate humidity', level: 'moderate', icon: <Droplets size={12} /> });
  }

  if (weather.temperature >= 35) {
    riskScore += 25;
    riskFactors.push({ label: 'Heat stress risk', level: 'high', icon: <Sun size={12} /> });
  } else if (weather.temperature <= 5) {
    riskScore += 25;
    riskFactors.push({ label: 'Cold stress risk', level: 'high', icon: <Sun size={12} /> });
  }

  if (weather.wind_speed >= 25) {
    riskScore += 15;
    riskFactors.push({ label: 'Strong wind', level: 'moderate', icon: <Wind size={12} /> });
  }

  const upcomingRain = forecast.some(f => f.precipitation_probability && f.precipitation_probability > 60);
  if (upcomingRain) {
    riskScore += 10;
    riskFactors.push({ label: 'Rain expected soon', level: 'moderate', icon: <CloudRain size={12} /> });
  }

  const upcomingHeat = forecast.some(f => f.temp_max >= 38);
  if (upcomingHeat) {
    riskScore += 20;
    riskFactors.push({ label: 'High temps forecast', level: 'high', icon: <AlertTriangle size={12} /> });
  }

  riskScore = Math.min(riskScore, 100);

  const riskColor = riskScore >= 50 ? '#c45a4a' : riskScore >= 25 ? '#c99846' : '#4d7c5e';
  const riskLabel = riskScore >= 50 ? 'Elevated' : riskScore >= 25 ? 'Moderate' : 'Low';

  const arcRadius = 50;
  const circumference = Math.PI * arcRadius;
  const arcOffset = circumference - (riskScore / 100) * circumference;

  return (
    <div className="mt-4 pt-4 border-t border-forest-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-2xs font-semibold uppercase tracking-wider text-forest-400">Weather Risk</p>
        <span className="text-2xs font-medium" style={{ color: riskColor }}>{riskLabel}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <svg width="120" height="70" viewBox="0 0 120 70">
            <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e8ede9" strokeWidth="8" strokeLinecap="round" />
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke={riskColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={arcOffset}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <span className="text-lg font-bold" style={{ color: riskColor }}>{riskScore}</span>
            <span className="text-2xs text-forest-400">risk score</span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          {riskFactors.length === 0 ? (
            <p className="text-xs text-forest-500">Current conditions are favorable for your crops.</p>
          ) : (
            riskFactors.map((factor, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span style={{ color: factor.level === 'high' ? '#c45a4a' : factor.level === 'moderate' ? '#c99846' : '#4d7c5e' }}>
                  {factor.icon}
                </span>
                <span className="text-forest-600">{factor.label}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
