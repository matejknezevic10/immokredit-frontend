// src/pages/Documents/components/UploadModal.tsx
import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { UploadResult } from '../types';
import { API_BASE } from '../api';
import { styles, formatFileSize } from '../constants';
import { DocTypeBadge } from './Badges';

interface UploadModalProps {
  onClose: () => void;
  onUploaded?: () => void;
}

export function UploadModal({ onClose, onUploaded }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [customerId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [results, setResults] = useState<UploadResult[] | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      f.type === 'application/pdf' || f.type.startsWith('image/')
    );
    setFiles(prev => [...prev, ...dropped]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selected]);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      if (customerId) formData.append('customer_id', customerId);

      const token = localStorage.getItem('immokredit_token');
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      setResults(data.documents);
      if (onUploaded) onUploaded();
    } catch (err) {
      toast.error('Upload fehlgeschlagen: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#1a1a2e' }}>📤 Dokumente hochladen</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
              PDF oder Bilder hochladen für automatische OCR-Verarbeitung
            </p>
          </div>
          <button onClick={onClose} style={{ ...styles.secondaryButton, padding: '6px 12px' }}>✕</button>
        </div>
        <div style={styles.modalBody}>
          {!results ? (
            <>
              <div
                style={dragActive ? { ...styles.uploadArea, ...styles.uploadAreaActive } : styles.uploadArea}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📎</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  Dateien hierher ziehen
                </div>
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                  oder klicken zum Auswählen · PDF, JPG, PNG
                </div>
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  style={{ display: 'none' }}
                  onChange={handleFileInput}
                />
              </div>

              {files.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ ...styles.fieldRow, justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e' }}>{f.name}</span>
                        <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>
                          {formatFileSize(f.size)}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, idx) => idx !== i)); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '16px' }}
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={onClose} style={styles.secondaryButton}>Abbrechen</button>
                <button
                  onClick={handleUpload}
                  disabled={files.length === 0 || uploading}
                  style={{
                    ...styles.primaryButton,
                    opacity: files.length === 0 || uploading ? 0.5 : 1,
                  }}
                >
                  {uploading ? '⏳ Verarbeitung läuft...' : `📤 ${files.length} Datei(en) hochladen`}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a2e', marginBottom: '12px' }}>
                  ✅ Verarbeitung abgeschlossen
                </div>
                {results.map((r, i) => (
                  <div key={i} style={{ ...styles.fieldRow, flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', color: '#1a1a2e' }}>{r.filename}</span>
                      {r.error ? (
                        <span style={{ ...styles.badge, background: '#fef2f2', color: '#ef4444' }}>❌ Fehler</span>
                      ) : (
                        <DocTypeBadge type={r.documentType} />
                      )}
                    </div>
                    {r.error && (
                      <span style={{ fontSize: '12px', color: '#ef4444' }}>{r.error}</span>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={onClose} style={styles.primaryButton}>Schließen</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
