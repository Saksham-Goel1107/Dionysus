'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

const statusMap = {
  operational: {
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    label: 'Operational',
    color: 'bg-green-100 text-green-700 border-green-300',
  },
  incident: {
    icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    label: 'Incident (24h)',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  ongoing: {
    icon: <AlertCircle className="h-4 w-4 text-red-500" />,
    label: 'Ongoing Incident',
    color: 'bg-red-100 text-red-700 border-red-300',
  },
};

export function UptimeStatus() {
  const [status, setStatus] = useState<'operational' | 'incident' | 'ongoing' | 'loading'>(
    'loading',
  );
  const [tooltip, setTooltip] = useState('');

  useEffect(() => {
    async function fetchUptime() {
      try {
        const res = await fetch('/api/uptime');
        const data = await res.json();
        if (data.stat === 'ok' && Array.isArray(data.monitors)) {
          let incident = false;
          let ongoing = false;
          let incidentMsg = '';
          for (const monitor of data.monitors) {
            if (monitor.status !== 2) {
              ongoing = true;
              incidentMsg = monitor.status_text || 'Incident ongoing';
              break;
            }
            if (Array.isArray(monitor.logs)) {
              const now = Date.now();
              for (const log of monitor.logs) {
                if (log.type === 1) {
                  const logTime = log.datetime * 1000;
                  if (now - logTime < 24 * 60 * 60 * 1000) {
                    incident = true;
                    incidentMsg = log.reason?.detail || 'Incident in last 24h';
                  }
                }
              }
            }
          }
          if (ongoing) {
            setStatus('ongoing');
            setTooltip(incidentMsg || 'Incident ongoing');
          } else if (incident) {
            setStatus('incident');
            setTooltip(incidentMsg || 'Incident in last 24h');
          } else {
            setStatus('operational');
            setTooltip('All systems operational');
          }
        } else {
          setStatus('ongoing');
          setTooltip('Could not fetch uptime status');
        }
      } catch {
        setStatus('ongoing');
        setTooltip('Could not fetch uptime status');
      }
    }
    fetchUptime();
  }, []);

  if (status === 'loading') return null;

  const { icon, label, color } = statusMap[status];

  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors duration-200 ${color} max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap`}
      style={{ minWidth: 0 }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only">Uptime status: {label}</span>
    </span>
  );
}
