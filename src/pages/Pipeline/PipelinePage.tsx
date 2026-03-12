// src/pages/Pipeline/PipelinePage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DealStage } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import toast from 'react-hot-toast';
import './PipelinePage.css';

interface TeamMember {
  id: number;
  name: string;
  fullName: string;
  email: string;
}

interface PipedriveDeal {
  id: string;
  pipedriveDealId: number;
  title: string;
  value: number;
  currency: string;
  stage: DealStage;
  pipedriveStage: string;
  pipedriveStageId: number;
  personName: string | null;
  personEmail: string | null;
  assignee: { id: number; name: string; fullName: string } | null;
  addTime: string;
  updateTime: string;
  leadId: string | null;
  lead: any;
  signatureSigned: boolean;
}

interface PipedriveStage {
  id: number;
  name: string;
  orderNr: number;
  localStage: string;
}

interface StageConfig {
  title: string;
  icon: string;
  color: string;
  pipedriveStageId: number;
}

const ICONS = ['📥', '💬', '📄', '✅', '🏦', '⏳', '🎉', '🏁', '❌'];
const COLORS = ['#6b7280', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#ef4444'];

const AVATAR_COLORS: Record<string, string> = {
  Roland: '#2563eb',
  Slaven: '#10b981',
  Daniel: '#f59e0b',
};

export const PipelinePage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [deals, setDeals] = useState<PipedriveDeal[]>([]);
  const [stageConfigs, setStageConfigs] = useState<StageConfig[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedDeal, setDraggedDeal] = useState<PipedriveDeal | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('alle');
  const [assignDropdown, setAssignDropdown] = useState<number | null>(null);

  // Set default filter to current user's first name
  useEffect(() => {
    if (user?.name) {
      const firstName = user.name.split(' ')[0];
      setActiveFilter(firstName.toLowerCase());
    }
  }, [user]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [stagesRes, dealsRes, teamRes] = await Promise.all([
        api.get<PipedriveStage[]>('/pipedrive/stages'),
        api.get<PipedriveDeal[]>('/pipedrive/deals'),
        api.get<TeamMember[]>('/pipedrive/team'),
      ]);

      setStageConfigs(stagesRes.data.map((s, i) => ({
        title: s.name,
        icon: ICONS[i] || '📋',
        color: COLORS[i] || '#6b7280',
        pipedriveStageId: s.id,
      })));
      setDeals(dealsRes.data);
      setTeam(teamRes.data);
      setLastSync(new Date());
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Filter deals
  const filteredDeals = activeFilter === 'alle'
    ? deals
    : activeFilter === 'unassigned'
      ? deals.filter((d) => !d.assignee)
      : deals.filter((d) => d.assignee?.name.toLowerCase() === activeFilter);

  const dealsByStage = (stageId: number) => filteredDeals.filter((d) => d.pipedriveStageId === stageId);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const handleDragStart = (deal: PipedriveDeal) => setDraggedDeal(deal);
  const handleDragEnd = () => setDraggedDeal(null);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (targetStageId: number) => {
    if (!draggedDeal || draggedDeal.pipedriveStageId === targetStageId) {
      setDraggedDeal(null);
      return;
    }
    const prevDeals = [...deals];
    setDeals((prev) => prev.map((d) =>
      d.pipedriveDealId === draggedDeal.pipedriveDealId ? { ...d, pipedriveStageId: targetStageId } : d
    ));
    try {
      await api.put(`/pipedrive/deals/${draggedDeal.pipedriveDealId}/stage`, { stageId: targetStageId });
      await loadData();
    } catch {
      setDeals(prevDeals);
    } finally {
      setDraggedDeal(null);
    }
  };

  const handleAssign = async (dealId: number, assigneeId: number | null) => {
    setAssignDropdown(null);
    const prevDeals = [...deals];
    const member = team.find((m) => m.id === assigneeId);
    setDeals((prev) => prev.map((d) =>
      d.pipedriveDealId === dealId
        ? { ...d, assignee: member ? { id: member.id, name: member.name, fullName: member.fullName } : null }
        : d
    ));
    try {
      await api.put(`/pipedrive/deals/${dealId}/assign`, { assigneeId });
    } catch {
      setDeals(prevDeals);
    }
  };

  const handleDealClick = (deal: PipedriveDeal) => {
    window.open(`${import.meta.env.VITE_PIPEDRIVE_URL || 'https://immokredit.pipedrive.com'}/deal/${deal.pipedriveDealId}`, '_blank');
  };

  const handleSendSecureLink = async (deal: PipedriveDeal) => {
    if (!deal.leadId) return;
    try {
      await api.post('/secure-link/create', { leadId: deal.leadId });
      toast.success('Verschlüsselter Link + Passwort gesendet');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Fehler beim Senden');
    }
  };

  // Stats for current filter
  const totalValue = filteredDeals.reduce((sum, d) => sum + d.value, 0);
  const avgValue = filteredDeals.length > 0 ? totalValue / filteredDeals.length : 0;

  if (isLoading && deals.length === 0) {
    return (
      <div className="pipeline-page">
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Lade Pipeline aus Pipedrive...</p>
        </div>
      </div>
    );
  }

  if (error && deals.length === 0) {
    return (
      <div className="pipeline-page">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Fehler beim Laden</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadData}>Erneut versuchen</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pipeline-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pipeline</h1>
          <p className="page-subtitle">
            {filteredDeals.length} {filteredDeals.length === 1 ? 'Deal' : 'Deals'}
            {activeFilter !== 'alle' && ` · ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}`}
            {lastSync && (
              <span style={{ marginLeft: 12, fontSize: 12, opacity: 0.6 }}>
                {lastSync.toLocaleTimeString('de-AT')}
              </span>
            )}
          </p>
        </div>
        <div className="header-actions">
          <a href={`${import.meta.env.VITE_PIPEDRIVE_URL || 'https://immokredit.pipedrive.com'}/pipeline`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            🔗 Pipedrive
          </a>
          <button className="btn btn-secondary" onClick={loadData} disabled={isLoading}>
            {isLoading ? '⏳' : '🔄'}
          </button>
        </div>
      </div>

      {/* Team Filter */}
      <div className="pipeline-filter-bar">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${activeFilter === 'alle' ? 'active' : ''}`}
            onClick={() => setActiveFilter('alle')}
          >
            Alle ({deals.length})
          </button>
          {team.map((member) => {
            const count = deals.filter((d) => d.assignee?.id === member.id).length;
            return (
              <button
                key={member.id}
                className={`filter-btn ${activeFilter === member.name.toLowerCase() ? 'active' : ''}`}
                onClick={() => setActiveFilter(member.name.toLowerCase())}
                style={activeFilter === member.name.toLowerCase() ? { borderColor: AVATAR_COLORS[member.name] || '#6b7280', color: AVATAR_COLORS[member.name] || '#6b7280' } : {}}
              >
                <span className="filter-avatar" style={{ background: AVATAR_COLORS[member.name] || '#6b7280' }}>
                  {member.name[0]}
                </span>
                {member.name} ({count})
              </button>
            );
          })}
          {(() => {
            const unassigned = deals.filter((d) => !d.assignee).length;
            return unassigned > 0 ? (
              <button
                className={`filter-btn ${activeFilter === 'unassigned' ? 'active' : ''}`}
                onClick={() => setActiveFilter('unassigned')}
              >
                Nicht zugewiesen ({unassigned})
              </button>
            ) : null;
          })()}
        </div>

        <div className="filter-stats">
          <span className="filter-stat">{formatCurrency(totalValue)} Volumen</span>
          <span className="filter-stat-divider">·</span>
          <span className="filter-stat">Ø {formatCurrency(avgValue)}</span>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="pipeline-container">
        <div className="pipeline-stages" style={{
          gridTemplateColumns: `repeat(${stageConfigs.length}, minmax(320px, 1fr))`,
        }}>
          {stageConfigs.map((config) => {
            const stageDeals = dealsByStage(config.pipedriveStageId);
            const isDropTarget = draggedDeal && draggedDeal.pipedriveStageId !== config.pipedriveStageId;
            const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

            return (
              <div
                key={config.pipedriveStageId}
                className={`pipeline-stage ${isDropTarget ? 'drop-target' : ''}`}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(config.pipedriveStageId)}
              >
                <div className="stage-header">
                  <div className="stage-title-row">
                    <span className="stage-icon">{config.icon}</span>
                    <span className="stage-title">{config.title}</span>
                    <span className="stage-count">{stageDeals.length}</span>
                  </div>
                  <div className="stage-value">{formatCurrency(stageValue)}</div>
                  <div className="stage-indicator" style={{ backgroundColor: config.color }} />
                </div>

                <div className="stage-content">
                  {stageDeals.length === 0 ? (
                    <div className="stage-empty">
                      <span className="empty-icon">🔭</span>
                      <span>Keine Deals</span>
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.pipedriveDealId}
                        draggable
                        onDragStart={() => handleDragStart(deal)}
                        onDragEnd={handleDragEnd}
                        className={`pipeline-deal-card ${draggedDeal?.pipedriveDealId === deal.pipedriveDealId ? 'dragging' : ''}`}
                      >
                        <div className="deal-card-header" onClick={() => handleDealClick(deal)}>
                          <div className="deal-card-title">{deal.title}</div>
                          <div className="deal-card-value">{deal.value > 0 ? formatCurrency(deal.value) : '—'}</div>
                        </div>

                        {deal.personName && (
                          <div className="deal-card-person" onClick={() => handleDealClick(deal)}>
                            👤 {deal.personName}
                          </div>
                        )}

                        {(deal.lead || deal.signatureSigned) && (
                          <div className="deal-card-indicators">
                            {deal.lead && (
                              <>
                                <span className="deal-indicator">
                                  {deal.lead.ampelStatus === 'GREEN' ? '🟢' : deal.lead.ampelStatus === 'RED' ? '🔴' : '🟡'}
                                </span>
                                <span className="deal-indicator">
                                  {deal.lead.temperatur === 'HOT' ? '🔥' : deal.lead.temperatur === 'COLD' ? '❄️' : '🌤'}
                                </span>
                                {deal.lead.score > 0 && (
                                  <span className="deal-indicator deal-score">{deal.lead.score}%</span>
                                )}
                              </>
                            )}
                            {deal.signatureSigned && (
                              <span className="deal-indicator" title="Digital signiert">✍️✅</span>
                            )}
                          </div>
                        )}

                        {/* Action buttons for specific stages */}
                        {deal.leadId && (
                          <div className="deal-card-actions">
                            <button
                              className="deal-action-btn deal-action-kunde"
                              onClick={(e) => { e.stopPropagation(); navigate(`/kunde/${deal.leadId}`); }}
                              title="Kunde öffnen"
                            >
                              📋
                            </button>
                            {config.title.toLowerCase().includes('abschluss') && (
                              <>
                                <button
                                  className="deal-action-btn deal-action-signature"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/kunde/${deal.leadId}`); }}
                                  title="Digitale Unterschrift"
                                >
                                  ✍️
                                </button>
                                <button
                                  className="deal-action-btn deal-action-secure"
                                  onClick={(e) => { e.stopPropagation(); handleSendSecureLink(deal); }}
                                  title="Verschlüsselten Link senden"
                                >
                                  🔒
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        <div className="deal-card-footer">
                          <div className="deal-card-date">
                            {new Date(deal.addTime).toLocaleDateString('de-AT')}
                          </div>

                          {/* Assignee badge */}
                          <div className="deal-card-assignee" style={{ position: 'relative' }}>
                            <button
                              className="assignee-badge"
                              style={{ background: deal.assignee ? AVATAR_COLORS[deal.assignee.name] || '#6b7280' : '#d1d5db' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssignDropdown(assignDropdown === deal.pipedriveDealId ? null : deal.pipedriveDealId);
                              }}
                              title={deal.assignee ? deal.assignee.fullName : 'Nicht zugewiesen – klicken zum Zuweisen'}
                            >
                              {deal.assignee ? deal.assignee.name[0] : '?'}
                            </button>

                            {assignDropdown === deal.pipedriveDealId && (
                              <div className="assignee-dropdown">
                                {team.map((member) => (
                                  <button
                                    key={member.id}
                                    className={`assignee-option ${deal.assignee?.id === member.id ? 'active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAssign(deal.pipedriveDealId, member.id);
                                    }}
                                  >
                                    <span className="assignee-option-avatar" style={{ background: AVATAR_COLORS[member.name] || '#6b7280' }}>
                                      {member.name[0]}
                                    </span>
                                    {member.name}
                                    {deal.assignee?.id === member.id && ' ✓'}
                                  </button>
                                ))}
                                {deal.assignee && (
                                  <button
                                    className="assignee-option remove"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAssign(deal.pipedriveDealId, null);
                                    }}
                                  >
                                    ✕ Zuweisung entfernen
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pipeline-instructions">
        <span className="instruction-icon">💡</span>
        <span>
          Drag & Drop verschiebt Deals · Klicke auf den Avatar um Deals zuzuweisen · Klicke auf einen Deal für Pipedrive
        </span>
      </div>
    </div>
  );
};