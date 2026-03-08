// src/pages/Mails/MailsPage.tsx
import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import './MailsPage.css';

interface EmailEntry {
  id: string;
  to: string;
  subject: string;
  emailType: string;
  sentBy: string | null;
  sentAt: string;
  status: string;
  openedAt: string | null;
  openCount: number;
  lastOpenedAt: string | null;
  leadId?: string;
  leadName?: string;
}

type FilterKey = 'all' | 'sent' | 'opened' | 'failed';

export const MailsPage = () => {
  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  const loadEmails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/email/history');
      const data = res.data;
      setEmails(Array.isArray(data) ? data : data.emails || []);
    } catch (err) {
      console.error('Failed to load emails:', err);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  // Stats
  const totalSent = emails.length;
  const totalOpened = emails.filter(e => e.status === 'opened').length;
  const totalFailed = emails.filter(e => e.status === 'failed').length;
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

  // Filter & search
  const filteredEmails = emails.filter(e => {
    if (filter !== 'all' && e.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (e.to || '').toLowerCase().includes(q) ||
        (e.subject || '').toLowerCase().includes(q) ||
        (e.leadName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-AT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getEmailTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      secure_link: 'Secure Download Link',
      password: 'Passwort-Email',
      welcome: 'Willkommen',
      notification: 'Benachrichtigung',
      document_ready: 'Dokument bereit',
    };
    return types[type] || type || 'E-Mail';
  };

  return (
    <div className="mails-page">
      <div className="mails-header">
        <h1 className="mails-title">Mails</h1>
        <p className="mails-subtitle">
          E-Mail-Verlauf & Tracking-Übersicht
        </p>
      </div>

      {/* Stats */}
      <div className="mails-stats">
        <div className="mails-stat-card">
          <div className="mails-stat-icon">📧</div>
          <div className="mails-stat-value">{totalSent}</div>
          <div className="mails-stat-label">Gesendet</div>
        </div>
        <div className="mails-stat-card">
          <div className="mails-stat-icon">📬</div>
          <div className="mails-stat-value">{totalOpened}</div>
          <div className="mails-stat-label">Gelesen</div>
        </div>
        <div className="mails-stat-card">
          <div className="mails-stat-icon">📊</div>
          <div className="mails-stat-value">{openRate}%</div>
          <div className="mails-stat-label">Öffnungsrate</div>
        </div>
        <div className="mails-stat-card">
          <div className="mails-stat-icon">❌</div>
          <div className="mails-stat-value">{totalFailed}</div>
          <div className="mails-stat-label">Fehlgeschlagen</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mails-toolbar">
        <div className="mails-search">
          <span className="mails-search-icon">🔍</span>
          <input
            className="mails-search-input"
            placeholder="Suchen nach Empfänger, Betreff..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="mails-divider" />
        {([
          { key: 'all', label: 'Alle' },
          { key: 'sent', label: '📧 Gesendet' },
          { key: 'opened', label: '📬 Gelesen' },
          { key: 'failed', label: '❌ Fehler' },
        ] as { key: FilterKey; label: string }[]).map(f => (
          <button
            key={f.key}
            className={`mails-filter-chip ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Email List */}
      <div className="mails-list">
        {loading ? (
          <div className="mails-loading">
            <div className="mails-loading-icon">⏳</div>
            <div>Lade E-Mails...</div>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="mails-empty">
            <div className="mails-empty-icon">
              {emails.length === 0 ? '📭' : '🔍'}
            </div>
            <div className="mails-empty-title">
              {emails.length === 0 ? 'Noch keine E-Mails gesendet' : 'Keine Ergebnisse'}
            </div>
            <div className="mails-empty-desc">
              {emails.length === 0
                ? 'E-Mails werden automatisch getrackt sobald sie über das System versendet werden'
                : 'Versuche einen anderen Suchbegriff oder Filter'}
            </div>
          </div>
        ) : (
          filteredEmails.map(email => (
            <div key={email.id} className="mail-item">
              <div className={`mail-icon ${email.status}`}>
                {email.status === 'opened' ? '📬' : email.status === 'failed' ? '❌' : '📧'}
              </div>
              <div className="mail-content">
                <div className="mail-subject">{email.subject || 'Kein Betreff'}</div>
                <div className="mail-meta">
                  <span className="mail-recipient">An: {email.to}</span>
                  <span className="mail-meta-sep">·</span>
                  <span>{getEmailTypeLabel(email.emailType)}</span>
                  {email.leadName && (
                    <>
                      <span className="mail-meta-sep">·</span>
                      <span>Kunde: {email.leadName}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="mail-right">
                <span className={`mail-badge ${email.status}`}>
                  {email.status === 'opened'
                    ? `Gelesen${email.openCount > 1 ? ` (${email.openCount}x)` : ''}`
                    : email.status === 'failed'
                      ? 'Fehler'
                      : 'Gesendet'}
                </span>
                <span className="mail-time">{formatDate(email.sentAt)}</span>
                {email.openedAt && (
                  <span className="mail-open-count">
                    Geöffnet: {formatDate(email.openedAt)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
