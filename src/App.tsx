import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { I18nProvider } from '@/lib/i18n';
import type { Language } from '@/types';
import Landing from '@/components/Landing';
import AuthPage from '@/components/Auth';
import Onboarding from '@/components/Onboarding';
import AppShell, { type AppPage } from '@/components/AppShell';
import Dashboard from '@/components/pages/Dashboard';
import FieldsPage from '@/components/pages/Fields';
import FieldDetail from '@/components/pages/FieldDetail';
import CropIntelligence from '@/components/pages/CropIntelligence';
import Assistant from '@/components/pages/Assistant';
import Community from '@/components/pages/Community';
import AlertsPage from '@/components/pages/Alerts';
import ProfilePage from '@/components/pages/Profile';
import AdminPage from '@/components/pages/Admin';

type View = 'landing' | 'login' | 'signup' | 'forgot' | 'app';

function Root() {
  const { session, profile, loading } = useAuth();
  const [view, setView] = useState<View>('landing');
  const [page, setPage] = useState<AppPage>('dashboard');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (session && profile?.onboarding_completed) {
      setView('app');
    } else if (!session && view === 'app') {
      setView('landing');
    }
  }, [session, profile, loading, view]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-forest-700 animate-pulse-soft" />
          <p className="text-sm text-forest-400">Loading Neraya...</p>
        </div>
      </div>
    );
  }

  if (session && !profile?.onboarding_completed) {
    return (
      <I18nProvider lang="en">
        <Onboarding onComplete={() => {}} />
      </I18nProvider>
    );
  }

  if (session && profile?.onboarding_completed) {
    const navigate = (p: AppPage) => {
      setPage(p);
      if (p !== 'field-detail') setSelectedFieldId(null);
    };

    const openField = (fieldId: string) => {
      setSelectedFieldId(fieldId);
      setPage('field-detail');
    };

    const lang = (profile?.preferred_language as Language) ?? 'en';

    return (
      <I18nProvider lang={lang}>
      <AppShell currentPage={page} onNavigate={navigate}>
        {page === 'dashboard' && <Dashboard onNavigate={navigate} onOpenField={openField} />}
        {page === 'fields' && <FieldsPage onOpenField={openField} />}
        {page === 'field-detail' && selectedFieldId && (
          <FieldDetail fieldId={selectedFieldId} onBack={() => navigate('fields')} onNavigate={navigate} />
        )}
        {page === 'crop-intelligence' && <CropIntelligence onNavigate={navigate} />}
        {page === 'assistant' && <Assistant />}
        {page === 'community' && <Community />}
        {page === 'alerts' && <AlertsPage />}
        {page === 'profile' && <ProfilePage />}
        {page === 'admin' && <AdminPage />}
      </AppShell>
      </I18nProvider>
    );
  }

  if (view === 'login' || view === 'signup') {
    return <AuthPage view={view} onNavigate={(v) => setView(v)} onBack={() => setView('landing')} />;
  }

  return <Landing onNavigate={setView} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
