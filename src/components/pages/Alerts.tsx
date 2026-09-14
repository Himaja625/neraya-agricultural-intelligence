import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getAlerts, markAlertRead, markAllAlertsRead } from '@/lib/db';
import type { Alert } from '@/types';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import Badge from '@/components/ui/Badge';
import {
  Bell, AlertTriangle, Info, CloudSun, FlaskConical, Users, Clock,
  Check, Sprout,
} from '@/components/ui/Icons';

export default function Alerts() {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    getAlerts(profile.user_id).then(a => {
      setAlerts(a);
      setLoading(false);
    });
  }, [profile]);

  async function handleMarkRead(id: string) {
    await markAlertRead(id);
    setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a));
  }

  async function handleMarkAllRead() {
    if (!profile) return;
    await markAllAlertsRead(profile.user_id);
    setAlerts(alerts.map(a => ({ ...a, is_read: true })));
  }

  if (loading) return <LoadingState label="Loading alerts..." />;

  const unread = alerts.filter(a => !a.is_read);

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-medium text-forest-950">Alerts</h1>
          <p className="text-sm text-forest-500 mt-1">Important things Neraya thinks you should know.</p>
        </div>
        {unread.length > 0 && (
          <button onClick={handleMarkAllRead} className="btn-ghost text-sm">
            <Check size={16} /> Mark all read
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="card p-12">
          <EmptyState
            icon={<Bell size={32} />}
            title="Nothing needs your attention right now."
            description="When Neraya notices something important, like a weather change or a follow-up reminder, it will show up here."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const icon = alert.type === 'weather' ? <CloudSun size={18} /> :
              alert.type === 'crop' ? <FlaskConical size={18} /> :
              alert.type === 'community' ? <Users size={18} /> :
              alert.type === 'reminder' ? <Clock size={18} /> :
              <Info size={18} />;
            const severityColor = alert.severity === 'urgent' ? 'border-error-200 bg-error-50' :
              alert.severity === 'warning' ? 'border-warning-200 bg-warning-50' :
              'border-forest-100 bg-white';

            return (
              <div key={alert.id} className={`rounded-2xl border p-4 ${severityColor} ${!alert.is_read ? 'ring-1 ring-forest-200' : 'opacity-70'}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl ${
                    alert.severity === 'urgent' ? 'bg-error-100 text-error-600' :
                    alert.severity === 'warning' ? 'bg-warning-100 text-warning-600' :
                    'bg-forest-50 text-forest-500'
                  }`}>
                    {icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-forest-900">{alert.title}</h3>
                      {!alert.is_read && <Badge variant="warning" size="sm">New</Badge>}
                    </div>
                    {alert.body && <p className="text-sm text-forest-600 leading-relaxed">{alert.body}</p>}
                    <p className="text-2xs text-forest-400 mt-2">{new Date(alert.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {!alert.is_read && (
                    <button onClick={() => handleMarkRead(alert.id)} className="p-1.5 rounded-lg text-forest-400 hover:bg-forest-50 hover:text-forest-600">
                      <Check size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
