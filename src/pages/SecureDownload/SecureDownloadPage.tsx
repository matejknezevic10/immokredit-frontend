// src/pages/SecureDownload/SecureDownloadPage.tsx
//
// Public page for password-protected document download.
// URL: /secure-download/:accessToken
//
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import './SecureDownloadPage.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface DocEntry {
  id: string;
  originalFilename: string;
  type: string;
  mimeType: string;
  size: number;
  googleDriveUrl: string | null;
}

export const SecureDownloadPage: React.FC = () => {
  const { accessToken } = useParams<{ accessToken: string }>();
  const [password, setPassword] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [validated, setValidated] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [documents, setDocuments] = useState<DocEntry[]>([]);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || !accessToken) return;

    setValidating(true);
    setError('');

    try {
      // Validate password
      const valRes = await fetch(`${API_BASE}/secure-link/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, password: password.toUpperCase() }),
      });
      const valData = await valRes.json();

      if (!valData.valid) {
        setError(valData.error || 'Zugang verweigert');
        return;
      }

      setLeadName(valData.leadName);

      // Load documents (POST with password verification)
      const docsRes = await fetch(`${API_BASE}/secure-link/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, password: password.toUpperCase() }),
      });
      const docsData = await docsRes.json();
      setDocuments(docsData);
      setValidated(true);
    } catch (err) {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setValidating(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownloadAll = async () => {
    if (documents.length === 0 || !accessToken) return;
    setDownloadingAll(true);
    try {
      for (const doc of documents) {
        const url = `${API_BASE}/secure-link/download/${doc.id}?accessToken=${accessToken}&password=${encodeURIComponent(password.toUpperCase())}`;
        const response = await fetch(url);
        if (!response.ok) continue;
        const blob = await response.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = doc.originalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        // Small delay between downloads so browser doesn't block them
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (err) {
      console.error('Download all failed:', err);
    } finally {
      setDownloadingAll(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      AUSWEIS: 'Ausweis',
      REISEPASS: 'Reisepass',
      MELDEZETTEL: 'Meldezettel',
      GEHALTSABRECHNUNG: 'Lohnzettel',
      STEUERBESCHEID: 'Steuerbescheid',
      ARBEITSVERTRAG: 'Arbeitsvertrag',
      GRUNDBUCHAUSZUG: 'Grundbuch',
      ENERGIEAUSWEIS: 'Energieausweis',
      KAUFVERTRAG: 'Kaufvertrag',
      EXPOSE: 'Expose',
      KONTOAUSZUG: 'Kontoauszug',
      SONSTIGES: 'Sonstige',
    };
    return map[type] || type;
  };

  return (
    <div className="secure-download-page">
      <div className="secure-download-card">
        <div className="secure-download-logo">
          <div className="secure-download-logo-icon">🔒</div>
          <h1>ImmoKredit</h1>
          <p>Sicherer Dokumenten-Download</p>
        </div>

        {!validated ? (
          <form onSubmit={handleValidate} className="secure-download-form">
            <p className="secure-download-instructions">
              Bitte geben Sie das Passwort ein, das Sie per E-Mail erhalten haben:
            </p>

            <input
              type="text"
              className="secure-download-input"
              value={password}
              onChange={(e) => setPassword(e.target.value.toUpperCase())}
              placeholder="PASSWORT"
              maxLength={6}
              autoFocus
              autoComplete="off"
              style={{ letterSpacing: '6px', textAlign: 'center', fontFamily: 'monospace', fontSize: '24px' }}
            />

            {error && <div className="secure-download-error">{error}</div>}

            <button
              type="submit"
              className="secure-download-btn"
              disabled={validating || password.length < 6}
            >
              {validating ? 'Wird geprüft...' : 'Zugang erhalten'}
            </button>
          </form>
        ) : (
          <div className="secure-download-docs">
            <p className="secure-download-greeting">
              Hallo {leadName}, hier sind Ihre Dokumente:
            </p>

            {documents.length > 1 && (
              <button
                className="secure-download-all-btn"
                onClick={handleDownloadAll}
                disabled={downloadingAll}
                style={{
                  width: '100%',
                  padding: '14px',
                  marginBottom: '16px',
                  background: downloadingAll ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: downloadingAll ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {downloadingAll ? '⏳ Wird heruntergeladen...' : `📥 Alle ${documents.length} Dokumente herunterladen`}
              </button>
            )}

            <div className="secure-download-list">
              {documents.map(doc => (
                <div key={doc.id} className="secure-download-item">
                  <div className="secure-download-item-info">
                    <span className="secure-download-item-type">{getTypeLabel(doc.type)}</span>
                    <span className="secure-download-item-name">{doc.originalFilename}</span>
                    <span className="secure-download-item-size">{formatFileSize(doc.size)}</span>
                  </div>
                  <a
                    href={`${API_BASE}/secure-link/download/${doc.id}?accessToken=${accessToken}&password=${encodeURIComponent(password.toUpperCase())}`}
                    className="secure-download-item-btn"
                    download={doc.originalFilename}
                  >
                    Herunterladen
                  </a>
                </div>
              ))}
            </div>

            <p className="secure-download-footer">
              Bei Fragen kontaktieren Sie uns: info@immo-kredit.net
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
