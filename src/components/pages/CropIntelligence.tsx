import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { getFields, getAssessments, createAssessment, getSimilarCommunityPosts } from '@/lib/db';
import { analyzeCrop, uploadImage, type CropAssessmentResult, AIError } from '@/lib/ai';
import { getWeather } from '@/lib/weather';
import type { Field, CropAssessment, WeatherData, WeatherForecast, CommunityPost } from '@/types';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import Badge from '@/components/ui/Badge';
import ExplainableAI from '@/components/ui/ExplainableAI';
import { generateCropReportPDF } from '@/lib/report';
import {
  FlaskConical, Camera, Upload, ArrowRight, ArrowLeft, Check, X,
  Sprout, MapPin, CloudSun, Loader2, AlertTriangle, Info, Lightbulb,
  Eye, ChevronDown, ChevronRight, FileDown, Users, MessageSquare,
} from '@/components/ui/Icons';
import type { AppPage } from '@/components/AppShell';

interface CropIntelligenceProps {
  onNavigate: (page: AppPage) => void;
}

type Step = 'select' | 'upload' | 'describe' | 'analyzing' | 'result';

export default function CropIntelligence({ onNavigate }: CropIntelligenceProps) {
  const { profile } = useAuth();
  const { t, lang } = useI18n();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('select');
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [observations, setObservations] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<CropAssessment[]>([]);
  const [result, setResult] = useState<CropAssessmentResult | null>(null);
  const [savedAssessment, setSavedAssessment] = useState<CropAssessment | null>(null);
  const [similarPosts, setSimilarPosts] = useState<CommunityPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    getFields(profile.user_id).then(f => {
      setFields(f);
      setLoading(false);
    });
  }, [profile]);

  async function handleFileSelect(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    setError(null);
    setImageFile(file);
    const compressed = await compressImage(file);
    setImageDataUrl(compressed);
  }

  async function runAnalysis() {
    setStep('analyzing');
    setError(null);

    let uploadedUrl: string | null = null;
    let uploadedPath: string | null = null;
    if (imageFile && profile) {
      const uploaded = await uploadImage(imageFile, profile.user_id);
      if (uploaded) {
        uploadedUrl = uploaded.url;
        uploadedPath = uploaded.path;
      }
    }

    try {
      const analysisResult = await analyzeCrop({
        imageDataUrl,
        symptomsDescription: symptoms,
        observations,
        field: selectedField,
        weather,
        forecast: forecast.length > 0 ? forecast : null,
        previousAssessment: recentAssessments.length > 0 ? recentAssessments[0] : null,
        recentAssessments,
        language: lang,
      });

      setResult(analysisResult);

      if (profile) {
        const saved = await createAssessment(profile.user_id, {
          field_id: selectedField?.id ?? null,
          image_url: uploadedUrl,
          image_path: uploadedPath,
          symptoms_description: symptoms || null,
          observations: observations || null,
          possible_issue: analysisResult.possible_issue,
          assessment_confidence: analysisResult.assessment_confidence,
          observed_indicators: analysisResult.observed_indicators,
          context_factors: analysisResult.context_factors,
          evidence_used: analysisResult.evidence_used,
          missing_evidence: analysisResult.missing_evidence,
          severity: analysisResult.severity,
          assessment_explanation: analysisResult.assessment_explanation,
          what_to_check: analysisResult.what_to_check,
          what_to_consider: analysisResult.what_to_consider,
          environmental_considerations: analysisResult.environmental_considerations,
          escalation_guidance: analysisResult.escalation_guidance,
          recommendations: analysisResult.recommendations,
        });
        setSavedAssessment(saved);
      }

      setStep('result');

      if (profile) {
        const cropType = selectedField?.crop_type ?? null;
        const issue = analysisResult.possible_issue;
        const region = profile.location_text ?? null;
        getSimilarCommunityPosts(cropType, issue, region, profile.user_id, 5)
          .then(posts => setSimilarPosts(posts))
          .catch(() => setSimilarPosts([]));
      }
    } catch (err) {
      const msg = err instanceof AIError
        ? err.message
        : 'Neraya couldn\'t complete the assessment right now. Your photo and notes are saved. Please try again.';
      setError(msg);
      setStep('describe');
    }
  }

  async function selectField(field: Field) {
    setSelectedField(field);
    if (field.latitude && field.longitude) {
      const w = await getWeather(field.latitude, field.longitude);
      setWeather(w.current);
      setForecast(w.forecast);
    }
    if (profile) {
      const a = await getAssessments(profile.user_id, field.id);
      setRecentAssessments(a);
    }
    setStep('upload');
  }

  function reset() {
    setStep('select');
    setSelectedField(null);
    setImageDataUrl(null);
    setImageFile(null);
    setSymptoms('');
    setObservations('');
    setResult(null);
    setSavedAssessment(null);
    setSimilarPosts([]);
    setError(null);
    setForecast([]);
  }

  if (loading) return <LoadingState label={t('common.loading')} />;

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-medium text-forest-950">{t('cropScan.title')}</h1>
        <p className="text-sm text-forest-500 mt-1">{t('cropScan.uploadDesc')}</p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {['select', 'upload', 'describe', 'result'].map((s, i) => {
          const stepOrder = ['select', 'upload', 'describe', 'analyzing', 'result'];
          const currentIdx = stepOrder.indexOf(step);
          const thisIdx = stepOrder.indexOf(s);
          const isComplete = thisIdx < currentIdx;
          const isCurrent = step === s || (step === 'analyzing' && s === 'describe');
          return (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-2xs font-medium ${
                isComplete ? 'bg-forest-600 text-white' :
                isCurrent ? 'bg-forest-100 text-forest-700 ring-2 ring-forest-300' :
                'bg-forest-50 text-forest-300'
              }`}>
                {isComplete ? <Check size={14} /> : i + 1}
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 mx-1 ${isComplete ? 'bg-forest-400' : 'bg-forest-100'}`} />}
            </div>
          );
        })}
      </div>

      {/* Step: Select field */}
      {step === 'select' && (
        <div className="animate-fade-in">
          {fields.length === 0 ? (
            <div className="card p-12">
              <EmptyState
                icon={<Sprout size={32} />}
                title="You need a field before you can scan a crop."
                description="Add a field first so Neraya knows what crop you're looking at and can use the right context."
                action={<button onClick={() => onNavigate('fields')} className="btn-primary"><Sprout size={18} /> Add a field</button>}
              />
            </div>
          ) : (
            <div>
              <h2 className="font-serif text-lg font-medium text-forest-900 mb-4">Which field is this for?</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {fields.map(field => (
                  <button
                    key={field.id}
                    onClick={() => selectField(field)}
                    className="text-left p-4 rounded-xl border border-forest-100 hover:border-forest-300 hover:bg-forest-50/50 transition-all"
                  >
                    <h3 className="font-medium text-forest-900 text-sm mb-1">{field.name}</h3>
                    <div className="space-y-1 text-xs text-forest-500">
                      {field.crop_type && <p className="flex items-center gap-1.5"><Sprout size={12} /> {field.crop_type}</p>}
                      {field.location_text && <p className="flex items-center gap-1.5"><MapPin size={12} /> {field.location_text}</p>}
                      {field.growth_stage && <p><Badge variant="success" size="sm">{field.growth_stage}</Badge></p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: Upload image */}
      {step === 'upload' && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-medium text-forest-900">{t('cropScan.uploadTitle')}</h2>
            <button onClick={() => setStep('select')} className="text-sm text-forest-500 hover:text-forest-700 flex items-center gap-1">
              <ArrowLeft size={14} /> Change field
            </button>
          </div>

          {selectedField && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-forest-50 border border-forest-100 mb-4">
              <Sprout size={16} className="text-forest-600" />
              <span className="text-sm text-forest-700">{selectedField.name} ({selectedField.crop_type ?? 'Unknown crop'})</span>
            </div>
          )}

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
            className="relative border-2 border-dashed border-forest-200 rounded-2xl p-8 text-center cursor-pointer hover:border-forest-300 hover:bg-forest-50/30 transition-all"
          >
            {imageDataUrl ? (
              <div>
                <img src={imageDataUrl} alt="crop" className="max-h-64 mx-auto rounded-xl mb-4" />
                <p className="text-sm text-forest-500">Click to change the image</p>
              </div>
            ) : (
              <div>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-50 text-forest-400 mx-auto mb-4">
                  <Camera size={28} />
                </div>
                <p className="text-sm font-medium text-forest-700 mb-1">{t('cropScan.takePhoto')}</p>
                <p className="text-xs text-forest-400">{t('cropScan.uploadPhoto')}</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
          </div>

          {error && <p className="text-sm text-error-600 mt-3">{error}</p>}

          <div className="flex justify-between mt-6">
            <button onClick={() => setStep('select')} className="btn-ghost"><ArrowLeft size={16} /> Back</button>
            <button onClick={() => setStep('describe')} disabled={!imageDataUrl} className="btn-primary">
              Continue <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Step: Describe symptoms */}
      {step === 'describe' && (
        <div className="animate-fade-in">
          <h2 className="font-serif text-lg font-medium text-forest-900 mb-4">{t('cropScan.describeTitle')}</h2>

          {imageDataUrl && (
            <div className="flex gap-4 mb-6">
              <img src={imageDataUrl} alt="crop" className="w-24 h-24 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="text-sm text-forest-600 mb-2">The more you can describe, the better Neraya can help.</p>
                <button onClick={() => setStep('upload')} className="text-sm text-forest-500 hover:text-forest-700">Change photo</button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">{t('cropScan.symptomsLabel')}</label>
              <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} placeholder={t('cropScan.symptomsPlaceholder')} className="input-field min-h-[100px] resize-y" />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">{t('cropScan.observationsLabel')}</label>
              <textarea value={observations} onChange={e => setObservations(e.target.value)} placeholder={t('cropScan.observationsPlaceholder')} className="input-field min-h-[80px] resize-y" />
            </div>
          </div>

          {weather && (
            <div className="mt-4 p-3 rounded-xl bg-sky-50 border border-sky-100 flex items-start gap-2">
              <CloudSun size={16} className="text-sky-500 mt-0.5" />
              <p className="text-sm text-sky-700">Weather context: {weather.temperature}C, {weather.weather_description}, {weather.humidity}% humidity. This will be included in the analysis.</p>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button onClick={() => setStep('upload')} className="btn-ghost"><ArrowLeft size={16} /> Back</button>
            <button onClick={runAnalysis} className="btn-primary">
              <FlaskConical size={18} /> {t('cropScan.analyze')}
            </button>
          </div>
        </div>
      )}

      {/* Step: Analyzing */}
      {step === 'analyzing' && (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-forest-700 text-white">
              <FlaskConical size={36} />
            </div>
            <div className="absolute -inset-2 rounded-3xl border-2 border-forest-200 animate-pulse-soft" />
          </div>
          <h2 className="font-serif text-xl font-medium text-forest-900 mt-6 mb-2">{t('cropScan.analyzing')}</h2>
          <p className="text-sm text-forest-500 max-w-sm text-center">{t('cropScan.analyzingDesc')}</p>
        </div>
      )}

      {/* Step: Result */}
      {step === 'result' && result && (
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium text-forest-950">{t('cropScan.result')}</h2>
            <Badge variant="neutral">AI-assisted</Badge>
          </div>

          {/* Image + key info */}
          <div className="card p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {imageDataUrl && <img src={imageDataUrl} alt="crop" className="w-full md:w-48 h-48 rounded-xl object-cover" />}
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-1">{t('cropScan.possibleIssue')}</p>
                  <p className="text-lg font-medium text-forest-900">{result.possible_issue}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-1">{t('cropScan.confidence')}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-forest-100 overflow-hidden">
                        <div className={`h-full rounded-full ${
                          result.assessment_confidence === 'High' ? 'w-full bg-success-400' :
                          result.assessment_confidence === 'Moderate' ? 'w-2/3 bg-warning-400' :
                          result.assessment_confidence === 'Low' ? 'w-1/3 bg-error-400' :
                          'w-1/4 bg-forest-300'
                        }`} />
                      </div>
                      <span className="text-sm font-medium text-forest-700">{result.assessment_confidence}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-1">{t('cropScan.severity')}</p>
                    <Badge variant={result.severity === 'High' ? 'error' : result.severity === 'Moderate' ? 'warning' : result.severity === 'Low' ? 'success' : 'neutral'}>{result.severity}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Explanation */}
          {result.assessment_explanation && (
            <div className="card p-6">
              <h3 className="font-serif text-base font-medium text-forest-900 mb-3">{t('cropScan.explanation')}</h3>
              <p className="text-sm text-forest-600 leading-relaxed">{result.assessment_explanation}</p>
            </div>
          )}

          {/* Observed indicators */}
          {result.observed_indicators.length > 0 && (
            <div className="card p-6">
              <h3 className="font-serif text-base font-medium text-forest-900 mb-3 flex items-center gap-2"><Eye size={16} className="text-forest-500" /> {t('cropScan.observedIndicators')}</h3>
              <ul className="space-y-2">
                {result.observed_indicators.map((indicator, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-forest-600">
                    <div className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full bg-forest-400" /> {indicator}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Context factors */}
          {result.context_factors.length > 0 && (
            <div className="card p-6">
              <h3 className="font-serif text-base font-medium text-forest-900 mb-3 flex items-center gap-2"><Info size={16} className="text-forest-500" /> {t('cropScan.context')}</h3>
              <ul className="space-y-2">
                {result.context_factors.map((factor, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-forest-600">
                    <div className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full bg-forest-400" /> {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Evidence used */}
          {result.evidence_used.length > 0 && (
            <div className="card p-6">
              <h3 className="font-serif text-base font-medium text-forest-900 mb-3 flex items-center gap-2"><Check size={16} className="text-success-500" /> {t('cropScan.evidenceUsed')}</h3>
              <ul className="space-y-2">
                {result.evidence_used.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-forest-600">
                    <div className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full bg-success-400" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing evidence */}
          {result.missing_evidence.length > 0 && (
            <div className="card p-6">
              <h3 className="font-serif text-base font-medium text-forest-900 mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-warning-500" /> {t('cropScan.missingEvidence')}</h3>
              <ul className="space-y-2">
                {result.missing_evidence.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-forest-600">
                    <div className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full bg-warning-400" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What to check next */}
          {result.what_to_check.length > 0 && (
            <div className="card p-6">
              <h3 className="font-serif text-base font-medium text-forest-900 mb-3 flex items-center gap-2"><Eye size={16} className="text-forest-500" /> {t('cropScan.whatToCheck')}</h3>
              <ul className="space-y-2">
                {result.what_to_check.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-forest-600">
                    <div className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full bg-forest-400" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Environmental considerations */}
          {result.environmental_considerations && (
            <div className="card p-6">
              <h3 className="font-serif text-base font-medium text-forest-900 mb-3 flex items-center gap-2"><CloudSun size={16} className="text-sky-500" /> {t('cropScan.environmental')}</h3>
              <p className="text-sm text-forest-600 leading-relaxed">{result.environmental_considerations}</p>
            </div>
          )}

          {/* Decision support */}
          {result.recommendations.length > 0 && (
            <div className="card p-6">
              <h3 className="font-serif text-lg font-medium text-forest-900 mb-4 flex items-center gap-2"><Lightbulb size={18} className="text-forest-600" /> {t('cropScan.recommendations')}</h3>
              <div className="space-y-3">
                {result.recommendations.map((rec, i) => (
                  <DecisionOption key={i} number={i + 1} option={rec} />
                ))}
              </div>
            </div>
          )}

          {/* Escalation */}
          {result.escalation_guidance && (
            <div className="rounded-2xl border border-warning-200 bg-warning-50 p-6">
              <h3 className="font-serif text-base font-medium text-warning-800 mb-2 flex items-center gap-2"><AlertTriangle size={16} /> {t('cropScan.escalation')}</h3>
              <p className="text-sm text-warning-700 leading-relaxed">{result.escalation_guidance}</p>
            </div>
          )}

          {/* Explainable AI breakdown */}
          <ExplainableAI result={result} />

          {/* Shared farmer experiences */}
          {similarPosts.length > 0 && (
            <div className="card p-6">
              <h3 className="font-serif text-base font-medium text-forest-900 mb-2 flex items-center gap-2">
                <Users size={16} className="text-forest-500" /> Other farmers have shared similar observations.
              </h3>
              <p className="text-xs text-forest-400 mb-4">Farmer experience — not verified diagnosis. Community reports are experiences, not confirmed facts.</p>
              <div className="space-y-3">
                {similarPosts.map(post => (
                  <div key={post.id} className="rounded-xl border border-forest-100 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {post.is_anonymous && <span className="text-2xs text-forest-500">Anonymous Farmer</span>}
                      {post.crop_tag && <Badge variant="neutral" size="sm">{post.crop_tag}</Badge>}
                      {post.recovery_status && (
                        <span className="text-2xs text-forest-500">
                          {post.recovery_status === 'still_dealing' ? 'Still dealing with it' : post.recovery_status === 'improving' ? 'Improving' : 'Resolved'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-forest-900 mb-1">{post.title}</p>
                    <p className="text-xs text-forest-500 line-clamp-2">{post.content}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => onNavigate('community')} className="btn-secondary text-sm mt-4">
                <MessageSquare size={16} /> See their experiences
              </button>
            </div>
          )}

          {/* Disclaimer */}
          <div className="rounded-2xl border border-forest-100 bg-forest-50/50 p-4">
            <p className="text-xs text-forest-500 leading-relaxed">
              {t('cropScan.disclaimer')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => onNavigate('assistant')} className="btn-primary flex-1">
              <Lightbulb size={18} /> {t('cropScan.discussWith')}
            </button>
            <button onClick={reset} className="btn-secondary flex-1">
              {t('cropScan.scanAnother')}
            </button>
            <button
              onClick={() => savedAssessment && generateCropReportPDF(savedAssessment, selectedField)}
              disabled={!savedAssessment}
              className="btn-secondary flex-1"
            >
              <FileDown size={18} /> Download Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

async function compressImage(file: File, maxDim = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height / width) * maxDim);
            width = maxDim;
          } else {
            width = Math.round((width / height) * maxDim);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === 'image/png' ? 'image/jpeg' : file.type;
        resolve(canvas.toDataURL(mimeType, quality));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function DecisionOption({ number, option }: { number: number; option: { option: string; why: string; what_to_check?: string[]; conditions_to_consider?: string[] } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-forest-100 overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-forest-50/30 transition-all">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-100 text-forest-700 text-xs font-medium flex-shrink-0">{number}</div>
        <span className="text-sm font-medium text-forest-900 flex-1">{option.option}</span>
        {expanded ? <ChevronDown size={16} className="text-forest-400" /> : <ChevronRight size={16} className="text-forest-400" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 animate-fade-in">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-1">Why</p>
            <p className="text-sm text-forest-600">{option.why}</p>
          </div>
          {option.what_to_check && option.what_to_check.length > 0 && (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-1">What to check</p>
              <ul className="space-y-1">
                {option.what_to_check.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-forest-600">
                    <div className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full bg-forest-400" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {option.conditions_to_consider && option.conditions_to_consider.length > 0 && (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-1">Conditions to consider</p>
              <ul className="space-y-1">
                {option.conditions_to_consider.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-forest-600">
                    <div className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full bg-forest-400" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
