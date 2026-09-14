import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { getFields, getAssessments, getCommunityPosts, getReportCount, getReports } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import LoadingState from '@/components/ui/LoadingState';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import {
  Home, Users, FlaskConical, Sprout, ShieldAlert, FileWarning,
  Activity, Info, ShieldCheck, Bell, Check, Clock, X,
} from '@/components/ui/Icons';
import type { CommunityReport } from '@/types';

export default function Admin() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    fieldCount: 0,
    assessmentCount: 0,
    postCount: 0,
    reportCount: 0,
  });
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [health, setHealth] = useState<Record<string, { status: 'connected' | 'pending' | 'error'; note?: string }>>({
    database: { status: 'pending' },
    auth: { status: 'pending' },
    ai: { status: 'pending' },
    weather: { status: 'pending' },
    storage: { status: 'pending' },
  });

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const [fields, assessments, posts, reportCount, allReports] = await Promise.all([
        getFields(profile.user_id),
        getAssessments(profile.user_id),
        getCommunityPosts(100),
        getReportCount(),
        getReports(),
      ]);
      setStats({
        fieldCount: fields.length,
        assessmentCount: assessments.length,
        postCount: posts.length,
        reportCount,
      });
      setReports(allReports);
      setLoading(false);

      // Real health checks
      const healthChecks: Record<string, { status: 'connected' | 'pending' | 'error'; note?: string }> = {};

      // Database: try a simple query
      const { error: dbError } = await supabase.from('farmer_profiles').select('id').limit(1);
      healthChecks.database = dbError ? { status: 'error', note: dbError.message } : { status: 'connected' };

      // Auth: check if session is valid
      const { data: sessionData } = await supabase.auth.getSession();
      healthChecks.auth = sessionData.session ? { status: 'connected' } : { status: 'error', note: 'No active session' };

      // AI Service: check if the edge function responds
      try {
        const aiRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
          method: 'OPTIONS',
        });
        healthChecks.ai = aiRes.ok ? { status: 'connected' } : { status: 'error', note: `HTTP ${aiRes.status}` };
      } catch {
        healthChecks.ai = { status: 'pending', note: 'Cannot reach edge function' };
      }

      // Weather Service: check if the edge function responds
      try {
        const wRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weather`, {
          method: 'OPTIONS',
        });
        healthChecks.weather = wRes.ok ? { status: 'connected' } : { status: 'error', note: `HTTP ${wRes.status}` };
      } catch {
        healthChecks.weather = { status: 'pending', note: 'Cannot reach edge function' };
      }

      // Storage: try listing buckets
      const { error: storageError } = await supabase.storage.listBuckets();
      healthChecks.storage = storageError ? { status: 'error', note: storageError.message } : { status: 'connected' };

      setHealth(healthChecks);
    })();
  }, [profile]);

  if (loading) return <LoadingState label={t('common.loading')} />;

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Home size={20} className="text-forest-600" />
          <h1 className="font-serif text-3xl font-medium text-forest-950">{t('nav.admin')}</h1>
        </div>
        <p className="text-sm text-forest-500 mt-1">System overview and moderation tools.</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Sprout size={20} />} label="Fields" value={stats.fieldCount} color="forest" />
        <StatCard icon={<FlaskConical size={20} />} label="Assessments" value={stats.assessmentCount} color="earth" />
        <StatCard icon={<Users size={20} />} label="Community Posts" value={stats.postCount} color="sky" />
        <StatCard icon={<ShieldAlert size={20} />} label="Pending Reports" value={stats.reportCount} color="clay" />
      </div>

      {/* Moderation */}
      <section className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FileWarning size={18} className="text-forest-600" />
          <h2 className="font-serif text-lg font-medium text-forest-900">Moderation</h2>
          {stats.reportCount > 0 && <Badge variant="warning">{stats.reportCount} pending</Badge>}
        </div>
        {reports.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck size={28} />}
            title="No reports to review."
            description="When community members report posts or comments, they will appear here for review."
            className="py-8"
          />
        ) : (
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.id} className="p-4 rounded-xl border border-warning-200 bg-warning-50">
                <div className="flex items-start gap-3">
                  <FileWarning size={18} className="text-warning-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="warning" size="sm">{r.reason.replace(/_/g, ' ')}</Badge>
                      <span className="text-2xs text-forest-400">{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    {r.description && <p className="text-sm text-forest-700">{r.description}</p>}
                    <p className="text-2xs text-forest-400 mt-1">Post ID: {r.post_id ?? 'N/A'}</p>
                  </div>
                  <Badge variant={r.status === 'pending' ? 'warning' : 'success'} size="sm">{r.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI Safety Signals */}
      <section className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-forest-600" />
          <h2 className="font-serif text-lg font-medium text-forest-900">AI Safety Signals</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-xl border border-forest-100">
            <Info size={16} className="text-forest-500 mt-0.5" />
            <div>
              <p className="text-sm text-forest-700">All AI assessments are labeled as AI-assisted, not confirmed diagnoses.</p>
              <p className="text-xs text-forest-400 mt-0.5">Every assessment includes uncertainty levels and escalation guidance.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl border border-forest-100">
            <ShieldCheck size={16} className="text-forest-500 mt-0.5" />
            <div>
              <p className="text-sm text-forest-700">Community reports are experiences, not verified facts.</p>
              <p className="text-xs text-forest-400 mt-0.5">Neraya clearly distinguishes between AI assessment, community experience, and verified information.</p>
            </div>
          </div>
        </div>
      </section>

      {/* System Health */}
      <section className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} className="text-forest-600" />
          <h2 className="font-serif text-lg font-medium text-forest-900">System Health</h2>
        </div>
        <div className="space-y-2">
          <HealthRow label="Database" status={health.database.status} note={health.database.note} />
          <HealthRow label="Authentication" status={health.auth.status} note={health.auth.note} />
          <HealthRow label="AI Service" status={health.ai.status} note={health.ai.note} />
          <HealthRow label="Weather Service" status={health.weather.status} note={health.weather.note} />
          <HealthRow label="Storage" status={health.storage.status} note={health.storage.note} />
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    forest: 'bg-forest-50 text-forest-600',
    earth: 'bg-earth-50 text-earth-600',
    sky: 'bg-sky-50 text-sky-600',
    clay: 'bg-clay-50 text-clay-600',
  };
  return (
    <div className="card p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${colors[color]}`}>{icon}</div>
      <p className="text-2xl font-serif font-medium text-forest-950">{value}</p>
      <p className="text-xs text-forest-400 mt-0.5">{label}</p>
    </div>
  );
}

function HealthRow({ label, status, note }: { label: string; status: 'connected' | 'pending' | 'error'; note?: string }) {
  const statusConfig = {
    connected: { color: 'text-success-600', dot: 'bg-success-400', label: 'Connected', icon: <Check size={14} /> },
    pending: { color: 'text-warning-600', dot: 'bg-warning-400', label: 'Pending', icon: <Clock size={14} /> },
    error: { color: 'text-error-600', dot: 'bg-error-400', label: 'Error', icon: <X size={14} /> },
  };
  const cfg = statusConfig[status];
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-forest-100">
      <span className="text-sm text-forest-700">{label}</span>
      <div className="flex items-center gap-2">
        {note && <span className="text-xs text-forest-400">{note}</span>}
        <span className={`flex items-center gap-1.5 text-sm font-medium ${cfg.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>
    </div>
  );
}
