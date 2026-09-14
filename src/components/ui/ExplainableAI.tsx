import { useState } from 'react';
import type { CropAssessmentResult } from '@/lib/ai';
import {
  Eye, Check, AlertTriangle, Info, Lightbulb, CloudSun,
  ChevronRight, ChevronDown, Activity, ScanLine,
} from '@/components/ui/Icons';

interface ExplainableAIProps {
  result: CropAssessmentResult;
}

function confidencePercent(confidence: string | null): number {
  if (confidence === 'High') return 85;
  if (confidence === 'Moderate') return 60;
  if (confidence === 'Low') return 30;
  return 50;
}

function confidenceColor(pct: number): string {
  if (pct >= 70) return '#4d7c5e';
  if (pct >= 45) return '#c99846';
  return '#c45a4a';
}

export default function ExplainableAI({ result }: ExplainableAIProps) {
  const [expanded, setExpanded] = useState(false);
  const confPct = confidencePercent(result.assessment_confidence);
  const confColor = confidenceColor(confPct);

  const evidenceCount = result.evidence_used.length;
  const missingCount = result.missing_evidence.length;
  const indicatorCount = result.observed_indicators.length;
  const contextCount = result.context_factors.length;
  const totalSignals = evidenceCount + missingCount + indicatorCount + contextCount;

  return (
    <div className="card p-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-700 text-white">
            <ScanLine size={16} />
          </div>
          <h3 className="font-serif text-base font-medium text-forest-900">How Neraya reached this assessment</h3>
        </div>
        {expanded ? <ChevronDown size={18} className="text-forest-400" /> : <ChevronRight size={18} className="text-forest-400" />}
      </button>

      {expanded && (
        <div className="mt-6 space-y-5 animate-fade-in">
          {/* Confidence breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-2xs font-semibold uppercase tracking-wider text-forest-400">Confidence breakdown</p>
              <span className="text-sm font-medium" style={{ color: confColor }}>{result.assessment_confidence ?? 'Unknown'}</span>
            </div>
            <div className="relative h-3 rounded-full bg-forest-50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${confPct}%`, backgroundColor: confColor }}
              />
              <div
                className="absolute top-0 h-full"
                style={{ left: `${confPct}%`, width: '2px', backgroundColor: 'white', opacity: 0.6 }}
              />
            </div>
            <div className="flex justify-between mt-1 text-2xs text-forest-400">
              <span>Low</span>
              <span>Moderate</span>
              <span>High</span>
            </div>
          </div>

          {/* Signal flow visualization */}
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-3">Evidence signals</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SignalCard
                icon={<Eye size={14} />}
                label="Visual indicators"
                count={indicatorCount}
                color="#4d7c5e"
              />
              <SignalCard
                icon={<Check size={14} />}
                label="Evidence used"
                count={evidenceCount}
                color="#5a8a6e"
              />
              <SignalCard
                icon={<Info size={14} />}
                label="Context factors"
                count={contextCount}
                color="#7a9a8e"
              />
              <SignalCard
                icon={<AlertTriangle size={14} />}
                label="Missing evidence"
                count={missingCount}
                color="#c99846"
              />
            </div>
          </div>

          {/* Reasoning flow */}
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-3">Reasoning process</p>
            <div className="space-y-3">
              <ReasoningStep
                step={1}
                title="Visual analysis"
                items={result.observed_indicators}
                icon={<Eye size={14} />}
              />
              <ReasoningStep
                step={2}
                title="Evidence evaluation"
                items={result.evidence_used}
                icon={<Check size={14} />}
              />
              <ReasoningStep
                step={3}
                title="Context integration"
                items={result.context_factors}
                icon={<Info size={14} />}
              />
              {result.missing_evidence.length > 0 && (
                <ReasoningStep
                  step={4}
                  title="Gaps identified"
                  items={result.missing_evidence}
                  icon={<AlertTriangle size={14} />}
                  warning
                />
              )}
              <div className="flex items-start gap-3 pt-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-600 text-white text-2xs font-bold flex-shrink-0">
                  <Lightbulb size={14} />
                </div>
                <div className="flex-1 rounded-xl bg-forest-50 border border-forest-100 p-3">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-1">Assessment</p>
                  <p className="text-sm font-medium text-forest-900">{result.possible_issue ?? 'Unable to determine'}</p>
                  <p className="text-xs text-forest-500 mt-1">{result.assessment_explanation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Evidence weight bars */}
          {totalSignals > 0 && (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-3">Signal distribution</p>
              <div className="flex h-2 rounded-full overflow-hidden bg-forest-50">
                {indicatorCount > 0 && (
                  <div style={{ width: `${(indicatorCount / totalSignals) * 100}%`, backgroundColor: '#4d7c5e' }} />
                )}
                {evidenceCount > 0 && (
                  <div style={{ width: `${(evidenceCount / totalSignals) * 100}%`, backgroundColor: '#5a8a6e' }} />
                )}
                {contextCount > 0 && (
                  <div style={{ width: `${(contextCount / totalSignals) * 100}%`, backgroundColor: '#7a9a8e' }} />
                )}
                {missingCount > 0 && (
                  <div style={{ width: `${(missingCount / totalSignals) * 100}%`, backgroundColor: '#c99846' }} />
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-2xs text-forest-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4d7c5e' }} /> Visual ({indicatorCount})</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5a8a6e' }} /> Evidence ({evidenceCount})</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#7a9a8e' }} /> Context ({contextCount})</span>
                {missingCount > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#c99846' }} /> Missing ({missingCount})</span>}
              </div>
            </div>
          )}

          {/* Environmental context note */}
          {result.environmental_considerations && (
            <div className="rounded-xl bg-sky-50 border border-sky-100 p-3 flex items-start gap-2">
              <CloudSun size={14} className="text-sky-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-sky-400 mb-0.5">Environmental layer</p>
                <p className="text-xs text-sky-700">{result.environmental_considerations}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SignalCard({ icon, label, count, color }: { icon: React.ReactNode; label: string; count: number; color: string }) {
  return (
    <div className="rounded-xl border border-forest-100 p-3 text-center">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg mx-auto mb-1.5" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <p className="text-lg font-bold text-forest-900">{count}</p>
      <p className="text-2xs text-forest-400">{label}</p>
    </div>
  );
}

function ReasoningStep({ step, title, items, icon, warning }: { step: number; title: string; items: string[]; icon: React.ReactNode; warning?: boolean }) {
  if (items.length === 0) return null;

  return (
    <div className="flex items-start gap-3">
      <div className={`flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0 ${warning ? 'bg-warning-50 text-warning-500' : 'bg-forest-50 text-forest-500'}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-1">{title}</p>
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-forest-600">
              <div className="flex-shrink-0 mt-1 w-1 h-1 rounded-full" style={{ backgroundColor: warning ? '#c99846' : '#4d7c5e' }} />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
