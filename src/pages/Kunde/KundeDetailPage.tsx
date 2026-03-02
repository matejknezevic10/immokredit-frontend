// src/pages/Kunde/KundeDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
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

interface OcrResult {
  documentId: string;
  filename: string;
  documentType: string;
  fieldsExtracted: number;
}

const tiles = [
  { key: 'person', label: 'Person', icon: '👤', path: 'person' },
  { key: 'haushalt', label: 'Haushalt', icon: '🏠', path: 'haushalt' },
  { key: 'finanzplan', label: 'Finanzplan', icon: '📊', path: 'finanzplan' },
  { key: 'objekt', label: 'Objekt', icon: '🏡', path: 'objekt' },
];

export const KundeDetailPage: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [kunde, setKunde] = useState<KundeOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [ocrResults, setOcrResults] = useState<OcrResult[] | null>(null);
  const [ocrError, setOcrError] = useState('');

  useEffect(() => {
    if (leadId) loadKunde();
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

  const runJeffreyOCR = async () => {
    if (!leadId) return;
    setAnalyzing(true);
    setOcrResults(null);
    setOcrError('');
    try {
      const res = await api.post(`/jeffrey-ocr/ocr-all/${leadId}`);
      setOcrResults(res.data.results);
      // Reload customer data to show updated fields
      await loadKunde();
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
    // Count non-null, non-empty fields (excluding id, leadId, createdAt, updatedAt)
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
    </div>
  );
};