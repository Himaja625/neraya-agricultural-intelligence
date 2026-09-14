import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { upsertProfile } from '@/lib/db';
import { LANGUAGE_LABELS, type Language } from '@/types';
import Logo from './ui/Logo';
import {
  ArrowRight, ArrowLeft, MapPin, Sprout, User, Loader2, Check,
  Globe, FlaskConical,
} from './ui/Icons';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { user, refreshProfile } = useAuth();
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const [locationText, setLocationText] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [crops, setCrops] = useState<string[]>([]);
  const [newCrop, setNewCrop] = useState('');
  const [experience, setExperience] = useState('');
  const [farmSize, setFarmSize] = useState('');

  const steps = [
    { title: t('onboarding.welcome'), subtitle: t('onboarding.welcomeDesc') },
    { title: t('onboarding.name'), subtitle: t('onboarding.nameLabel') },
    { title: t('onboarding.language'), subtitle: t('onboarding.languageDesc') },
    { title: t('onboarding.location'), subtitle: t('onboarding.locationLabel') },
    { title: t('onboarding.crops'), subtitle: t('onboarding.cropsLabel') },
    { title: t('onboarding.experience'), subtitle: t('onboarding.experienceLabel') },
  ];

  function addCrop() {
    if (newCrop.trim() && !crops.includes(newCrop.trim())) {
      setCrops([...crops, newCrop.trim()]);
      setNewCrop('');
    }
  }

  function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          if (!locationText) {
            setLocationText(`${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
          }
        },
        () => {}
      );
    }
  }

  async function finish() {
    setLoading(true);
    try {
      await upsertProfile(user!.id, {
        full_name: fullName,
        preferred_language: language,
        location_text: locationText,
        latitude,
        longitude,
        crops_grown: crops,
        farming_experience: experience,
        farm_size: farmSize,
        onboarding_completed: true,
      });
      await refreshProfile();
      onComplete();
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (step < steps.length - 1) setStep(step + 1);
    else finish();
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  const canProceed = () => {
    if (step === 1) return fullName.trim().length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-forest-50 flex flex-col">
      <div className="px-6 py-5 border-b border-forest-100 bg-white">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-forest-600' : i < step ? 'w-1.5 bg-forest-400' : 'w-1.5 bg-forest-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-medium text-forest-950 mb-2">{steps[step].title}</h1>
            <p className="text-sm text-forest-500">{steps[step].subtitle}</p>
          </div>

          <div className="animate-fade-in-up" key={step}>
            {step === 0 && (
              <div className="text-center py-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-forest-700 text-white mx-auto mb-6">
                  <Sprout size={36} />
                </div>
                <p className="text-base text-forest-600 leading-relaxed max-w-sm mx-auto">
                  Neraya is here to help you understand what's happening in your fields and make better decisions. Let's get started.
                </p>
              </div>
            )}

            {step === 1 && (
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">{t('onboarding.nameLabel')}</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Ravi Kumar"
                    className="input-field pl-10"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2">
                {(Object.keys(LANGUAGE_LABELS) as Language[]).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      language === lang
                        ? 'border-forest-400 bg-forest-50 ring-2 ring-forest-200'
                        : 'border-forest-200 bg-white hover:border-forest-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Globe size={18} className={language === lang ? 'text-forest-600' : 'text-forest-400'} />
                      <span className="text-sm font-medium text-forest-800">{LANGUAGE_LABELS[lang]}</span>
                    </div>
                    {language === lang && <Check size={18} className="text-forest-600" />}
                  </button>
                ))}
                <p className="text-xs text-forest-400 mt-2 px-1">
                  {t('onboarding.languageDesc')}
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-forest-700 mb-2">{t('onboarding.locationLabel')}</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-400" />
                  <input
                    type="text"
                    value={locationText}
                    onChange={e => setLocationText(e.target.value)}
                    placeholder="e.g. Anantapur, Andhra Pradesh"
                    className="input-field pl-10"
                  />
                </div>
                <button
                  onClick={getLocation}
                  className="btn-secondary w-full text-sm"
                >
                  <MapPin size={16} />
                  {t('onboarding.useLocation')}
                </button>
                {latitude !== null && (
                  <p className="text-xs text-success-600 flex items-center gap-1.5">
                    <Check size={14} /> Location detected: {latitude.toFixed(2)}, {longitude?.toFixed(2)}
                  </p>
                )}
                <p className="text-xs text-forest-400">
                  We use this for weather data and regional context. Your exact location is never shared with the community.
                </p>
              </div>
            )}

            {step === 4 && (
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">{t('onboarding.cropsLabel')}</label>
                {crops.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {crops.map(crop => (
                      <span key={crop} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest-50 border border-forest-100 text-sm text-forest-700">
                        <Sprout size={12} />
                        {crop}
                        <button onClick={() => setCrops(crops.filter(c => c !== crop))} className="text-forest-400 hover:text-error-500">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCrop}
                    onChange={e => setNewCrop(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCrop(); } }}
                    placeholder="e.g. Tomato, Rice, Cotton"
                    className="input-field"
                  />
                  <button onClick={addCrop} className="btn-secondary px-4">
                    Add
                  </button>
                </div>
                <p className="text-xs text-forest-400 mt-2">Add as many as you like. You can change this later.</p>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">{t('onboarding.experienceLabel')}</label>
                  <select
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select experience level</option>
                    <option value="less_than_1">Less than 1 year</option>
                    <option value="1_to_5">1 to 5 years</option>
                    <option value="5_to_15">5 to 15 years</option>
                    <option value="15_plus">More than 15 years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">{t('onboarding.farmSize')}</label>
                  <input
                    type="text"
                    value={farmSize}
                    onChange={e => setFarmSize(e.target.value)}
                    placeholder="e.g. 2 acres"
                    className="input-field"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button onClick={prev} className="btn-ghost">
                <ArrowLeft size={16} />
                Back
              </button>
            ) : <div />}
            <button
              onClick={next}
              disabled={!canProceed() || loading}
              className="btn-primary"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : step === steps.length - 1 ? (
                <>
                  <Check size={18} />
                  {t('onboarding.finish')}
                </>
              ) : (
                <>
                  {t('common.continue')}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
