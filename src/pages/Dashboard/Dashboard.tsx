// src/pages/Dashboard/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { StatsCard } from '@/components/Dashboard/StatsCard';
import { PipelineStage } from '@/components/Pipeline/PipelineStage';
import { Deal, DealStage } from '@/types';
import api from '@/services/api';
import './Dashboard.css';

interface Stats {
  totalLeads: number;
  greenLeads: number;
  yellowLeads: number;
  redLeads: number;
  activeDeals: number;
  pipedriveVolume: number;
  automationsToday: number;
  totalDocuments: number;
  documentsToday: number;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  createdAt: string;
  lead?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const stageConfig = {
  [DealStage.NEUER_LEAD]: { title: 'Neuer Lead', icon: '📥' },
  [DealStage.QUALIFIZIERT]: { title: 'Qualifiziert', icon: '💬' },
  [DealStage.UNTERLAGEN_SAMMELN]: { title: 'Unterlagen sammeln', icon: '📄' },
  [DealStage.UNTERLAGEN_VOLLSTAENDIG]: { title: 'Unterlagen vollständig', icon: '✅' },
  [DealStage.BANK_ANFRAGE]: { title: 'Bank-Anfrage', icon: '🏦' },
  [DealStage.WARTEN_AUF_ZUSAGE]: { title: 'Warten auf Zusage', icon: '⏳' },
};

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);

  useEffect(() => {
    // Fetch stats
    api.get<Stats>('/stats').then((res) => {
      setStats(res.data);
    }).catch(console.error).finally(() => setStatsLoading(false));

    // Fetch real activities
    api.get<Activity[]>('/stats/activities').then((res) => {
      setActivities(res.data);
    }).catch(console.error).finally(() => setActivitiesLoading(false));

    // Fetch deals for pipeline preview
    api.get<Deal[]>('/deals').then((res) => {
      setDeals(res.data);
    }).catch(console.error).finally(() => setDealsLoading(false));
  }, []);

  const dealsByStage = (stage: DealStage) => deals.filter((d) => d.stage === stage);

  const handleDealClick = (deal: Deal) => {
    if (deal.pipedriveDealId) {
      window.open(`https://rolandpotlog.pipedrive.com/deal/${deal.pipedriveDealId}`, '_blank');
    }
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Übersicht über alle wichtigen Kennzahlen</p>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => window.location.href = '/leads'}>
            ➕ Neuer Lead
          </button>
          <button className="btn btn-secondary">📥 Export</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatsCard
          icon="👥"
          iconBg="rgba(16, 185, 129, 0.1)"
          iconColor="var(--success)"
          value={statsLoading ? '...' : stats?.totalLeads || 0}
          label="Leads Total"
          trend={stats ? { direction: 'up', value: `${stats.greenLeads} grüne Leads` } : undefined}
        />
        <StatsCard
          icon="💼"
          iconBg="rgba(26, 77, 143, 0.1)"
          iconColor="var(--primary)"
          value={statsLoading ? '...' : stats?.activeDeals || 0}
          label="Aktive Deals"
          trend={stats?.pipedriveVolume ? { direction: 'up', value: formatCurrency(stats.pipedriveVolume) } : undefined}
        />
        <StatsCard
          icon="📄"
          iconBg="rgba(139, 92, 246, 0.1)"
          iconColor="#8b5cf6"
          value={statsLoading ? '...' : stats?.totalDocuments || 0}
          label="Dokumente"
          trend={stats?.documentsToday ? { direction: 'up', value: `${stats.documentsToday} heute` } : undefined}
        />
        <StatsCard
          icon="⚡"
          iconBg="rgba(245, 158, 11, 0.1)"
          iconColor="var(--warning)"
          value={statsLoading ? '...' : stats?.automationsToday || 0}
          label="Automations heute"
          trend={{ direction: 'up', value: 'automatisiert' }}
        />
      </div>

      {/* Pipeline Overview */}
      <div className="pipeline-container">
        <div className="pipeline-header">
          <h2 className="pipeline-title">Pipeline Übersicht</h2>
          <button className="btn btn-secondary" onClick={() => window.location.href = '/pipeline'}>
            Vollansicht →
          </button>
        </div>

        {dealsLoading ? (
          <div className="loading-state">
            <div className="loading-spinner-large"></div>
            <p>Lade Deals...</p>
          </div>
        ) : (
          <div className="pipeline-scroll">
            <div className="pipeline-grid">
              {Object.entries(stageConfig).map(([stage, config]) => (
                <PipelineStage
                  key={stage}
                  stage={stage as DealStage}
                  title={config.title}
                  icon={config.icon}
                  deals={dealsByStage(stage as DealStage)}
                  onDealClick={handleDealClick}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Activity Feed - Real Data */}
      <div className="activity-feed">
        <div className="pipeline-header">
          <h2 className="pipeline-title">Letzte Aktivitäten</h2>
        </div>

        {activitiesLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            Lade Aktivitäten...
          </div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            Noch keine Aktivitäten
          </div>
        ) : (
          activities.slice(0, 10).map((activity) => {
            const iconConfig = activityIcons[activity.type] || activityIcons.NOTE_ADDED;
            const leadName = activity.lead
              ? `${activity.lead.firstName} ${activity.lead.lastName}`
              : null;

            return (
              <div className="activity-item" key={activity.id}>
                <div
                  className="activity-icon"
                  style={{ background: iconConfig.bg, color: iconConfig.color }}
                >
                  {iconConfig.icon}
                </div>
                <div className="activity-content">
                  <div className="activity-title">
                    {activity.title}
                  </div>
                  <div className="activity-description">
                    {activity.description || (leadName ? `Lead: ${leadName}` : '')}
                  </div>
                </div>
                <div className="activity-time">{timeAgo(activity.createdAt)}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};