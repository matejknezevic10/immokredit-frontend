// src/pages/Mails/MailsPage.tsx
import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import './MailsPage.css';

interface InboxEmail {
  id: string;
  from: string;
  subject: string;
  receivedAt: string;
  attachments: { filename: string; type: string }[];
  leadId?: string;
  leadName?: string;
}

export const MailsPage = () => {
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/email/inbox');
      setEmails(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load inbox:', err);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const filteredEmails = emails.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (e.from || '').toLowerCase().includes(q) ||
      (e.subject || '').toLowerCase().includes(q) ||
      (e.leadName || '').toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-AT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="mails-page">
      <div className="mails-header">
        <h1 className="mails-title">Posteingang</h1>
        <p className="mails-subtitle">
          Eingegangene E-Mails mit Dokumenten
        </p>
      </div>

      {/* Stats */}
      <div className="mails-stats">
        <div className="mails-stat-card">
          <div className="mails-stat-icon">📨</div>
          <div className="mails-stat-value">{emails.length}</div>
          <div className="mails-stat-label">Eingegangen</div>
        </div>
        <div className="mails-stat-card">
          <div className="mails-stat-icon">📎</div>
          <div className="mails-stat-value">{emails.reduce((sum, e) => sum + e.attachments.length, 0)}</div>
          <div className="mails-stat-label">Anhänge</div>
        </div>
        <div className="mails-stat-card">
          <div className="mails-stat-icon">👤</div>
          <div className="mails-stat-value">{emails.filter(e => e.leadName).length}</div>
          <div className="mails-stat-label">Zugeordnet</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mails-toolbar">
        <div className="mails-search">
          <span className="mails-search-icon">🔍</span>
          <input
            className="mails-search-input"
            placeholder="Suchen nach Absender, Betreff, Kunde..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          className="mails-filter-chip active"
          onClick={loadInbox}
        >
          🔄 Aktualisieren
        </button>
      </div>

      {/* Email List */}
      <div className="mails-list">
        {loading ? (
          <div className="mails-loading">
            <div className="mails-loading-icon">⏳</div>
            <div>Lade Posteingang...</div>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="mails-empty">
            <div className="mails-empty-icon">
              {emails.length === 0 ? '📭' : '🔍'}
            </div>
            <div className="mails-empty-title">
              {emails.length === 0 ? 'Posteingang ist leer' : 'Keine Ergebnisse'}
            </div>
            <div className="mails-empty-desc">
              {emails.length === 0
                ? 'Eingegangene E-Mails mit Dokumenten werden hier angezeigt'
                : 'Versuche einen anderen Suchbegriff'}
            </div>
          </div>
        ) : (
          filteredEmails.map(email => (
            <div key={email.id} className="mail-item">
              <div className="mail-icon sent">📨</div>
              <div className="mail-content">
                <div className="mail-subject">{email.subject}</div>
                <div className="mail-meta">
                  <span className="mail-recipient">Von: {email.from}</span>
                  {email.leadName && (
                    <>
                      <span className="mail-meta-sep">·</span>
                      <span>Kunde: {email.leadName}</span>
                    </>
                  )}
                  {email.attachments.length > 0 && (
                    <>
                      <span className="mail-meta-sep">·</span>
                      <span>📎 {email.attachments.length} Anhang{email.attachments.length > 1 ? 'e' : ''}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="mail-right">
                <span className="mail-time">{formatDate(email.receivedAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
