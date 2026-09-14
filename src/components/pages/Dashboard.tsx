import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { getFields, getAssessments, getAlerts } from '@/lib/db';
import { getWeather, describeHumidity, describeTemperature } from '@/lib/weather';
import type { Field, CropAssessment, Alert, WeatherData } from '@/types';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import Badge from '@/components/ui/Badge';
import WeatherIcon from '@/components/ui/WeatherIcon';
import FieldPulse from '@/components/ui/FieldPulse';
import {
  Sprout, CloudSun, Bell, FlaskConical, ArrowRight, MapPin,
  Calendar, Plus, AlertTriangle, TrendingUp, Droplets, Wind, Thermometer,
  MessageSquare, Sun, CloudRain, Info, Lightbulb,
} from '@/components/ui/Icons';
import type { AppPage } from '@/components/AppShell';

interface DashboardProps {
  onNavigate: (page: AppPage) => void;
  onOpenField: (fieldId: string) => void;
}

export default function Dashboard({ onNavigate, onOpenField }: DashboardProps) {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [fields, setFields] = useState<Field[]>([]);
  const [assessments, setAssessments] = useState<CropAssessment[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherAvailable, setWeatherAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const [f, a, al] = await Promise.all([
        getFields(profile.user_id),
        getAssessments(profile.user_id),
        getAlerts(profile.user_id),
      ]);
      setFields(f);
      setAssessments(a);
      setAlerts(al.filter(x => !x.is_read).slice(0, 5));

      if (profile.latitude && profile.longitude) {
        const w = await getWeather(profile.latitude, profile.longitude);
        setWeather(w.current);
        setWeatherAvailable(w.available);
      }
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <LoadingState label={t('common.loading')} />;

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-forest-500 mb-1">{today}</p>
        <h1 className="font-serif text-3xl font-medium text-forest-950">
          {t('dashboard.greeting', { name: firstName })}
        </h1>
        <p className="text-sm text-forest-500 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column - main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weather */}
          <section className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CloudSun size={18} className="text-sky-500" />
                <h2 className="font-serif text-lg font-medium text-forest-900">{t('dashboard.weather')}</h2>
              </div>
              {weatherAvailable && <Badge variant="info">Live data</Badge>}
            </div>
            {weatherAvailable && weather ? (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <WeatherStat icon={<WeatherIcon code={weather.weather_code} isDay={weather.is_day} size={20} />} label="Condition" value={weather.weather_description} />
                  <WeatherStat icon={<Thermometer size={18} />} label="Temperature" value={`${weather.temperature}C`} />
                  <WeatherStat icon={<Droplets size={18} />} label="Humidity" value={`${weather.humidity}%`} />
                  <WeatherStat icon={<Wind size={18} />} label="Wind" value={`${weather.wind_speed} km/h`} />
                </div>
                <div className="space-y-2 pt-3 border-t border-forest-100">
                  <p className="text-sm text-forest-600">{describeTemperature(weather.temperature)}</p>
                  <p className="text-sm text-forest-600">{describeHumidity(weather.humidity)}</p>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<CloudSun size={28} />}
                title={t('dashboard.weatherNotConnected')}
                description={t('dashboard.weatherNotConnectedDesc')}
                action={<button onClick={() => onNavigate('profile')} className="btn-secondary text-sm">{t('dashboard.connectWeather')}</button>}
              />
            )}
          </section>

          {/* Field Pulse Visualization */}
          <FieldPulse fields={fields} assessments={assessments} weather={weather} onOpenField={onOpenField} />

          {/* Farm Health overview */}
          {fields.length > 0 && (
            <section className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-forest-600" />
                  <h2 className="font-serif text-lg font-medium text-forest-900">Farm Health</h2>
                </div>
                <button onClick={() => onNavigate('fields')} className="text-sm text-forest-500 hover:text-forest-700 flex items-center gap-1">
                  {t('dashboard.viewAll')} <ArrowRight size={14} />
                </button>
              </div>
              <div className="space-y-3">
                {fields.map(field => {
                  const fieldAssessments = assessments.filter(a => a.field_id === field.id);
                  const latest = fieldAssessments[0];
                  const severity = latest?.severity;
                  const statusColor = severity === 'High' ? '#c45a4a' : severity === 'Moderate' ? '#c99846' : severity === 'Low' ? '#4d7c5e' : '#9ca89e';
                  const statusLabel = severity === 'High' ? 'Attention' : severity === 'Moderate' ? 'Monitor' : severity === 'Low' ? 'Healthy' : 'No assessment yet';
                  const trend = fieldAssessments.length >= 2
                    ? (fieldAssessments[0].severity === 'Low' && fieldAssessments[1].severity !== 'Low' ? 'Improving' :
                       fieldAssessments[0].severity === 'High' && fieldAssessments[1].severity !== 'High' ? 'Declining' : 'Stable')
                    : null;
                  return (
                    <button
                      key={field.id}
                      onClick={() => onOpenField(field.id)}
                      className="w-full text-left p-4 rounded-xl border border-forest-100 hover:border-forest-200 hover:bg-forest-50/50 transition-all"
                      aria-label={`Open ${field.name} field details`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor }} />
                          <h3 className="font-medium text-forest-900 text-sm truncate">{field.name}</h3>
                        </div>
                        <span className="text-2xs font-medium flex-shrink-0" style={{ color: statusColor }}>{statusLabel}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-forest-500 mb-2">
                        {field.crop_type && <span className="flex items-center gap-1"><Sprout size={11} /> {field.crop_type}</span>}
                        {field.growth_stage && <span>{field.growth_stage}</span>}
                        {fieldAssessments.length > 0 && <span>{fieldAssessments.length} scan{fieldAssessments.length > 1 ? 's' : ''}</span>}
                        {trend && <span className="text-forest-400">{trend}</span>}
                      </div>
                      {latest ? (
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-forest-500 truncate">
                            Last scan: {new Date(latest.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {latest.possible_issue && ` - ${latest.possible_issue}`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-forest-400">No assessment yet</span>
                          <span className="text-xs text-forest-500 flex items-center gap-1"><FlaskConical size={11} /> Scan crop</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Farm-level timeline */}
              {assessments.length > 0 && (
                <div className="mt-6 pt-4 border-t border-forest-100">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-3">Field health over time</p>
                  <div className="space-y-2.5">
                    {fields.map(field => {
                      const fieldAssessments = assessments
                        .filter(a => a.field_id === field.id)
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                      if (fieldAssessments.length === 0) return null;
                      return (
                        <div key={field.id} className="flex items-center gap-3">
                          <span className="text-xs text-forest-600 w-28 flex-shrink-0 truncate">{field.name}</span>
                          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
                            {fieldAssessments.map((a, i) => {
                              const color = a.severity === 'High' ? '#c45a4a' : a.severity === 'Moderate' ? '#c99846' : '#4d7c5e';
                              return (
                                <div key={a.id} className="flex items-center gap-1.5 flex-shrink-0">
                                  {i > 0 && <span className="text-forest-200 text-xs">{'\u2192'}</span>}
                                  <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                    <span className="text-2xs text-forest-500">{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Fields */}
          <section className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sprout size={18} className="text-forest-600" />
                <h2 className="font-serif text-lg font-medium text-forest-900">{t('dashboard.myFields')}</h2>
              </div>
              <button onClick={() => onNavigate('fields')} className="text-sm text-forest-500 hover:text-forest-700 flex items-center gap-1">
                {t('dashboard.viewAll')} <ArrowRight size={14} />
              </button>
            </div>
            {fields.length === 0 ? (
              <EmptyState
                icon={<Sprout size={28} />}
                title={t('fields.empty')}
                description={t('fields.emptyDesc')}
                action={<button onClick={() => onNavigate('fields')} className="btn-primary text-sm"><Plus size={16} /> {t('fields.add')}</button>}
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {fields.slice(0, 4).map(field => (
                  <button
                    key={field.id}
                    onClick={() => onOpenField(field.id)}
                    className="text-left p-4 rounded-xl border border-forest-100 hover:border-forest-200 hover:bg-forest-50/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-forest-900 text-sm">{field.name}</h3>
                      {field.growth_stage && <Badge variant="default">{field.growth_stage}</Badge>}
                    </div>
                    <div className="space-y-1 text-xs text-forest-500">
                      {field.crop_type && <p className="flex items-center gap-1.5"><Sprout size={12} /> {field.crop_type}{field.crop_variety ? ` (${field.crop_variety})` : ''}</p>}
                      {field.location_text && <p className="flex items-center gap-1.5"><MapPin size={12} /> {field.location_text}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Recent assessments */}
          <section className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FlaskConical size={18} className="text-forest-600" />
                <h2 className="font-serif text-lg font-medium text-forest-900">{t('dashboard.recentScans')}</h2>
              </div>
              <button onClick={() => onNavigate('crop-intelligence')} className="text-sm text-forest-500 hover:text-forest-700 flex items-center gap-1">
                {t('dashboard.newScan')} <ArrowRight size={14} />
              </button>
            </div>
            {assessments.length === 0 ? (
              <EmptyState
                icon={<FlaskConical size={28} />}
                title={t('dashboard.noScans')}
                description={t('dashboard.noScansDesc')}
                action={<button onClick={() => onNavigate('crop-intelligence')} className="btn-primary text-sm"><FlaskConical size={16} /> {t('dashboard.scanCrop')}</button>}
              />
            ) : (
              <div className="space-y-3">
                {assessments.slice(0, 3).map(assessment => (
                  <div key={assessment.id} className="flex items-start gap-3 p-3 rounded-xl border border-forest-100">
                    {assessment.image_url ? (
                      <img src={assessment.image_url} alt="crop" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-forest-50 flex items-center justify-center flex-shrink-0">
                        <FlaskConical size={20} className="text-forest-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-forest-900 truncate">{assessment.possible_issue ?? 'Assessment'}</p>
                        {assessment.severity && <Badge variant={assessment.severity === 'High' ? 'error' : assessment.severity === 'Moderate' ? 'warning' : 'success'}>{assessment.severity}</Badge>}
                      </div>
                      <p className="text-xs text-forest-500">{new Date(assessment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column - sidebar */}
        <div className="space-y-6">
          {/* Recommended next action */}
          <section className="card p-6 bg-gradient-to-br from-forest-50 to-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-700 text-white">
                <Lightbulb size={16} />
              </div>
              <h2 className="font-serif text-base font-medium text-forest-900">{t('dashboard.recommendedNext')}</h2>
            </div>
            {assessments.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-forest-600 leading-relaxed">
                  Your last scan showed {assessments[0].possible_issue ?? 'a possible issue'} with {assessments[0].severity ?? 'unknown'} severity.
                </p>
                <div className="rounded-xl bg-white border border-forest-100 p-3">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-forest-400 mb-1">Why</p>
                  <p className="text-sm text-forest-600">
                    {weatherAvailable && weather
                      ? `Current conditions (${weather.temperature}C, ${weather.humidity}% humidity) may be relevant to what you observed.`
                      : 'Following up on a recent assessment helps track whether things are improving or worsening.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onNavigate('crop-intelligence')} className="btn-primary flex-1 text-sm">
                    <FlaskConical size={16} /> Rescan crop
                  </button>
                  <button onClick={() => onNavigate('assistant')} className="btn-secondary flex-1 text-sm">
                    <MessageSquare size={16} /> Ask Neraya
                  </button>
                </div>
              </div>
            ) : fields.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-forest-600 leading-relaxed">
                  You have {fields.length} field{fields.length > 1 ? 's' : ''} set up. When you notice something different in your crop, take a photo and bring it to Neraya for a closer look.
                </p>
                <button onClick={() => onNavigate('crop-intelligence')} className="btn-primary w-full text-sm">
                  <FlaskConical size={16} /> Scan a crop
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-forest-600 leading-relaxed">
                  Add a field and scan your first crop to get personalized insights from Neraya.
                </p>
                <button onClick={() => onNavigate('fields')} className="btn-secondary w-full text-sm">
                  <Plus size={16} /> Add your first field
                </button>
              </div>
            )}
          </section>

          {/* Alerts */}
          <section className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-forest-600" />
                <h2 className="font-serif text-base font-medium text-forest-900">{t('dashboard.attention')}</h2>
              </div>
              {alerts.length > 0 && <Badge variant="warning">{alerts.length} new</Badge>}
            </div>
            {alerts.length === 0 ? (
              <div className="py-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-50 text-success-500 mx-auto mb-3">
                  <Info size={20} />
                </div>
                <p className="text-sm text-forest-500">{t('dashboard.noAlerts')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map(alert => (
                  <div key={alert.id} className={`p-3 rounded-xl border ${
                    alert.severity === 'urgent' ? 'border-error-200 bg-error-50' :
                    alert.severity === 'warning' ? 'border-warning-200 bg-warning-50' :
                    'border-forest-100 bg-forest-50/50'
                  }`}>
                    <div className="flex items-start gap-2">
                      {alert.severity === 'urgent' ? <AlertTriangle size={14} className="text-error-500 mt-0.5" /> :
                       alert.severity === 'warning' ? <AlertTriangle size={14} className="text-warning-500 mt-0.5" /> :
                       <Info size={14} className="text-forest-500 mt-0.5" />}
                      <div>
                        <p className="text-sm font-medium text-forest-900">{alert.title}</p>
                        {alert.body && <p className="text-xs text-forest-500 mt-0.5">{alert.body}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick actions */}
          <section className="card p-6">
            <h2 className="font-serif text-base font-medium text-forest-900 mb-4">{t('dashboard.quickActions')}</h2>
            <div className="space-y-2">
              <button onClick={() => onNavigate('crop-intelligence')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-forest-100 hover:bg-forest-50 transition-all text-left">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-50 text-forest-600"><FlaskConical size={16} /></div>
                <div>
                  <p className="text-sm font-medium text-forest-800">Scan a crop</p>
                  <p className="text-xs text-forest-400">Analyze a crop image</p>
                </div>
              </button>
              <button onClick={() => onNavigate('assistant')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-forest-100 hover:bg-forest-50 transition-all text-left">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-50 text-forest-600"><MessageSquare size={16} /></div>
                <div>
                  <p className="text-sm font-medium text-forest-800">Ask Neraya</p>
                  <p className="text-xs text-forest-400">Chat about your crop</p>
                </div>
              </button>
              <button onClick={() => onNavigate('community')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-forest-100 hover:bg-forest-50 transition-all text-left">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-50 text-forest-600"><MessageSquare size={16} /></div>
                <div>
                  <p className="text-sm font-medium text-forest-800">Community</p>
                  <p className="text-xs text-forest-400">See what others are seeing</p>
                </div>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function WeatherStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-forest-400 mb-1">{icon}<span className="text-2xs uppercase tracking-wider font-medium">{label}</span></div>
      <p className="text-sm font-medium text-forest-900 capitalize">{value}</p>
    </div>
  );
}
