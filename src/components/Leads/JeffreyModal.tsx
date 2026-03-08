// src/components/Leads/JeffreyModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '@/types';
import api from '@/services/api';
import './JeffreyModal.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface JeffreyModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
}

interface DocItem {
  id: string;
  label: string;
  category: string;
  required?: boolean;
  checked: boolean;
  documentId?: string;
  filename?: string;
}

interface CheckResult {
  lead: { id: string; name: string; email: string };
  completion: { percent: number; present: number; required: number };
  email: { to: string; subject: string; body: string; bodyHtml: string; missingCount: number };
  missingRequired: { id: string; label: string; category: string }[];
  missingOptional: { id: string; label: string; category: string }[];
  present?: { id: string; label: string; category: string; documentId?: string; filename?: string }[];
}

export const JeffreyModal: React.FC<JeffreyModalProps> = ({ isOpen, lead, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'subject' | 'body' | 'all' | null>(null);
  const [activeTab, setActiveTab] = useState<'check' | 'email'>('check');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const [checklist, setChecklist] = useState<DocItem[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [leadName, setLeadName] = useState('');
  const [completionInfo, setCompletionInfo] = useState({ percent: 0, present: 0, required: 0 });

  const emailBodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && lead) fetchReminder(lead.id);
    if (!isOpen) {
      setChecklist([]); setEmailSubject(''); setEmailBody(''); setEmailTo('');
      setError(null); setCopied(null); setActiveTab('check');
    }
  }, [isOpen, lead]);

  // Recalculate completion when checklist changes
  useEffect(() => {
    if (checklist.length === 0) return;
    const req = checklist.filter(i => i.required);
    const done = req.filter(i => i.checked);
    const pct = req.length > 0 ? Math.round((done.length / req.length) * 100) : 0;
    setCompletionInfo({ percent: pct, present: done.length, required: req.length });
  }, [checklist]);

  const fetchReminder = async (leadId: string) => {
    setIsLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/jeffrey/remind/${leadId}`, { method: 'POST' });
      if (!res.ok) throw new Error('Fehler beim Laden');
      const data: CheckResult = await res.json();

      setLeadName(data.lead.name);
      setEmailTo(data.email.to);
      setEmailSubject(data.email.subject);
      setEmailBody(data.email.body);
      setCompletionInfo(data.completion);

      // Build unified checklist
      const items: DocItem[] = [];
      if (data.present) {
        for (const p of data.present) {
          items.push({ id: p.id, label: p.label, category: p.category, required: true, checked: true, documentId: p.documentId, filename: p.filename });
        }
      }
      for (const m of data.missingRequired) {
        if (!items.find(i => i.id === m.id)) items.push({ id: m.id, label: m.label, category: m.category, required: true, checked: false });
      }
      for (const m of data.missingOptional) {
        if (!items.find(i => i.id === m.id)) items.push({ id: m.id, label: m.label, category: m.category, required: false, checked: false });
      }
      setChecklist(items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  // Regenerate email from current checklist state
  const regenerateEmail = () => {
    const firstName = leadName.split(' ')[0];
    const missing = checklist.filter(i => !i.checked && i.required);
    const missingOpt = checklist.filter(i => !i.checked && !i.required);
    const missingPers = missing.filter(m => m.category === 'PERSOENLICH');
    const missingImmo = missing.filter(m => m.category === 'IMMOBILIE');

    let body = `Sehr geehrte/r ${firstName},\n\nvielen Dank für Ihre Finanzierungsanfrage bei ImmoKredit.\n\n`;

    if (missing.length === 0) {
      body += `Wir freuen uns, Ihnen mitzuteilen, dass alle erforderlichen Unterlagen vollständig bei uns eingegangen sind. Wir werden Ihre Anfrage nun zeitnah bearbeiten und uns mit einem individuellen Angebot bei Ihnen melden.\n\n`;
    } else {
      body += `Um Ihre Finanzierung schnellstmöglich bearbeiten zu können, benötigen wir noch folgende Unterlagen von Ihnen:\n\n`;
      if (missingPers.length > 0) {
        body += `📋 Persönliche Unterlagen:\n`;
        for (const doc of missingPers) body += `  • ${doc.label}\n`;
        body += `\n`;
      }
      if (missingImmo.length > 0) {
        body += `🏠 Immobilien Unterlagen:\n`;
        for (const doc of missingImmo) body += `  • ${doc.label}\n`;
        body += `\n`;
      }
      if (missingOpt.length > 0) {
        body += `Falls vorhanden, wären auch hilfreich:\n`;
        for (const doc of missingOpt) body += `  • ${doc.label}\n`;
        body += `\n`;
      }
      body += `Bitte senden Sie die Unterlagen einfach als Antwort auf diese E-Mail oder als Foto/Scan an unsere E-Mail-Adresse.\n\n`;
      body += `Aktueller Stand: ${completionInfo.percent}% der erforderlichen Unterlagen sind vorhanden.\n\n`;
    }

    body += `Bei Fragen stehen wir Ihnen jederzeit gerne zur Verfügung.\n\nMit freundlichen Grüßen\nIhr ImmoKredit Team\n📞 +43 664 35 17 810\n✉️ info@immo-kredit.net`;

    const subject = missing.length === 0
      ? `ImmoKredit – Ihre Unterlagen sind vollständig ✅`
      : `ImmoKredit – Noch ${missing.length} Unterlage${missing.length > 1 ? 'n' : ''} benötigt`;

    setEmailSubject(subject);
    setEmailBody(body);
    setActiveTab('email');
  };

  const handleSendEmail = async () => {
    if (!lead) return;
    setSending(true);
    setSendResult(null);
    try {
      // Generate HTML version from plain text body
      const bodyHtml = generateHtmlFromBody(emailBody);

      await api.post('/email/send', {
        leadId: lead.id,
        to: emailTo,
        subject: emailSubject,
        bodyHtml,
        emailType: 'reminder',
      });
      setSendResult({ success: true, message: `Email an ${emailTo} gesendet` });
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Versand fehlgeschlagen';
      setSendResult({ success: false, message: errMsg });
    } finally {
      setSending(false);
    }
  };

  const generateHtmlFromBody = (body: string): string => {
    // Convert plain text email to styled HTML
    const lines = body.split('\n');
    let html = '<div style="font-family: Arial, sans-serif; font-size: 15px; color: #333; line-height: 1.6;">';
    for (const line of lines) {
      if (line.trim() === '') {
        html += '<br/>';
      } else if (line.startsWith('  ')) {
        html += `<li style="margin-left: 16px;">${line.trim().replace(/^[•\-]\s*/, '')}</li>`;
      } else {
        html += `<p style="margin: 4px 0;">${line}</p>`;
      }
    }
    html += '</div>';
    return html;
  };

  const handleCopy = async (text: string, type: 'subject' | 'body' | 'all') => {
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea'); ta.value = text;
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(type); setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyAll = () => handleCopy(`Betreff: ${emailSubject}\nAn: ${emailTo}\n\n${emailBody}`, 'all');

  const handleOpenMailClient = () => {
    window.open(`mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`, '_blank');
  };

  const handleEmailBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEmailBody(e.target.value);
    if (emailBodyRef.current) {
      emailBodyRef.current.style.height = 'auto';
      emailBodyRef.current.style.height = emailBodyRef.current.scrollHeight + 'px';
    }
  };

  if (!isOpen || !lead) return null;

  const missingRequiredCount = checklist.filter(i => !i.checked && i.required).length;
  const persoenlich = checklist.filter(i => i.category === 'PERSOENLICH');
  const immobilie = checklist.filter(i => i.category === 'IMMOBILIE');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal jeffrey-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header jeffrey-header">
          <div className="jeffrey-title-row">
            <span className="jeffrey-icon">🤖</span>
            <div>
              <h2 className="modal-title">Jeffrey – Unterlagen-Check</h2>
              <p className="jeffrey-subtitle">{leadName}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body jeffrey-body">
          {isLoading && (
            <div className="jeffrey-loading">
              <div className="jeffrey-loading-icon">🔍</div>
              <p>Jeffrey prüft die Unterlagen...</p>
            </div>
          )}

          {error && (
            <div className="jeffrey-error">
              <p>⚠️ {error}</p>
              <button className="btn btn-secondary" onClick={() => fetchReminder(lead.id)}>Erneut versuchen</button>
            </div>
          )}

          {!isLoading && !error && checklist.length > 0 && (
            <>
              {/* Progress */}
              <div className="jeffrey-progress-section">
                <div className="jeffrey-progress-header">
                  <span className="jeffrey-progress-label">Vollständigkeit</span>
                  <span className="jeffrey-progress-value">{completionInfo.percent}%</span>
                </div>
                <div className="jeffrey-progress-bar">
                  <div
                    className={`jeffrey-progress-fill ${completionInfo.percent === 100 ? 'complete' : completionInfo.percent >= 60 ? 'good' : 'low'}`}
                    style={{ width: `${completionInfo.percent}%` }}
                  />
                </div>
                <p className="jeffrey-progress-detail">
                  {completionInfo.present} von {completionInfo.required} Pflicht-Unterlagen vorhanden
                </p>
              </div>

              {/* Tabs */}
              <div className="jeffrey-tabs">
                <button className={`jeffrey-tab ${activeTab === 'check' ? 'active' : ''}`} onClick={() => setActiveTab('check')}>
                  📋 Checkliste
                </button>
                <button className={`jeffrey-tab ${activeTab === 'email' ? 'active' : ''}`} onClick={() => setActiveTab('email')}>
                  ✉️ Email-Vorlage
                  {missingRequiredCount > 0 && <span className="jeffrey-tab-badge">{missingRequiredCount}</span>}
                </button>
              </div>

              {/* ── Tab: Editable Checkliste ── */}
              {activeTab === 'check' && (
                <div className="jeffrey-checklist">
                  <p className="jeffrey-checklist-hint">
                    💡 Klicke auf einen Punkt um ihn als vorhanden/fehlend zu markieren
                  </p>

                  <div className="jeffrey-section">
                    <h4 className="jeffrey-section-title">📋 Persönliche Unterlagen</h4>
                    {persoenlich.map(item => (
                      <div
                        key={item.id}
                        className={`jeffrey-doc-item clickable ${item.checked ? 'present' : 'missing'}`}
                        onClick={() => toggleChecklistItem(item.id)}
                      >
                        <span className="jeffrey-checkbox">{item.checked ? '✅' : '⬜'}</span>
                        <span className={`jeffrey-doc-label ${item.checked ? 'checked' : ''}`}>{item.label}</span>
                        {!item.required && <span className="jeffrey-optional-tag">optional</span>}
                        {item.filename && <span className="jeffrey-filename" title={item.filename}>📎</span>}
                      </div>
                    ))}
                  </div>

                  <div className="jeffrey-section">
                    <h4 className="jeffrey-section-title">🏠 Immobilien Unterlagen</h4>
                    {immobilie.map(item => (
                      <div
                        key={item.id}
                        className={`jeffrey-doc-item clickable ${item.checked ? 'present' : 'missing'}`}
                        onClick={() => toggleChecklistItem(item.id)}
                      >
                        <span className="jeffrey-checkbox">{item.checked ? '✅' : '⬜'}</span>
                        <span className={`jeffrey-doc-label ${item.checked ? 'checked' : ''}`}>{item.label}</span>
                        {!item.required && <span className="jeffrey-optional-tag">optional</span>}
                        {item.filename && <span className="jeffrey-filename" title={item.filename}>📎</span>}
                      </div>
                    ))}
                  </div>

                  <button className="btn btn-primary jeffrey-generate-btn" onClick={regenerateEmail}>
                    ✉️ Email aus Checkliste generieren
                  </button>
                </div>
              )}

              {/* ── Tab: Editable Email ── */}
              {activeTab === 'email' && (
                <div className="jeffrey-email">
                  <div className="jeffrey-email-field">
                    <div className="jeffrey-email-label-row"><label>An</label></div>
                    <input type="email" className="jeffrey-email-input" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />
                  </div>

                  <div className="jeffrey-email-field">
                    <div className="jeffrey-email-label-row">
                      <label>Betreff</label>
                      <button className={`btn-copy ${copied === 'subject' ? 'copied' : ''}`} onClick={() => handleCopy(emailSubject, 'subject')}>
                        {copied === 'subject' ? '✓ Kopiert' : '📋 Kopieren'}
                      </button>
                    </div>
                    <input type="text" className="jeffrey-email-input" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                  </div>

                  <div className="jeffrey-email-field">
                    <div className="jeffrey-email-label-row">
                      <label>Nachricht</label>
                      <button className={`btn-copy ${copied === 'body' ? 'copied' : ''}`} onClick={() => handleCopy(emailBody, 'body')}>
                        {copied === 'body' ? '✓ Kopiert' : '📋 Kopieren'}
                      </button>
                    </div>
                    <textarea
                      ref={emailBodyRef}
                      className="jeffrey-email-textarea"
                      value={emailBody}
                      onChange={handleEmailBodyChange}
                      rows={12}
                    />
                  </div>

                  {sendResult && (
                    <div className={`jeffrey-send-result ${sendResult.success ? 'success' : 'error'}`}>
                      {sendResult.success ? '✅' : '❌'} {sendResult.message}
                    </div>
                  )}

                  <div className="jeffrey-email-actions">
                    <button className={`btn btn-secondary ${copied === 'all' ? 'btn-copied' : ''}`} onClick={handleCopyAll}>
                      {copied === 'all' ? '✓ Alles kopiert!' : '📋 Alles kopieren'}
                    </button>
                    <button className="btn btn-secondary" onClick={handleOpenMailClient}>
                      ✉️ In Mail-App öffnen
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleSendEmail}
                      disabled={sending || sendResult?.success === true}
                    >
                      {sending ? '⏳ Sende...' : sendResult?.success ? '✓ Gesendet' : '📨 Direkt senden'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};