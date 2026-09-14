import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { upsertProfile, getFields } from '@/lib/db';
import { LANGUAGE_LABELS, type Language, type Field } from '@/types';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import Badge from '@/components/ui/Badge';
import {
  User, MapPin, Sprout, Globe, Bell, Check, Loader2,
  Settings, ShieldCheck, FlaskConical,
} from '@/components/ui/Icons';

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth();
  const { t } = useI18n();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [language, setLanguage] = useState<Language>((profile?.preferred_language as Language) ?? 'en');
  const [locationText, setLocationText] = useState(profile?.location_text ?? '');
  const [farmSize, setFarmSize] = useState(profile?.farm_size ?? '');
  const [experience, setExperience] = useState(profile?.farming_experience ?? '');
  const [crops, setCrops] = useState<string[]>(profile?.crops_grown ?? []);
  const [newCrop, setNewCrop] = useState('');
  const [notifPrefs, setNotifPrefs] = useState(profile?.notification_preferences ?? { weather: true, crop: true, community: true, alerts: true });

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setLanguage((profile.preferred_language as Language) ?? 'en');
    setLocationText(profile.location_text ?? '');
    setFarmSize(profile.farm_size ?? '');
    setExperience(profile.farming_experience ?? '');
    setCrops(profile.crops_grown ?? []);
    setNotifPrefs(profile.notification_preferences ?? { weather: true, crop: true, community: true, alerts: true });
    getFields(profile.user_id).then(f => { setFields(f); setLoading(false); });
  }, [profile]);

  function addCrop() {
    if (newCrop.trim() && !crops.includes(newCrop.trim())) {
      setCrops([...crops, newCrop.trim()]);
      setNewCrop('');
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    await upsertProfile(user.id, {
      full_name: fullName,
      preferred_language: language,
      location_text: locationText,
      farm_size: farmSize,
      farming_experience: experience,
      crops_grown: crops,
      notification_preferences: notifPrefs,
    });
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <LoadingState label={t('common.loading')} />;

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-medium text-forest-950">{t('profile.title')}</h1>
        <p className="text-sm text-forest-500 mt-1">Manage your information and preferences.</p>
      </div>

      <div className="space-y-6">
        {/* Account info */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-forest-600" />
            <h2 className="font-serif text-lg font-medium text-forest-900">Account</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">Full name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">Email</label>
              <input type="email" value={user?.email ?? ''} disabled className="input-field opacity-60" />
            </div>
          </div>
        </section>

        {/* Language */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-forest-600" />
            <h2 className="font-serif text-lg font-medium text-forest-900">{t('profile.language')}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(LANGUAGE_LABELS) as Language[]).map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                  language === lang ? 'border-forest-400 bg-forest-50 text-forest-800 ring-2 ring-forest-200' : 'border-forest-200 text-forest-600 hover:border-forest-300'
                }`}
              >
                {LANGUAGE_LABELS[lang]}
              </button>
            ))}
          </div>
          <p className="text-xs text-forest-400 mt-2">{t('onboarding.languageDesc')}</p>
        </section>

        {/* Location */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={18} className="text-forest-600" />
            <h2 className="font-serif text-lg font-medium text-forest-900">Location</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1.5">Your location</label>
            <input type="text" value={locationText} onChange={e => setLocationText(e.target.value)} placeholder="e.g. Anantapur, Andhra Pradesh" className="input-field" />
            <p className="text-xs text-forest-400 mt-2">Used for weather data and regional context. Your exact location is never shared with the community.</p>
          </div>
        </section>

        {/* Farming info */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sprout size={18} className="text-forest-600" />
            <h2 className="font-serif text-lg font-medium text-forest-900">Farming</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">Crops you grow</label>
              {crops.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {crops.map(crop => (
                    <span key={crop} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest-50 border border-forest-100 text-sm text-forest-700">
                      <Sprout size={12} /> {crop}
                      <button onClick={() => setCrops(crops.filter(c => c !== crop))} className="text-forest-400 hover:text-error-500">×</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" value={newCrop} onChange={e => setNewCrop(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCrop(); } }} placeholder="Add a crop" className="input-field" />
                <button onClick={addCrop} className="btn-secondary px-4">Add</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1.5">Experience</label>
                <select value={experience} onChange={e => setExperience(e.target.value)} className="input-field">
                  <option value="">Select</option>
                  <option value="less_than_1">Less than 1 year</option>
                  <option value="1_to_5">1 to 5 years</option>
                  <option value="5_to_15">5 to 15 years</option>
                  <option value="15_plus">More than 15 years</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1.5">Farm size</label>
                <input type="text" value={farmSize} onChange={e => setFarmSize(e.target.value)} placeholder="e.g. 2 acres" className="input-field" />
              </div>
            </div>
          </div>
        </section>

        {/* Fields summary */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical size={18} className="text-forest-600" />
            <h2 className="font-serif text-lg font-medium text-forest-900">Your Fields</h2>
            <Badge variant="default" size="sm">{fields.length}</Badge>
          </div>
          {fields.length === 0 ? (
            <p className="text-sm text-forest-500">You haven't added any fields yet.</p>
          ) : (
            <div className="space-y-2">
              {fields.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-xl border border-forest-100">
                  <div>
                    <p className="text-sm font-medium text-forest-800">{f.name}</p>
                    <p className="text-xs text-forest-400">{f.crop_type ?? 'No crop set'}</p>
                  </div>
                  {f.growth_stage && <Badge variant="success" size="sm">{f.growth_stage}</Badge>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Notification preferences */}
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={18} className="text-forest-600" />
            <h2 className="font-serif text-lg font-medium text-forest-900">Notifications</h2>
          </div>
          <div className="space-y-3">
            {([
              { key: 'weather', label: 'Weather alerts', desc: 'Important weather changes for your fields' },
              { key: 'crop', label: 'Crop reminders', desc: 'Follow-up scan and observation reminders' },
              { key: 'community', label: 'Community activity', desc: 'Replies and reactions to your posts' },
              { key: 'alerts', label: 'System alerts', desc: 'Important changes in your assessments' },
            ] as const).map(item => (
              <label key={item.key} className="flex items-center justify-between p-3 rounded-xl border border-forest-100 cursor-pointer hover:bg-forest-50/30">
                <div>
                  <p className="text-sm font-medium text-forest-800">{item.label}</p>
                  <p className="text-xs text-forest-400">{item.desc}</p>
                </div>
                <button
                  onClick={() => setNotifPrefs({ ...notifPrefs, [item.key]: !notifPrefs[item.key] })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${notifPrefs[item.key] ? 'bg-forest-600' : 'bg-forest-200'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notifPrefs[item.key] ? 'translate-x-5' : ''}`} />
                </button>
              </label>
            ))}
          </div>
        </section>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-success-600 flex items-center gap-1"><Check size={16} /> {t('profile.saved')}</span>}
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {t('profile.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
