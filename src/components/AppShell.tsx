import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { getAlerts } from '@/lib/db';
import Logo from './ui/Logo';
import type { Alert } from '@/types';
import {
  LayoutDashboard, Sprout, FlaskConical, MessageSquare, Users,
  Bell, Settings, LogOut, Menu, X, Home,
} from './ui/Icons';

export type AppPage =
  | 'dashboard'
  | 'fields'
  | 'field-detail'
  | 'crop-intelligence'
  | 'assistant'
  | 'community'
  | 'alerts'
  | 'profile'
  | 'admin';

interface AppShellProps {
  children: React.ReactNode;
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
}

export default function AppShell({ children, currentPage, onNavigate }: AppShellProps) {
  const { profile, signOut } = useAuth();
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (profile) {
      getAlerts(profile.user_id).then(setAlerts);
    }
  }, [profile]);

  const unreadCount = alerts.filter(a => !a.is_read).length;

  const navItems: { page: AppPage; label: string; icon: React.ReactNode }[] = [
    { page: 'dashboard', label: t('nav.today'), icon: <LayoutDashboard size={18} /> },
    { page: 'fields', label: t('nav.fields'), icon: <Sprout size={18} /> },
    { page: 'crop-intelligence', label: t('nav.cropScan'), icon: <FlaskConical size={18} /> },
    { page: 'assistant', label: t('nav.assistant'), icon: <MessageSquare size={18} /> },
    { page: 'community', label: t('nav.community'), icon: <Users size={18} /> },
    { page: 'alerts', label: t('nav.alerts'), icon: <Bell size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-forest-50 flex">
      <a href="#main-content" className="skip-link">Skip to content</a>
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-white border-r border-forest-100 z-30" aria-label="Main navigation">
        <div className="px-5 py-5 border-b border-forest-100">
          <button onClick={() => onNavigate('dashboard')}>
            <Logo />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentPage === item.page
                  ? 'bg-forest-700 text-white'
                  : 'text-forest-600 hover:bg-forest-50'
              }`}
            >
              {item.icon}
              {item.label}
              {item.page === 'alerts' && unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-error-500 text-white text-2xs px-1">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-forest-100 space-y-1">
          <button
            onClick={() => onNavigate('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentPage === 'profile' ? 'bg-forest-50 text-forest-800' : 'text-forest-600 hover:bg-forest-50'
            }`}
          >
            <Settings size={18} />
            {t('nav.profile')}
          </button>
          <button
            onClick={() => onNavigate('admin')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentPage === 'admin' ? 'bg-forest-50 text-forest-800' : 'text-forest-600 hover:bg-forest-50'
            }`}
          >
            <Home size={18} />
            {t('nav.admin')}
          </button>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-forest-600 hover:bg-error-50 hover:text-error-600 transition-all"
          >
            <LogOut size={18} />
            {t('nav.signOut')}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-forest-950/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white border-r border-forest-100 animate-slide-in-right" aria-label="Mobile navigation">
            <div className="px-5 py-5 border-b border-forest-100 flex items-center justify-between">
              <Logo />
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-forest-400 hover:bg-forest-50" aria-label="Close navigation menu">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map(item => (
                <button
                  key={item.page}
                  onClick={() => { onNavigate(item.page); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    currentPage === item.page
                      ? 'bg-forest-700 text-white'
                      : 'text-forest-600 hover:bg-forest-50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {item.page === 'alerts' && unreadCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-error-500 text-white text-2xs px-1">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
              <div className="pt-3 mt-3 border-t border-forest-100 space-y-1">
                <button
                  onClick={() => { onNavigate('profile'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    currentPage === 'profile' ? 'bg-forest-50 text-forest-800' : 'text-forest-600 hover:bg-forest-50'
                  }`}
                >
                  <Settings size={18} />
                  {t('nav.profile')}
                </button>
                <button
                  onClick={() => { onNavigate('admin'); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    currentPage === 'admin' ? 'bg-forest-50 text-forest-800' : 'text-forest-600 hover:bg-forest-50'
                  }`}
                >
                  <Home size={18} />
                  {t('nav.admin')}
                </button>
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-forest-600 hover:bg-error-50 hover:text-error-600 transition-all"
                >
                  <LogOut size={18} />
                  {t('nav.signOut')}
                </button>
              </div>
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-forest-100 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-forest-600 hover:bg-forest-50" aria-label="Open navigation menu">
            <Menu size={20} />
          </button>
          <Logo size="sm" />
          <button onClick={() => onNavigate('alerts')} className="relative p-2 rounded-lg text-forest-600 hover:bg-forest-50" aria-label={`Alerts${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 text-white text-2xs px-1">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <main id="main-content" className="min-h-screen" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
