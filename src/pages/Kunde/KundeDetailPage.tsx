// src/pages/Kunde/KundeDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { SignaturePad } from '@/components/Signature/SignaturePad';
import './KundePage.css';

interface KundeOverview {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  person: any | null;
  haushalt: any | null;
  finanzplan: any | null;
  objekte: any[];
  documents: { id: string; type: string; originalFilename: string }[];
}

interface EmailTrackingEntry {
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
}

interface OcrResult {
  documentId: string;
  filename: string;
  documentType: string;
  fieldsExtracted: number;
}

interface Kennzahlen {
  dsti: number | null;
  dstiProzent: number | null;
  dstiBewertung: 'gut' | 'akzeptabel' | 'kritisch' | 'unvollständig';
  dstiDetails: {
    monatlicheKreditrate: number | null;
    monatlichesNettoeinkommen: number | null;
    bestandskrediteRate: number | null;
    gesamtBelastung: number | null;
  };
  ltv: number | null;
  ltvProzent: number | null;
  ltvBewertung: 'gut' | 'akzeptabel' | 'kritisch' | 'unvollständig';
  ltvDetails: {
    finanzierungsbedarf: number | null;
    immobilienwert: number | null;
    eigenmittelQuote: number | null;
  };
  geschaetzterImmowert: number | null;
  immowertDetails: {
    basisPreisProQm: number | null;
    flaeche: number | null;
    plz: string | null;
    objektTyp: string | null;
    baujahr: number | null;
    objektTypFaktor: number;
    baujahrFaktor: number;
    energieFaktor: number;
    berechnungsMethode: 'kaufpreis' | 'schaetzung' | 'nicht_moeglich';
  };
}

const tiles = [
  { key: 'person', label: 'Person', icon: '👤', path: 'person' },
  { key: 'haushalt', label: 'Haushalt', icon: '🏠', path: 'haushalt' },
  { key: 'finanzplan', label: 'Finanzplan', icon: '📊', path: 'finanzplan' },
  { key: 'objekt', label: 'Objekt', icon: '🏡', path: 'objekt' },
];

const formatCurrency = (val: number | null) => {
  if (val === null || val === undefined) return '—';
  return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
};

const getBewertungStyle = (bewertung: string) => {
  switch (bewertung) {
    case 'gut': return { color: '#10b981', bg: '#ecfdf5', label: 'Gut' };
    case 'akzeptabel': return { color: '#f59e0b', bg: '#fffbeb', label: 'Akzeptabel' };
    case 'kritisch': return { color: '#ef4444', bg: '#fef2f2', label: 'Kritisch' };
    default: return { color: '#94a3b8', bg: '#f8fafc', label: 'Unvollst.' };
  }
};

