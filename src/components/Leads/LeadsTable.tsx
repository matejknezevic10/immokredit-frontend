// src/components/Leads/LeadsTable.tsx
import React from 'react';
import { Lead } from '@/types';
import './LeadsTable.css';

interface LeadsTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onJeffrey?: (lead: Lead) => void;
  onVoiceAgent?: (lead: Lead) => void;
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
    case 'WARM': return '🌤';
    case 'COLD': return '❄️';
    default: return '🌤';
  }
};

const formatCurrency = (value?: number) => {
  if (!value) return '—';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const LeadsTable: React.FC<LeadsTableProps> = ({ leads, onEdit, onDelete, onJeffrey, onVoiceAgent }) => {
  if (leads.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <h3>Keine Leads vorhanden</h3>
        <p>Erstelle deinen ersten Lead mit dem Button oben</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="leads-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>E-Mail</th>
            <th>Telefon</th>
            <th>Quelle</th>
            <th>Betrag</th>
            <th>Status</th>
            <th>Score</th>
            <th>Erstellt</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td className="lead-name">
                {lead.firstName} {lead.lastName}
              </td>
              <td>{lead.email}</td>
              <td>{lead.phone}</td>
              <td>
                <span className="source-badge">{lead.source}</span>
              </td>
              <td className="lead-amount">{formatCurrency(lead.amount)}</td>
              <td>
                <div className="status-badges">
                  <span className="status-badge">
                    {getAmpelEmoji(lead.ampelStatus)}
                  </span>
                  <span className="status-badge">
                    {getTemperaturEmoji(lead.temperatur)}
                  </span>
                </div>
              </td>
              <td>
                <span className="score-badge">{lead.score}%</span>
              </td>
              <td className="date-cell">{formatDate(lead.createdAt)}</td>
              <td>
                <div className="action-buttons">
                  {onVoiceAgent && (
                    <button
                      className="btn-icon btn-voice"
                      onClick={() => onVoiceAgent(lead)}
                      title="Voice Agent – Anrufen"
                    >
                      📞
                    </button>
                  )}
                  {onJeffrey && (
                    <button
                      className="btn-icon btn-jeffrey"
                      onClick={() => onJeffrey(lead)}
                      title="Jeffrey – Unterlagen prüfen"
                    >
                      📋
                    </button>
                  )}
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => onEdit(lead)}
                    title="Bearbeiten"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => onDelete(lead)}
                    title="Löschen"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};