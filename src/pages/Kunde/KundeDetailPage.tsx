// src/pages/Kunde/KundeDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { SignaturePad } from '@/components/Signature/SignaturePad';
import { JeffreyModal } from '@/components/Leads/JeffreyModal';
import './KundePage.css';

interface KundeOverview {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  person: any | null;
  personen: any[];
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendMethod, setSendMethod] = useState<'secure-link' | 'pdf-attachment'>('secure-link');
  const [sendingDocs, setSendingDocs] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientEmailOption, setRecipientEmailOption] = useState<'default' | 'custom'>('default');
  const [bankName, setBankName] = useState('');
  const [showJeffreyCheck, setShowJeffreyCheck] = useState(false);
  const [showSignatureLinkModal, setShowSignatureLinkModal] = useState(false);
  const [signatureLinkUrl, setSignatureLinkUrl] = useState('');
  const [signatureLinkLoading, setSignatureLinkLoading] = useState(false);
  const [emailHistoryOpen, setEmailHistoryOpen] = useState(false);
  const [pflichtfelder, setPflichtfelder] = useState<any>(null);

  useEffect(() => {
    if (leadId) {
      loadKunde();
      loadKennzahlen();
      loadEmailHistory();
      loadDealStage();
      loadSignatureStatus();
      loadPflichtfelder();
    }
  }, [leadId]);

  const loadPflichtfelder = async () => {
    try {
      const res = await api.get(`/kunde/${leadId}/pflichtfelder`);
      setPflichtfelder(res.data);
    } catch (err) {
      console.error('Failed to load pflichtfelder:', err);
    }
  };

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !leadId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('customer_id', leadId);
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const count = res.data.documents?.length || 0;
      toast.success(`${count} Dokument${count !== 1 ? 'e' : ''} hochgeladen`);
      loadKunde();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Fehler beim Hochladen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendDocuments = async () => {
    if (!leadId) return;
    setSendingDocs(true);
    try {
      if (sendMethod === 'secure-link') {
        const email = recipientEmailOption === 'custom' ? recipientEmail.trim() : undefined;
        await api.post('/secure-link/create', { leadId, recipientEmail: email });
        toast.success(`Link + Passwort an ${email || kunde?.email || 'Empfänger'} gesendet`);
      } else {
        const email = recipientEmail.trim();
        if (!email) return;
        const res = await api.post('/secure-link/send-to-bank', {
          leadId,
          recipientEmail: email,
          recipientName: bankName.trim() || undefined,
        });
        toast.success(`${res.data.documentCount} Dokumente an ${email} gesendet`);
      }
      setShowSendModal(false);
      setRecipientEmail('');
      setRecipientEmailOption('default');
      setBankName('');
      setSendMethod('secure-link');
      loadEmailHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Fehler beim Senden');
    } finally {
      setSendingDocs(false);
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
    if (key === 'person') data = kunde.personen?.[0] || kunde.person;
    if (key === 'haushalt') data = kunde.haushalt;
    if (key === 'finanzplan') data = kunde.finanzplan;
    if (key === 'objekt') data = kunde.objekte[0] || null;
    if (!data) return 0;
    const skip = ['id', 'leadId', 'personNumber', 'createdAt', 'updatedAt'];
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
        <button
          className="kunde-archive-btn"
          onClick={async () => {
            if (!confirm(`${kunde.firstName} ${kunde.lastName} archivieren?`)) return;
            try {
              await api.post(`/leads/${leadId}/archive`);
              toast.success('Kunde archiviert');
              navigate('/kunde');
            } catch (err: any) {
              toast.error(err.response?.data?.error || 'Fehler beim Archivieren');
            }
          }}
          title="Archivieren"
        >
          📦
        </button>
      </div>

      {/* Jeffrey OCR — kompakte Inline-Leiste */}
      <div className="jeffrey-section jeffrey-compact">
        <div className="jeffrey-header">
          <div className="jeffrey-info">
            <span className="jeffrey-icon">🤖</span>
            <span className="jeffrey-title">Jeffrey</span>
            <span className="jeffrey-desc">{docCount} Dokument{docCount !== 1 ? 'e' : ''}</span>
          </div>
          <div className="jeffrey-actions">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.tiff,.doc,.docx,.xls,.xlsx,.csv"
              style={{ display: 'none' }}
            />
            <button
              className="jeffrey-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? '⏳ Lade...' : '📤 Hochladen'}
            </button>
            <button
              className="jeffrey-btn"
              onClick={() => setShowJeffreyCheck(true)}
            >
              📋 Unterlagen prüfen
            </button>
            <button
              className={`jeffrey-btn ${analyzing ? 'analyzing' : ''}`}
              onClick={runJeffreyOCR}
              disabled={analyzing || docCount === 0}
            >
              {analyzing ? (
                <><span className="jeffrey-spinner">⏳</span> Analysiere...</>
              ) : (
                <>🔍 OCR Analysieren</>
              )}
            </button>
          </div>
        </div>
        {ocrResults && ocrResults.length > 0 && (
          <div className="jeffrey-results">
            {ocrResults.map((r, i) => (
              <div key={i} className="jeffrey-result-item">
                <span className="jeffrey-result-type">{r.documentType}</span>
                <span className="jeffrey-result-file">{r.filename}</span>
                <span className="jeffrey-result-fields">{r.fieldsExtracted} Felder</span>
              </div>
            ))}
          </div>
        )}
        {ocrResults && ocrResults.length === 0 && (
          <div className="jeffrey-results">
            <p className="jeffrey-results-empty">Keine neuen Dokumente zum Analysieren.</p>
          </div>
        )}
        {ocrError && <div className="jeffrey-error">❌ {ocrError}</div>}
      </div>

      {/* Finanzierungsdaten — sofort sichtbar */}
      <p className="kunde-section-label">Finanzierungsdaten</p>
      <div className="kunde-tiles">
        {tiles.map(tile => {
          const fieldCount = getFilledFieldCount(tile.key);
          const personCount = tile.key === 'person' ? (kunde.personen?.length || (kunde.person ? 1 : 0)) : 0;

          // Pflichtfelder completion check
          let isComplete = false;
          let missingCount = 0;
          if (pflichtfelder) {
            if (tile.key === 'person') {
              isComplete = pflichtfelder.person?.complete || false;
              missingCount = pflichtfelder.person?.personen?.reduce((sum: number, p: any) => sum + (p.missingFields?.length || 0), 0) || 0;
            } else if (tile.key === 'haushalt') {
              isComplete = pflichtfelder.haushalt?.complete || false;
              missingCount = pflichtfelder.haushalt?.missingFields?.length || 0;
            } else if (tile.key === 'finanzplan') {
              isComplete = pflichtfelder.finanzplan?.complete || false;
              missingCount = pflichtfelder.finanzplan?.missingFields?.length || 0;
            } else if (tile.key === 'objekt') {
              isComplete = pflichtfelder.objekt?.complete || false;
              missingCount = pflichtfelder.objekt?.objekte?.reduce((sum: number, o: any) => sum + (o.missingFields?.length || 0), 0) || 0;
            }
          }

          return (
            <div
              key={tile.key}
              className={`kunde-tile ${isComplete ? 'complete' : fieldCount > 0 ? 'has-data' : ''}`}
              onClick={() => navigate(`/kunde/${leadId}/${tile.path}`)}
            >
              <div className="kunde-tile-icon">{tile.icon}</div>
              <div className="kunde-tile-label">{tile.label}</div>
              {isComplete ? (
                <span className="kunde-tile-count" style={{ color: '#10b981' }}>✅ Vollständig</span>
              ) : missingCount > 0 ? (
                <span className="kunde-tile-count" style={{ color: '#f59e0b' }}>
                  {missingCount} Pflichtfeld{missingCount !== 1 ? 'er' : ''} fehlt
                </span>
              ) : tile.key === 'person' && personCount > 1 ? (
                <span className="kunde-tile-count">{personCount} Kreditnehmer</span>
              ) : fieldCount > 0 ? (
                <span className="kunde-tile-count">{fieldCount} Felder</span>
              ) : null}
            </div>
          );
        })}
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

      {/* Digital Signature Section — show from Aufbereitung (UNTERLAGEN_SAMMELN) onwards */}
      {dealStage && ['UNTERLAGEN_SAMMELN', 'UNTERLAGEN_VOLLSTAENDIG', 'BANK_ANFRAGE', 'WARTEN_AUF_ZUSAGE', 'ZUSAGE_ERHALTEN', 'ABGESCHLOSSEN'].includes(dealStage) && !signatureStatus.signed && (
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

      {/* Unterlagen versenden — unified section */}
      <div className="secure-link-section">
        <div className="secure-link-header">
          <span className="secure-link-icon">📨</span>
          <div>
            <h3 className="secure-link-title">Unterlagen versenden</h3>
            <p className="secure-link-desc">
              Dokumente per verschlüsseltem Link oder als PDF-Anhang versenden.
            </p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowSendModal(true)}
          disabled={sendingDocs}
        >
          📨 Unterlagen versenden
        </button>
      </div>

      {/* Signatur-Link Section — always visible, directly under secure link */}
      <div className="secure-link-section">
        <div className="secure-link-header">
          <span className="secure-link-icon">✍️</span>
          <div>
            <h3 className="secure-link-title">Signatur-Link</h3>
            <p className="secure-link-desc">
              Erstellt einen Link, den der Kunde zum digitalen Unterschreiben öffnen kann.
            </p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          disabled={signatureLinkLoading}
          onClick={async () => {
            setSignatureLinkLoading(true);
            try {
              const res = await api.post('/signature/create-link', { leadId });
              setSignatureLinkUrl(res.data.signatureUrl);
              setShowSignatureLinkModal(true);
            } catch (err: any) {
              toast.error(err.response?.data?.error || 'Fehler beim Erstellen');
            } finally {
              setSignatureLinkLoading(false);
            }
          }}
        >
          {signatureLinkLoading ? '⏳ Erstelle...' : '🔗 Signatur-Link erstellen'}
        </button>
      </div>

      {/* Unterlagen versenden Modal */}
      {showSendModal && (
        <div className="modal-overlay" onClick={() => !sendingDocs && setShowSendModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '24px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px' }}>📨 Unterlagen versenden</h2>

            {/* Send method toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: '8px', border: sendMethod === 'secure-link' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  background: sendMethod === 'secure-link' ? '#eff6ff' : '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  color: sendMethod === 'secure-link' ? '#2563eb' : '#64748b', transition: 'all 0.15s',
                }}
                onClick={() => setSendMethod('secure-link')}
              >
                🔒 Verschlüsselter Link
              </button>
              <button
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: '8px', border: sendMethod === 'pdf-attachment' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  background: sendMethod === 'pdf-attachment' ? '#eff6ff' : '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  color: sendMethod === 'pdf-attachment' ? '#2563eb' : '#64748b', transition: 'all 0.15s',
                }}
                onClick={() => setSendMethod('pdf-attachment')}
              >
                📎 PDF-Anhang
              </button>
            </div>

            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px', lineHeight: '1.4' }}>
              {sendMethod === 'secure-link'
                ? 'Der Empfänger erhält 2 separate Emails: einen Download-Link und ein Passwort.'
                : 'Alle verarbeiteten Dokumente werden als PDF-Anhang per Email gesendet.'}
            </p>

            {/* Recipient selection */}
            {sendMethod === 'secure-link' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
                    border: recipientEmailOption === 'default' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    borderRadius: '10px', cursor: 'pointer', background: recipientEmailOption === 'default' ? '#eff6ff' : '#fff',
                  }}
                  onClick={() => { setRecipientEmailOption('default'); setRecipientEmail(''); }}
                >
                  <input type="radio" name="emailOption" checked={recipientEmailOption === 'default'} readOnly style={{ accentColor: '#2563eb' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Hinterlegte Email</div>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>{kunde.email || 'Keine Email hinterlegt'}</div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
                    border: recipientEmailOption === 'custom' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    borderRadius: '10px', cursor: 'pointer', background: recipientEmailOption === 'custom' ? '#eff6ff' : '#fff',
                  }}
                  onClick={() => setRecipientEmailOption('custom')}
                >
                  <input type="radio" name="emailOption" checked={recipientEmailOption === 'custom'} readOnly style={{ accentColor: '#2563eb' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>Andere Email-Adresse</div>
                    {recipientEmailOption === 'custom' && (
                      <input
                        type="email"
                        placeholder="bankberater@bank.at"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        autoFocus
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                </label>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                    Email-Adresse *
                  </label>
                  <input
                    type="email"
                    placeholder="bankberater@bank.at"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    autoFocus
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                    Name des Empfängers (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Herr Müller, Sparkasse"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowSendModal(false)}
                disabled={sendingDocs}
              >
                Abbrechen
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSendDocuments}
                disabled={
                  sendingDocs ||
                  (sendMethod === 'secure-link' && recipientEmailOption === 'custom' && !recipientEmail.trim()) ||
                  (sendMethod === 'secure-link' && recipientEmailOption === 'default' && !kunde.email) ||
                  (sendMethod === 'pdf-attachment' && !recipientEmail.trim())
                }
              >
                {sendingDocs ? '⏳ Wird gesendet...' : sendMethod === 'secure-link' ? '🔒 Link senden' : '📎 PDFs senden'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signatur-Link Modal */}
      {showSignatureLinkModal && (
        <div className="modal-overlay" onClick={() => setShowSignatureLinkModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '24px' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '18px' }}>🔗 Signatur-Link</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px' }}>
              Senden Sie diesen Link an den Kunden zum digitalen Unterschreiben.
            </p>

            <div style={{
              background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px',
              padding: '12px', marginBottom: '16px', wordBreak: 'break-all', fontSize: '13px',
              fontFamily: 'monospace', color: '#334155',
            }}>
              {signatureLinkUrl}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowSignatureLinkModal(false)}
              >
                Schließen
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  await navigator.clipboard.writeText(signatureLinkUrl);
                  toast.success('Link in Zwischenablage kopiert!');
                }}
              >
                📋 Link kopieren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Tracking Section — collapsible */}
      {emailHistory.length > 0 && (
        <>
          <div
            className="kunde-section-label email-history-toggle"
            onClick={() => setEmailHistoryOpen(prev => !prev)}
            style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span style={{
              display: 'inline-block',
              transition: 'transform 0.2s',
              transform: emailHistoryOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              fontSize: '12px',
            }}>
              ▶
            </span>
            Email-Verlauf ({emailHistory.length})
          </div>
          {emailHistoryOpen && (
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
          )}
        </>
      )}
      {/* Jeffrey Unterlagen-Check Modal */}
      <JeffreyModal
        isOpen={showJeffreyCheck}
        lead={kunde ? {
          id: kunde.id,
          firstName: kunde.firstName,
          lastName: kunde.lastName,
          email: kunde.email,
          phone: kunde.phone,
        } as any : null}
        onClose={() => setShowJeffreyCheck(false)}
      />
    </div>
  );
};