export const KundeDetailPage: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [kunde, setKunde] = useState<KundeOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [ocrResults, setOcrResults] = useState<OcrResult[] | null>(null);
  const [ocrError, setOcrError] = useState('');
  const [kennzahlen, setKennzahlen] = useState<Kennzahlen | null>(null);
  const [emailHistory, setEmailHistory] = useState<EmailTrackingEntry[]>([]);
  const [dealStage, setDealStage] = useState<string | null>(null);
  const [signatureStatus, setSignatureStatus] = useState<{ signed: boolean; signatures: any[] }>({ signed: false, signatures: [] });
  const [secureLinkSent, setSecureLinkSent] = useState(false);
  const [sendingSecureLink, setSendingSecureLink] = useState(false);

  useEffect(() => {
    if (leadId) {
      loadKunde();
      loadKennzahlen();
      loadEmailHistory();
      loadDealStage();
      loadSignatureStatus();
    }
  }, [leadId]);

  const loadKunde = async () => {
    try {
      const res = await api.get(`/kunde/${leadId}`);
      setKunde(res.data);
    } catch (err) {
      console.error('Failed to load kunde:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadKennzahlen = async () => {
    try {
      const res = await api.get(`/kunde/${leadId}/kennzahlen`);
      setKennzahlen(res.data);
    } catch (err) {
      console.error('Failed to load kennzahlen:', err);
    }
  };

  const loadEmailHistory = async () => {
    try {
      const res = await api.get(`/email/history/${leadId}`);
      setEmailHistory(res.data);
    } catch (err) {
      console.error('Failed to load email history:', err);
    }
  };

  const loadDealStage = async () => {
    try {
      const res = await api.get('/deals');
      const deal = res.data.find((d: any) => d.leadId === leadId);
      if (deal) setDealStage(deal.stage);
    } catch (err) {
      console.error('Failed to load deal:', err);
    }
  };

  const loadSignatureStatus = async () => {
    try {
      const res = await api.get(`/signature/status/${leadId}`);
      setSignatureStatus(res.data);
    } catch (err) {
      console.error('Failed to load signature status:', err);
    }
  };

  const handleSendSecureLink = async () => {
    if (!leadId) return;
    setSendingSecureLink(true);
    try {
      await api.post('/secure-link/create', { leadId });
      setSecureLinkSent(true);
      loadEmailHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Fehler beim Erstellen des Links');
    } finally {
      setSendingSecureLink(false);
    }
  };

  const runJeffreyOCR = async () => {
    if (!leadId) return;
    setAnalyzing(true);
    setOcrResults(null);
    setOcrError('');
    try {
      const res = await api.post(`/jeffrey-ocr/ocr-all/${leadId}`);
      setOcrResults(res.data.results);
      // Reload customer data + recalculate Kennzahlen
      await loadKunde();
      await loadKennzahlen();
    } catch (err: any) {
      console.error('OCR failed:', err);
      setOcrError(err.response?.data?.error || 'Analyse fehlgeschlagen');
    } finally {
      setAnalyzing(false);
    }
  };

  const getFilledFieldCount = (key: string) => {
    if (!kunde) return 0;
    let data: any = null;
    if (key === 'person') data = kunde.person;
    if (key === 'haushalt') data = kunde.haushalt;
    if (key === 'finanzplan') data = kunde.finanzplan;
    if (key === 'objekt') data = kunde.objekte[0] || null;
    if (!data) return 0;
    const skip = ['id', 'leadId', 'createdAt', 'updatedAt'];
    return Object.entries(data).filter(([k, v]) =>
      !skip.includes(k) && v !== null && v !== undefined && v !== ''
    ).length;
  };

  if (loading) return <div className="kunde-page"><div className="kunde-loading">Lade...</div></div>;
  if (!kunde) return <div className="kunde-page"><div className="kunde-loading">Kunde nicht gefunden</div></div>;

  const docCount = kunde.documents?.length || 0;

  return (
    <div className="kunde-page">
      <div className="kunde-detail-header">
        <button className="btn-back" onClick={() => navigate('/kunde')}>← Zurück</button>
        <div className="kunde-detail-info">
          <h1 className="kunde-title">{kunde.firstName} {kunde.lastName}</h1>
          <p className="kunde-subtitle">{kunde.email} · {kunde.phone}</p>
        </div>
      </div>

      {/* Jeffrey OCR Section */}
      <div className="jeffrey-section">
        <div className="jeffrey-header">
          <div className="jeffrey-info">
            <span className="jeffrey-icon">🤖</span>
            <div>
              <h3 className="jeffrey-title">Jeffrey Dokumenten-Analyse</h3>
              <p className="jeffrey-desc">
                {docCount} Dokument{docCount !== 1 ? 'e' : ''} vorhanden.
                Jeffrey analysiert alle Dokumente und befüllt die Kundenfelder automatisch.
              </p>
            </div>
          </div>
          <button
            className={`jeffrey-btn ${analyzing ? 'analyzing' : ''}`}
            onClick={runJeffreyOCR}
            disabled={analyzing || docCount === 0}
          >
            {analyzing ? (
              <><span className="jeffrey-spinner">⏳</span> Analysiere...</>
            ) : (
              <>🔍 Dokumente analysieren</>
            )}
          </button>
        </div>

        {/* OCR Results */}
        {ocrResults && ocrResults.length > 0 && (
          <div className="jeffrey-results">
            <p className="jeffrey-results-title">✅ {ocrResults.length} Dokument{ocrResults.length !== 1 ? 'e' : ''} analysiert:</p>
            {ocrResults.map((r, i) => (
              <div key={i} className="jeffrey-result-item">
                <span className="jeffrey-result-type">{r.documentType}</span>
                <span className="jeffrey-result-file">{r.filename}</span>
                <span className="jeffrey-result-fields">{r.fieldsExtracted} Felder erkannt</span>
              </div>
            ))}
          </div>
        )}

        {ocrResults && ocrResults.length === 0 && (
          <div className="jeffrey-results">
            <p className="jeffrey-results-empty">Keine neuen Dokumente zum Analysieren gefunden.</p>
          </div>
        )}

        {ocrError && (
          <div className="jeffrey-error">❌ {ocrError}</div>
        )}
      </div>

      {/* Kennzahlen Section */}
      {kennzahlen && (
        <>
          <p className="kunde-section-label">Kennzahlen</p>
          <div className="kennzahlen-grid">
            {/* DSTI */}
            <div className="kennzahl-card">
              <div className="kennzahl-header">
                <span className="kennzahl-label">DSTI</span>
                <span className="kennzahl-sublabel">Debt-Service-To-Income</span>
              </div>
              <div className="kennzahl-value-row">
                <span className="kennzahl-value">
                  {kennzahlen.dstiProzent !== null ? `${kennzahlen.dstiProzent}%` : '—'}
                </span>
                {(() => {
                  const style = getBewertungStyle(kennzahlen.dstiBewertung);
                  return (
                    <span className="kennzahl-badge" style={{ color: style.color, background: style.bg }}>
                      {style.label}
                    </span>
                  );
                })()}
              </div>
              <div className="kennzahl-details">
                <div className="kennzahl-detail-row">
                  <span>Kreditrate/Monat</span>
                  <span>{formatCurrency(kennzahlen.dstiDetails.monatlicheKreditrate)}</span>
                </div>
                <div className="kennzahl-detail-row">
                  <span>Nettoeinkommen</span>
                  <span>{formatCurrency(kennzahlen.dstiDetails.monatlichesNettoeinkommen)}</span>
                </div>
                {kennzahlen.dstiDetails.bestandskrediteRate ? (
                  <div className="kennzahl-detail-row">
                    <span>Bestandskredite</span>
                    <span>{formatCurrency(kennzahlen.dstiDetails.bestandskrediteRate)}</span>
                  </div>
                ) : null}
              </div>
              <div className="kennzahl-scale">
                <div className="kennzahl-scale-bar">
                  <div className="kennzahl-scale-zone green" style={{ width: '35%' }} />
                  <div className="kennzahl-scale-zone yellow" style={{ width: '10%' }} />
                  <div className="kennzahl-scale-zone red" style={{ width: '55%' }} />
                  {kennzahlen.dstiProzent !== null && (
                    <div
                      className="kennzahl-scale-marker"
                      style={{ left: `${Math.min(kennzahlen.dstiProzent, 100)}%` }}
                    />
                  )}
                </div>
                <div className="kennzahl-scale-labels">
                  <span>0%</span>
                  <span>35%</span>
                  <span>45%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* LTV */}
            <div className="kennzahl-card">
              <div className="kennzahl-header">
                <span className="kennzahl-label">LTV</span>
                <span className="kennzahl-sublabel">Loan-To-Value</span>
              </div>
              <div className="kennzahl-value-row">
                <span className="kennzahl-value">
                  {kennzahlen.ltvProzent !== null ? `${kennzahlen.ltvProzent}%` : '—'}
                </span>
                {(() => {
                  const style = getBewertungStyle(kennzahlen.ltvBewertung);
                  return (
                    <span className="kennzahl-badge" style={{ color: style.color, background: style.bg }}>
                      {style.label}
                    </span>
                  );
                })()}
              </div>
              <div className="kennzahl-details">
                <div className="kennzahl-detail-row">
                  <span>Finanzierungsbedarf</span>
                  <span>{formatCurrency(kennzahlen.ltvDetails.finanzierungsbedarf)}</span>
                </div>
                <div className="kennzahl-detail-row">
                  <span>Immobilienwert</span>
                  <span>{formatCurrency(kennzahlen.ltvDetails.immobilienwert)}</span>
                </div>
                {kennzahlen.ltvDetails.eigenmittelQuote !== null && (
                  <div className="kennzahl-detail-row">
                    <span>Eigenmittelquote</span>
                    <span>{kennzahlen.ltvDetails.eigenmittelQuote}%</span>
                  </div>
                )}
              </div>
              <div className="kennzahl-scale">
                <div className="kennzahl-scale-bar">
                  <div className="kennzahl-scale-zone green" style={{ width: '80%' }} />
                  <div className="kennzahl-scale-zone yellow" style={{ width: '10%' }} />
                  <div className="kennzahl-scale-zone red" style={{ width: '10%' }} />
                  {kennzahlen.ltvProzent !== null && (
                    <div
                      className="kennzahl-scale-marker"
                      style={{ left: `${Math.min(kennzahlen.ltvProzent, 100)}%` }}
                    />
                  )}
                </div>
                <div className="kennzahl-scale-labels">
                  <span>0%</span>
                  <span>80%</span>
                  <span>90%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Immowert */}
            <div className="kennzahl-card kennzahl-card-wide">
              <div className="kennzahl-header">
                <span className="kennzahl-label">Gesch. Immobilienwert</span>
                <span className="kennzahl-sublabel">
                  {kennzahlen.immowertDetails.berechnungsMethode === 'kaufpreis'
                    ? 'Basierend auf Kaufpreis'
                    : kennzahlen.immowertDetails.berechnungsMethode === 'schaetzung'
                      ? 'Automatische Schätzung'
                      : 'Nicht genug Daten'}
                </span>
              </div>
              <div className="kennzahl-value-row">
                <span className="kennzahl-value kennzahl-value-large">
                  {formatCurrency(kennzahlen.geschaetzterImmowert)}
                </span>
              </div>
              {kennzahlen.immowertDetails.berechnungsMethode === 'schaetzung' && (
                <div className="kennzahl-details">
                  <div className="kennzahl-detail-row">
                    <span>PLZ / Region</span>
                    <span>{kennzahlen.immowertDetails.plz || '—'}</span>
                  </div>
                  <div className="kennzahl-detail-row">
                    <span>Fläche</span>
                    <span>{kennzahlen.immowertDetails.flaeche ? `${kennzahlen.immowertDetails.flaeche} m²` : '—'}</span>
                  </div>
                  <div className="kennzahl-detail-row">
                    <span>Basis €/m²</span>
                    <span>{kennzahlen.immowertDetails.basisPreisProQm ? `${formatCurrency(kennzahlen.immowertDetails.basisPreisProQm)}` : '—'}</span>
                  </div>
                  <div className="kennzahl-detail-row">
                    <span>Objekttyp-Faktor</span>
                    <span>{kennzahlen.immowertDetails.objektTypFaktor}x ({kennzahlen.immowertDetails.objektTyp || '—'})</span>
                  </div>
                  <div className="kennzahl-detail-row">
                    <span>Baujahr-Faktor</span>
                    <span>{kennzahlen.immowertDetails.baujahrFaktor}x ({kennzahlen.immowertDetails.baujahr || '—'})</span>
                  </div>
                  <div className="kennzahl-detail-row">
                    <span>Energie-Faktor</span>
                    <span>{kennzahlen.immowertDetails.energieFaktor}x</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <p className="kunde-section-label">Finanzierungsdaten</p>

      <div className="kunde-tiles">
        {tiles.map(tile => {
          const fieldCount = getFilledFieldCount(tile.key);
          return (
            <div
              key={tile.key}
              className={`kunde-tile ${fieldCount > 0 ? 'has-data' : ''}`}
              onClick={() => navigate(`/kunde/${leadId}/${tile.path}`)}
            >
              <div className="kunde-tile-icon">{tile.icon}</div>
              <div className="kunde-tile-label">{tile.label}</div>
              {fieldCount > 0 && (
                <span className="kunde-tile-count">{fieldCount} Felder</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Digital Signature Section — only show at UNTERLAGEN_VOLLSTAENDIG */}
      {dealStage === 'UNTERLAGEN_VOLLSTAENDIG' && !signatureStatus.signed && (
        <SignaturePad
          leadId={leadId!}
          signerName={`${kunde.firstName} ${kunde.lastName}`}
          onSigned={() => loadSignatureStatus()}
        />
      )}

      {signatureStatus.signed && (
        <div className="signature-status-card">
          <span className="signature-status-icon">✅</span>
          <div>
            <strong>Digital signiert</strong>
            <span className="signature-status-detail">
              {signatureStatus.signatures.map(s =>
                `${s.signerName} (${new Date(s.signedAt).toLocaleDateString('de-AT')})`
              ).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Secure Document Link — only show at ABGESCHLOSSEN */}
      {dealStage === 'ABGESCHLOSSEN' && (
        <div className="secure-link-section">
          <div className="secure-link-header">
            <span className="secure-link-icon">🔒</span>
            <div>
              <h3 className="secure-link-title">Verschlüsselter Dokumenten-Link</h3>
              <p className="secure-link-desc">
                Sendet dem Kunden einen passwortgeschützten Download-Link + separates Passwort per Email.
              </p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSendSecureLink}
            disabled={sendingSecureLink || secureLinkSent}
          >
            {sendingSecureLink ? '⏳ Wird erstellt...' : secureLinkSent ? '✅ Link gesendet' : '📨 Link + Passwort senden'}
          </button>
        </div>
      )}

      {/* Email Tracking Section */}
      {emailHistory.length > 0 && (
        <>
          <p className="kunde-section-label">Email-Verlauf</p>
          <div className="email-tracking-list">
            {emailHistory.map(email => (
              <div key={email.id} className={`email-tracking-item ${email.status}`}>
                <div className="email-tracking-icon">
                  {email.status === 'opened' ? '📬' : email.status === 'failed' ? '❌' : '📧'}
                </div>
                <div className="email-tracking-content">
                  <div className="email-tracking-subject">{email.subject}</div>
                  <div className="email-tracking-meta">
                    An: {email.to} · {new Date(email.sentAt).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="email-tracking-status">
                  {email.status === 'opened' ? (
                    <span className="email-badge opened">
                      Gelesen {email.openCount > 1 ? `(${email.openCount}x)` : ''}
                    </span>
                  ) : email.status === 'failed' ? (
                    <span className="email-badge failed">Fehler</span>
                  ) : (
                    <span className="email-badge sent">Gesendet</span>
                  )}
                  {email.openedAt && (
                    <span className="email-opened-time">
                      {new Date(email.openedAt).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
