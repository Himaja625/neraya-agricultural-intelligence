import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getField, getAssessments, updateField } from '@/lib/db';
import { getWeather, describeHumidity, describeTemperature, describeWind, describePrecipitationForecast, describeDryConditions } from '@/lib/weather';
import type { Field, CropAssessment, WeatherData, WeatherForecast } from '@/types';
import { GROWTH_STAGES } from '@/types';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import WeatherIcon from '@/components/ui/WeatherIcon';
import HealthTimeline, { WeatherRiskGauge } from '@/components/ui/HealthTimeline';
import {
  ArrowLeft, Sprout, MapPin, Calendar, FlaskConical, CloudSun,
  Thermometer, Droplets, Wind, TrendingUp, History, Edit3, Check, X,
  Lightbulb, AlertTriangle, Info, FileDown, Eye,
} from '@/components/ui/Icons';
import { generateCropReportPDF } from '@/lib/report';
import type { AppPage } from '@/components/AppShell';

interface FieldDetailProps {
  fieldId: string;
  onBack: () => void;
  onNavigate: (page: AppPage) => void;
}

export default function FieldDetail({ fieldId, onBack, onNavigate }: FieldDetailProps) {
  const { profile } = useAuth();
  const [field, setField] = useState<Field | null>(null);
  const [assessments, setAssessments] = useState<CropAssessment[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [weatherAvailable, setWeatherAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editGrowth, setEditGrowth] = useState('');
  const [viewingAssessment, setViewingAssessment] = useState<CropAssessment | null>(null);

  useEffect(() => {
    (async () => {
      const f = await getField(fieldId);
      setField(f);
      setEditGrowth(f?.growth_stage ?? '');
      if (f) {
        const a = await getAssessments(f.user_id, fieldId);
        setAssessments(a);
        if (f.latitude && f.longitude) {
          const w = await getWeather(f.latitude, f.longitude);
          setWeather(w.current);
          setForecast(w.forecast);
          setWeatherAvailable(w.available);
        }
      }
      setLoading(false);
    })();
  }, [fieldId]);

  async function saveGrowthStage() {
    if (!field) return;
    await updateField(field.id, { growth_stage: editGrowth || null });
    setField({ ...field, growth_stage: editGrowth || null });
    setEditing(false);
  }

  if (loading) return <LoadingState label="Loading field..." />;

  if (!field) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
        <EmptyState icon={<Sprout size={28} />} title="Field not found" description="This field may have been deleted." action={<button onClick={onBack} className="btn-secondary">Back to fields</button>} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-forest-500 hover:text-forest-700 mb-6">
        <ArrowLeft size={16} /> Back to fields
      </button>

      {/* Field header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-medium text-forest-950 mb-2">{field.name}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-forest-500">
              {field.crop_type && <span className="flex items-center gap-1.5"><Sprout size={14} /> {field.crop_type}{field.crop_variety ? ` (${field.crop_variety})` : ''}</span>}
              {field.location_text && <span className="flex items-center gap-1.5"><MapPin size={14} /> {field.location_text}</span>}
              {field.planting_date && <span className="flex items-center gap-1.5"><Calendar size={14} /> Planted {new Date(field.planting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
              {field.area_size && <span className="flex items-center gap-1.5"><Sprout size={14} /> {field.area_size}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <select value={editGrowth} onChange={e => setEditGrowth(e.target.value)} className="input-field py-2 text-sm">
                  <option value="">No stage</option>
                  {GROWTH_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={saveGrowthStage} className="btn-primary py-2"><Check size={16} /></button>
                <button onClick={() => setEditing(false)} className="btn-secondary py-2"><X size={16} /></button>
              </>
            ) : (
              <>
                {field.growth_stage && <Badge variant="success">{field.growth_stage}</Badge>}
                <button onClick={() => setEditing(true)} className="btn-ghost py-2"><Edit3 size={16} /></button>
              </>
            )}
          </div>
        </div>
        {field.notes && <p className="text-sm text-forest-600 mt-4 pt-4 border-t border-forest-100">{field.notes}</p>}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left - main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Health overview */}
          <section className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical size={18} className="text-forest-600" />
              <h2 className="font-serif text-lg font-medium text-forest-900">Health</h2>
            </div>
            {assessments.length === 0 ? (
              <EmptyState
                icon={<FlaskConical size={28} />}
                title="No assessments yet."
                description="You haven't checked this crop yet. When something looks different, you can bring it here."
                action={<button onClick={() => onNavigate('crop-intelligence')} className="btn-primary text-sm"><FlaskConical size={16} /> Scan this crop</button>}
              />
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                    assessments[0].severity === 'High' ? 'bg-error-50 text-error-500' :
                    assessments[0].severity === 'Moderate' ? 'bg-warning-50 text-warning-500' :
                    assessments[0].severity === 'Low' ? 'bg-success-50 text-success-500' :
                    'bg-forest-50 text-forest-400'
                  }`}>
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-forest-900">{assessments[0].possible_issue ?? 'Assessment recorded'}</p>
                    <p className="text-xs text-forest-500">{new Date(assessments[0].created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onNavigate('crop-intelligence')} className="btn-secondary flex-1 text-sm">
                    <FlaskConical size={16} /> New scan
                  </button>
                  <button onClick={() => setViewingAssessment(assessments[0])} className="btn-secondary flex-1 text-sm">
                    <Eye size={16} /> View assessment
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Health Timeline Chart */}
          <section className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-forest-600" />
              <h2 className="font-serif text-lg font-medium text-forest-900">Health Timeline</h2>
            </div>
            <HealthTimeline
              assessments={assessments}
              onViewAssessment={(id) => {
                const a = assessments.find(x => x.id === id);
                if (a) setViewingAssessment(a);
              }}
            />
          </section>

          {/* Timeline list */}
          <section className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <History size={18} className="text-forest-600" />
              <h2 className="font-serif text-lg font-medium text-forest-900">Field History</h2>
            </div>
            {assessments.length === 0 ? (
              <p className="text-sm text-forest-500 py-4">Your field history will grow as you record assessments and observations.</p>
            ) : (
              <div className="space-y-0">
                {assessments.map((a, i) => (
                  <div key={a.id} className="flex gap-3 pb-5 last:pb-0 relative">
                    {i < assessments.length - 1 && <div className="absolute left-[15px] top-8 bottom-0 w-px bg-forest-100" />}
                    <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      a.severity === 'High' ? 'bg-error-50 border-error-200 text-error-500' :
                      a.severity === 'Moderate' ? 'bg-warning-50 border-warning-200 text-warning-500' :
                      'bg-success-50 border-success-200 text-success-500'
                    }`}>
                      <FlaskConical size={14} />
                    </div>
                    <div className="pt-1 flex-1">
                      <div className="text-2xs font-medium text-forest-400 uppercase tracking-wider mb-0.5">{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      <div className="text-sm font-medium text-forest-900">{a.possible_issue ?? 'Assessment'}</div>
                      {a.assessment_explanation && <p className="text-xs text-forest-500 mt-0.5 line-clamp-2">{a.assessment_explanation}</p>}
                      {a.severity && <div className="mt-1"><Badge variant={a.severity === 'High' ? 'error' : a.severity === 'Moderate' ? 'warning' : 'success'} size="sm">{a.severity}</Badge></div>}
                      <button onClick={() => setViewingAssessment(a)} className="mt-1.5 text-xs text-forest-500 hover:text-forest-700 flex items-center gap-1">
                        <Eye size={12} /> View assessment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Before vs Now */}
          {assessments.length >= 2 && (
            <section className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-forest-600" />
                <h2 className="font-serif text-lg font-medium text-forest-900">Before vs Now</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[assessments[1], assessments[0]].map((a, idx) => (
                  <div key={a.id} className="rounded-xl border border-forest-100 overflow-hidden">
                    <div className="p-3 bg-forest-50/50 border-b border-forest-100">
                      <p className="text-2xs font-medium uppercase tracking-wider text-forest-400">{idx === 0 ? 'Previous scan' : 'Current scan'}</p>
                      <p className="text-xs text-forest-500 mt-0.5">{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    {a.image_url ? (
                      <img src={a.image_url} alt="crop" className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-forest-50 flex items-center justify-center"><FlaskConical size={24} className="text-forest-300" /></div>
                    )}
                    <div className="p-3">
                      <p className="text-sm font-medium text-forest-900">{a.possible_issue ?? 'N/A'}</p>
                      {a.severity && <div className="mt-1"><Badge variant={a.severity === 'High' ? 'error' : a.severity === 'Moderate' ? 'warning' : 'success'} size="sm">{a.severity}</Badge></div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right - weather and context */}
        <div className="space-y-6">
          {/* Environmental conditions */}
          <section className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <CloudSun size={18} className="text-sky-500" />
              <h2 className="font-serif text-base font-medium text-forest-900">Environmental Conditions</h2>
            </div>
            {weatherAvailable && weather ? (
              <div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl bg-forest-50 border border-forest-100 p-3">
                    <WeatherIcon code={weather.weather_code} isDay={weather.is_day} size={20} className="text-forest-500 mb-1" />
                    <p className="text-sm font-medium text-forest-900">{weather.temperature}C</p>
                    <p className="text-2xs text-forest-400 capitalize">{weather.weather_description}</p>
                  </div>
                  <div className="rounded-xl bg-forest-50 border border-forest-100 p-3">
                    <Droplets size={20} className="text-sky-400 mb-1" />
                    <p className="text-sm font-medium text-forest-900">{weather.humidity}%</p>
                    <p className="text-2xs text-forest-400">Humidity</p>
                  </div>
                  <div className="rounded-xl bg-forest-50 border border-forest-100 p-3">
                    <Wind size={20} className="text-forest-400 mb-1" />
                    <p className="text-sm font-medium text-forest-900">{weather.wind_speed}</p>
                    <p className="text-2xs text-forest-400">km/h wind</p>
                  </div>
                  <div className="rounded-xl bg-forest-50 border border-forest-100 p-3">
                    <Thermometer size={20} className="text-earth-400 mb-1" />
                    <p className="text-sm font-medium text-forest-900">{weather.feels_like}C</p>
                    <p className="text-2xs text-forest-400">Feels like</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-forest-600 pt-3 border-t border-forest-100">
                  <p>{describeTemperature(weather.temperature)}</p>
                  <p>{describeHumidity(weather.humidity)}</p>
                  <p>{describeWind(weather.wind_speed)}</p>
                  {describePrecipitationForecast(forecast).map((msg, i) => (
                    <p key={`rain-${i}`} className="text-sky-700">{msg}</p>
                  ))}
                  {weather.humidity >= 75 && (
                    <p className="text-warning-700">Elevated humidity may create conditions favorable to some crop diseases.</p>
                  )}
                  {forecast.length > 0 && forecast.some(f => f.temp_max >= 35) && (
                    <p className="text-error-700">High temperatures expected soon. Monitor vulnerable plants for heat stress.</p>
                  )}
                  {describeDryConditions(forecast).map((msg, i) => (
                    <p key={`dry-${i}`} className="text-earth-600">{msg}</p>
                  ))}
                </div>
                <WeatherRiskGauge weather={weather} forecast={forecast} />

                {forecast.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-forest-100">
                    <p className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-2">5-day forecast</p>
                    <div className="flex justify-between gap-1">
                      {forecast.slice(0, 5).map((f, i) => (
                        <div key={i} className="flex-1 text-center p-1.5 rounded-lg bg-forest-50/50">
                          <p className="text-2xs text-forest-500">{new Date(f.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                          <WeatherIcon code={f.weather_code} size={14} className="mx-auto my-1 text-forest-400" />
                          <p className="text-xs font-medium text-forest-700">{f.temp_max}</p>
                          <p className="text-2xs text-forest-400">{f.temp_min}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon={<CloudSun size={24} />}
                title="Weather not connected"
                description="Add your location to get real weather data for this field."
                className="py-8"
              />
            )}
          </section>

          {/* AI Insight */}
          <section className="card p-6 bg-gradient-to-br from-forest-50 to-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-700 text-white">
                <Lightbulb size={16} />
              </div>
              <h2 className="font-serif text-base font-medium text-forest-900">Field Insight</h2>
            </div>
            {assessments.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-forest-600 leading-relaxed">
                  Your last assessment showed {assessments[0].possible_issue ?? 'an issue'} with {assessments[0].severity ?? 'unknown'} severity. {weatherAvailable && weather ? `Current conditions are ${weather.temperature}C with ${weather.humidity}% humidity, which may be relevant.` : ''}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => onNavigate('assistant')} className="btn-secondary flex-1 text-sm">
                    Ask Neraya about this field
                  </button>
                  <button onClick={() => generateCropReportPDF(assessments[0], field)} className="btn-secondary text-sm">
                    <FileDown size={16} /> Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-forest-600 leading-relaxed">
                  Scan this crop to get personalized insights based on what Neraya sees and the current conditions.
                </p>
                <button onClick={() => onNavigate('crop-intelligence')} className="btn-secondary w-full text-sm">
                  Scan this crop
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Assessment detail modal */}
      <Modal
        open={!!viewingAssessment}
        onClose={() => setViewingAssessment(null)}
        title="Crop Assessment"
        size="md"
      >
        {viewingAssessment && (
          <div className="space-y-4">
            {viewingAssessment.image_url && (
              <img src={viewingAssessment.image_url} alt="crop" className="w-full max-h-64 object-cover rounded-xl" />
            )}
            <div>
              <p className="text-2xs font-medium text-forest-400 uppercase tracking-wider mb-1">
                {new Date(viewingAssessment.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-base font-medium text-forest-900">{viewingAssessment.possible_issue ?? 'Assessment'}</p>
            </div>
            <div className="flex items-center gap-3">
              {viewingAssessment.severity && <Badge variant={viewingAssessment.severity === 'High' ? 'error' : viewingAssessment.severity === 'Moderate' ? 'warning' : 'success'}>{viewingAssessment.severity}</Badge>}
              {viewingAssessment.assessment_confidence && <span className="text-xs text-forest-500">Confidence: {viewingAssessment.assessment_confidence}</span>}
            </div>
            {viewingAssessment.assessment_explanation && (
              <p className="text-sm text-forest-600">{viewingAssessment.assessment_explanation}</p>
            )}
            {viewingAssessment.symptoms_description && (
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-1">What you noticed</p>
                <p className="text-sm text-forest-600">{viewingAssessment.symptoms_description}</p>
              </div>
            )}
            {viewingAssessment.recommendations && viewingAssessment.recommendations.length > 0 && (
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-2">Recommendations</p>
                <div className="space-y-2">
                  {viewingAssessment.recommendations.map((rec, i) => (
                    <div key={i} className="rounded-xl border border-forest-100 p-3">
                      <p className="text-sm font-medium text-forest-900">{rec.option}</p>
                      <p className="text-xs text-forest-500 mt-0.5">{rec.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => generateCropReportPDF(viewingAssessment, field)} className="btn-secondary text-sm">
                <FileDown size={16} /> Download report
              </button>
              <button onClick={() => setViewingAssessment(null)} className="btn-secondary text-sm">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
