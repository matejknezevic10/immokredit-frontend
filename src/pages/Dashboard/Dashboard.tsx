// src/pages/Dashboard/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatsCard } from '@/components/Dashboard/StatsCard';
import api from '@/services/api';
import './Dashboard.css';

// ── Types ──────────────────────────────────────────────
interface OffenerKunde {
  id: string;
  firstName: string;
  lastName: string;
  ampelStatus: string;
  temperatur: string;
  hasPersonData: boolean;
  hasHaushaltData: boolean;
  hasFinanzplanData: boolean;
  objekteCount: number;
  missingCount: number;
}

interface LeadPreview {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  source: string;
  temperatur: string;
  createdAt: string;
}

interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  lead: { id: string; firstName: string; lastName: string };
}

interface MyDashboardData {
  userName: string;
  meineKunden: {
    total: number;
    mitOffenenDaten: number;
    ampelVerteilung: { green: number; yellow: number; red: number };
    temperaturVerteilung: { hot: number; warm: number; cold: number };
  };
  verfuegbareLeads: {
    total: number;
    neueHeute: number;
    letzteLeads: LeadPreview[];
  };
  offeneKunden: OffenerKunde[];
  meineAktivitaeten: DashboardActivity[];
  aktivitaetenHeute: number;
}

// ── Helpers ────────────────────────────────────────────
const activityIcons: Record<string, { icon: string; bg: string; color: string }> = {
  LEAD_CREATED: { icon: '👤', bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' },
  DEAL_CREATED: { icon: '💼', bg: 'rgba(26, 77, 143, 0.1)', color: 'var(--primary)' },
  DEAL_UPDATED: { icon: '📝', bg: 'rgba(26, 77, 143, 0.1)', color: 'var(--primary)' },
  DEAL_MOVED: { icon: '➡️', bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' },
  DOCUMENT_UPLOADED: { icon: '📄', bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' },
  DOCUMENT_OCR_COMPLETED: { icon: '🔍', bg: 'rgba(0, 212, 255, 0.1)', color: 'var(--accent)' },
  EMAIL_SENT: { icon: '📧', bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' },
  EMAIL_RECEIVED: { icon: '📬', bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' },
  WHATSAPP_SENT: { icon: '💬', bg: 'rgba(37, 211, 102, 0.1)', color: '#25d366' },
  WHATSAPP_RECEIVED: { icon: '💬', bg: 'rgba(37, 211, 102, 0.1)', color: '#25d366' },
  NOTE_ADDED: { icon: '🗒️', bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' },
  WORKFLOW_TRIGGERED: { icon: '⚡', bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'gerade eben';
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std`;
  if (diff < 604800) return `vor ${Math.floor(diff / 86400)} Tagen`;
  return date.toLocaleDateString('de-AT');
}

const getAmpelEmoji = (status: string) => {
  switch (status) {
    case 'GREEN': return '🟢';
    case 'YELLOW': return '🟡';
    case 'RED': return '🔴';
    default: return '🟡';
  }
};

const getTemperaturEmoji = (temp: string) => {
  switch (temp) {
    case 'HOT': return '🔥';
    case 'WARM': return '🌤️';
    case 'COLD': return '❄️';
    default: return '🌤️';
  }
};

// ── Component ──────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<MyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<MyDashboardData>('/stats/my-dashboard')
      .then((res) => setData(res.data))
      .catch((err) => console.error('Dashboard load error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner-large"></div>
          <p>Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard">
        <div className="dashboard-error">
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <h3>Dashboard konnte nicht geladen werden</h3>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* ── Greeting Header ── */}
      <div className="dashboard-greeting">
        <div>
          <h1 className="page-title">Hallo, {data.userName}!</h1>
          <p className="page-subtitle">Dein persönliches Dashboard</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/kunde')}>
            + Neuer Kunde
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="stats-grid">
        <StatsCard
          icon="👥"
          iconBg="rgba(26, 77, 143, 0.1)"
          iconColor="var(--primary)"
          value={data.meineKunden.total}
          label="Meine Kunden"
          trend={data.meineKunden.ampelVerteilung.green > 0
            ? { direction: 'up', value: `${data.meineKunden.ampelVerteilung.green} grüne` }
            : undefined}
          onClick={() => navigate('/kunde')}
        />
        <StatsCard
          icon="📋"
          iconBg={data.meineKunden.mitOffenenDaten > 0
            ? 'rgba(245, 158, 11, 0.1)'
            : 'rgba(16, 185, 129, 0.1)'}
          iconColor={data.meineKunden.mitOffenenDaten > 0
            ? 'var(--warning)'
            : 'var(--success)'}
          value={data.meineKunden.mitOffenenDaten}
          label="Offene Datensätze"
          trend={data.meineKunden.mitOffenenDaten > 0
            ? { direction: 'down', value: 'brauchen Daten' }
            : { direction: 'up', value: 'alles komplett' }}
        />
        <StatsCard
          icon="🎯"
          iconBg="rgba(139, 92, 246, 0.1)"
          iconColor="#8b5cf6"
          value={data.verfuegbareLeads.total}
          label="Verfügbare Leads"
          trend={data.verfuegbareLeads.neueHeute > 0
            ? { direction: 'up', value: `${data.verfuegbareLeads.neueHeute} neue heute` }
            : undefined}
          onClick={() => navigate('/leads')}
        />
        <StatsCard
          icon="⚡"
          iconBg="rgba(245, 158, 11, 0.1)"
          iconColor="var(--warning)"
          value={data.aktivitaetenHeute}
          label="Aktivitäten heute"
          trend={{ direction: 'up', value: 'auf meine Kunden' }}
        />
      </div>

      {/* ── Offene Kunden ── */}
      <div className="offene-kunden-container">
        <div className="offene-kunden-header">
          <h2 className="section-title">Kunden mit offenen Aufgaben</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/kunde')}>
            Alle Kunden →
          </button>
        </div>

        {data.meineKunden.total === 0 ? (
          <div className="offene-kunden-empty">
            <div className="empty-icon-large">🚀</div>
            <h3>Noch keine Eigenkunden</h3>
            <p>Übernimm Leads aus der Lead-Liste oder lege einen neuen Kunden an.</p>
            <div className="empty-actions">
              <button className="btn btn-primary" onClick={() => navigate('/leads')}>
                🎯 Leads anzeigen
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/kunde')}>
                + Neuer Kunde
              </button>
            </div>
          </div>
        ) : data.offeneKunden.length === 0 ? (
          <div className="offene-kunden-empty offene-kunden-success">
            <div className="empty-icon-large">✅</div>
            <h3>Alle Kunden haben vollständige Daten!</h3>
            <p>Keine offenen Datensätze bei deinen Kunden.</p>
          </div>
        ) : (
          <div className="offene-kunden-list">
            {data.offeneKunden.slice(0, 6).map((k) => (
              <div
                key={k.id}
                className="offene-kunden-row"
                onClick={() => navigate(`/kunde/${k.id}`)}
              >
                <div className="offene-kunden-left">
                  <div className="offene-kunden-avatar">
                    {k.firstName[0]}{k.lastName[0]}
                  </div>
                  <div className="offene-kunden-info">
                    <span className="offene-kunden-name">
                      {k.firstName} {k.lastName}
                    </span>
                    <span className="offene-kunden-status">
                      {getAmpelEmoji(k.ampelStatus)} {getTemperaturEmoji(k.temperatur)}
                    </span>
                  </div>
                </div>
                <div className="offene-kunden-completion">
                  <CompletionBadge label="Person" done={k.hasPersonData} />
                  <CompletionBadge label="Haushalt" done={k.hasHaushaltData} />
                  <CompletionBadge label="Finanzplan" done={k.hasFinanzplanData} />
                  <CompletionBadge label="Objekt" done={k.objekteCount > 0} />
                </div>
              </div>
            ))}
            {data.offeneKunden.length > 6 && (
              <div className="offene-kunden-more">
                + {data.offeneKunden.length - 6} weitere Kunden mit offenen Daten
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom Split: Activities + Leads ── */}
      <div className="dashboard-bottom-split">
        {/* Meine Aktivitäten */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Meine Aktivitäten</h2>
          </div>

          {data.meineAktivitaeten.length === 0 ? (
            <div className="section-empty">
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <p>Noch keine Aktivitäten</p>
            </div>
          ) : (
            <div className="activity-list">
              {data.meineAktivitaeten.map((activity) => {
                const iconConfig = activityIcons[activity.type] || activityIcons.NOTE_ADDED;
                return (
                  <div
                    className="activity-item"
                    key={activity.id}
                    onClick={() => navigate(`/kunde/${activity.lead.id}`)}
                  >
                    <div
                      className="activity-icon"
                      style={{ background: iconConfig.bg, color: iconConfig.color }}
                    >
                      {iconConfig.icon}
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">{activity.title}</div>
                      <div className="activity-description">
                        {activity.lead.firstName} {activity.lead.lastName}
                        {activity.description ? ` — ${activity.description}` : ''}
                      </div>
                    </div>
                    <div className="activity-time">{timeAgo(activity.createdAt)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Neueste Leads */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Neueste Leads</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/leads')}>
              Alle Leads →
            </button>
          </div>

          {data.verfuegbareLeads.letzteLeads.length === 0 ? (
            <div className="section-empty">
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <p>Keine offenen Leads</p>
            </div>
          ) : (
            <div className="leads-preview-list">
              {data.verfuegbareLeads.letzteLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="lead-preview-item"
                  onClick={() => navigate('/leads')}
                >
                  <div className="lead-preview-left">
                    <div className="lead-preview-avatar">
                      {lead.firstName[0]}{lead.lastName[0]}
                    </div>
                    <div className="lead-preview-info">
                      <span className="lead-preview-name">
                        {lead.firstName} {lead.lastName}
                      </span>
                      <span className="lead-preview-email">{lead.email}</span>
                    </div>
                  </div>
                  <div className="lead-preview-right">
                    <span className="lead-source-badge">{lead.source}</span>
                    <span className="lead-preview-temp">
                      {getTemperaturEmoji(lead.temperatur)}
                    </span>
                    <span className="lead-preview-time">{timeAgo(lead.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Sub-Component ──────────────────────────────────────
const CompletionBadge: React.FC<{ label: string; done: boolean }> = ({ label, done }) => (
  <span className={`completion-badge ${done ? 'complete' : 'missing'}`}>
    {done ? '✅' : '❌'} {label}
  </span>
);
