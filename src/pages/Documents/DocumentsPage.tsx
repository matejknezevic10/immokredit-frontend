import React, { useState, useEffect, useCallback } from 'react';

// ============================================================
// Types
// ============================================================
interface Document {
  id: number;
  customer_id: number | null;
  email_from: string | null;
  email_subject: string | null;
  email_received_at: string | null;
  email_message_id: string | null;
  filename: string;
  file_type: string | null;
  file_size: number | null;
  document_type: string | null;
  ocr_status: string;
  ocr_error: string | null;
  ocr_processed_at: string | null;
  assignment_method: string | null;
  assignment_confidence: number | null;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_email?: string;
  ocr_data?: OcrField[];
  created_at: string;
  updated_at: string;
}

interface OcrField {
  field_name: string;
  field_value: string;
  field_type: string;
  confidence: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Stats {
  total_documents: string;
  completed: string;
  processing: string;
  pending: string;
  failed: string;
  assigned: string;
  unassigned: string;
  gehaltszettel: string;
  kontoauszug: string;
  kaufvertrag: string;
  grundbuchauszug: string;
  sonstiges: string;
}

interface UploadResult {
  id?: number;
  filename: string;
  documentType?: string;
  documentTypeLabel?: string;
  fields?: Record<string, any>;
  confidence?: number;
  error?: string;
}

// ============================================================
// API Configuration
// ============================================================
const API_BASE = import.meta.env.VITE_API_URL || 'https://immokredit-backend-production.up.railway.app';

async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('immokredit_token');
  const res = await fetch(`${API_BASE}/documents${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

async function apiGenericFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('immokredit_token');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

// ============================================================
// Constants & Helpers
// ============================================================
const DOC_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  gehaltszettel: { label: 'Gehaltszettel', icon: '💰', color: '#10b981', bg: '#ecfdf5' },
  kontoauszug: { label: 'Kontoauszug', icon: '🏦', color: '#3b82f6', bg: '#eff6ff' },
  kaufvertrag: { label: 'Kaufvertrag', icon: '📋', color: '#8b5cf6', bg: '#f5f3ff' },
  grundbuchauszug: { label: 'Grundbuch', icon: '📜', color: '#f59e0b', bg: '#fffbeb' },
  sonstiges: { label: 'Sonstiges', icon: '📄', color: '#6b7280', bg: '#f9fafb' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  completed: { label: 'Abgeschlossen', color: '#10b981', bg: '#ecfdf5', icon: '✅' },
  processing: { label: 'Verarbeitung...', color: '#3b82f6', bg: '#eff6ff', icon: '⏳' },
  pending: { label: 'Wartend', color: '#f59e0b', bg: '#fffbeb', icon: '🔄' },
  failed: { label: 'Fehler', color: '#ef4444', bg: '#fef2f2', icon: '❌' },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('de-AT', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================
// Styles (matching ImmoKredit design system)
// ============================================================
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '32px 40px',
    maxWidth: '1400px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: '0 0 4px 0',
    fontFamily: 'inherit',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 24px 0',
  },
  // Top action bar
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: '#1a3a5c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'white',
    color: '#374151',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  // Stat cards (same as Dashboard)
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '28px',
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px 24px',
    border: '1px solid #e5e7eb',
    transition: 'box-shadow 0.2s',
  },
  statIcon: {
    fontSize: '24px',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: '0',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '4px',
  },
  statSub: {
    fontSize: '12px',
    marginTop: '6px',
    fontWeight: '500',
  },
  // Filter bar
  filterBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterChip: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    border: '1px solid #e5e7eb',
    background: 'white',
    color: '#6b7280',
    transition: 'all 0.2s',
  },
  filterChipActive: {
    background: '#1a3a5c',
    color: 'white',
    border: '1px solid #1a3a5c',
  },
  searchInput: {
    padding: '8px 14px 8px 36px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '13px',
    width: '260px',
    outline: 'none',
    background: 'white',
  },
  // Table (same style as Leads page)
  tableWrapper: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #e5e7eb',
    background: '#fafafa',
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#374151',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'middle',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  // Badges & Tags
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  confidenceBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '42px',
    height: '24px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
  },
  // Modal / Detail view
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: '60px',
    zIndex: 1000,
    overflowY: 'auto',
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    width: '720px',
    maxWidth: '95vw',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
  },
  modalHeader: {
    padding: '24px 28px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalBody: {
    padding: '24px 28px',
  },
  modalSection: {
    marginBottom: '24px',
  },
  modalSectionTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
  },
  fieldRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '4px',
    background: '#f9fafb',
  },
  fieldLabel: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: '14px',
    color: '#1a1a2e',
    fontWeight: '600',
  },
  // Upload area
  uploadArea: {
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: '#fafafa',
  },
  uploadAreaActive: {
    border: '2px dashed #1a3a5c',
    background: '#f0f4f8',
  },
  // Empty state
  emptyState: {
    padding: '80px 40px',
    textAlign: 'center',
  },
  // Pagination
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderTop: '1px solid #e5e7eb',
  },
};

// ============================================================
// Sub-Components
// ============================================================

function StatCard({ icon, value, label, sub, subColor }: { icon: string; value: string | number; label: string; sub?: string; subColor?: string }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
      {sub && <div style={{ ...styles.statSub, color: subColor || '#10b981' }}>{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{ ...styles.badge, background: config.bg, color: config.color }}>
      {config.icon} {config.label}
    </span>
  );
}

function DocTypeBadge({ type }: { type: string | null | undefined }) {
  const config = DOC_TYPE_CONFIG[type || 'sonstiges'] || DOC_TYPE_CONFIG.sonstiges;
  return (
    <span style={{ ...styles.badge, background: config.bg, color: config.color }}>
      {config.icon} {config.label}
    </span>
  );
}

function ConfidenceBadge({ value }: { value: number | null }) {
  const pct = Math.round((value || 0) * 100);
  let bg = '#fef2f2'; let color = '#ef4444';
  if (pct >= 80) { bg = '#ecfdf5'; color = '#10b981'; }
  else if (pct >= 50) { bg = '#fffbeb'; color = '#f59e0b'; }
  return (
    <span style={{ ...styles.confidenceBadge, background: bg, color }}>{pct}%</span>
  );
}

// ============================================================
// Upload Modal
// ============================================================
function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded?: () => void }) {
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
      alert('Upload fehlgeschlagen: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
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

// ============================================================
// Document Detail Modal
// ============================================================
function DocumentDetailModal({ document: doc, onClose }: { document: Document | null; onClose: () => void; onAssign?: (doc: Document) => void }) {
  const [ocrData, setOcrData] = useState<OcrField[]>([]);
  const [editedData, setEditedData] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Assignment state
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');
  const [assignedCustomer, setAssignedCustomer] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!doc) return;
    setLoading(true);
    setIsEditing(false);
    setEditedData({});
    setShowAssignDropdown(false);
    setAssignedCustomer(
      doc.customer_id
        ? { id: String(doc.customer_id), name: `${doc.customer_first_name || ''} ${doc.customer_last_name || ''}`.trim() }
        : null
    );
    apiFetch(`/${doc.id}`)
      .then(data => {
        const fields = data.ocr_results || [];
        setOcrData(fields);
        const initial: Record<string, string> = {};
        fields.forEach((f: OcrField) => { initial[f.field_name] = f.field_value || ''; });
        setEditedData(initial);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [doc]);

  const loadLeads = async () => {
    setLeadsLoading(true);
    try {
      const data = await apiGenericFetch('/leads');
      setLeads(data.leads || data || []);
    } catch (err) {
      console.error('Failed to load leads:', err);
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  };

  const handleAssign = async (leadId: string, leadName: string) => {
    if (!doc) return;
    try {
      await apiFetch(`/${doc.id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ customer_id: leadId }),
      });
      setAssignedCustomer({ id: leadId, name: leadName });
      setShowAssignDropdown(false);
    } catch (err) {
      console.error('Assignment failed:', err);
    }
  };

  const handleSave = async () => {
    if (!doc) return;
    setIsSaving(true);
    try {
      // Build extractedData in the format the DB expects
      const extractedData: Record<string, any> = {};
      ocrData.forEach((field) => {
        const newValue = editedData[field.field_name];
        extractedData[field.field_name] = {
          value: newValue || null,
          confidence: newValue !== field.field_value ? 1.0 : field.confidence,
        };
      });
      await apiFetch(`/${doc.id}/extracted-data`, {
        method: 'PATCH',
        body: JSON.stringify({ extractedData }),
      });
      // Update local state
      setOcrData(ocrData.map((f) => ({
        ...f,
        field_value: editedData[f.field_name] || '',
        confidence: editedData[f.field_name] !== f.field_value ? 1.0 : f.confidence,
      })));
      setIsEditing(false);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!doc) return null;

  const typeConfig = DOC_TYPE_CONFIG[doc.document_type || 'sonstiges'] || DOC_TYPE_CONFIG.sonstiges;

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '24px' }}>{typeConfig.icon}</span>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#1a1a2e' }}>{doc.filename}</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <DocTypeBadge type={doc.document_type} />
              <StatusBadge status={doc.ocr_status} />
            </div>
          </div>
          <button onClick={onClose} style={{ ...styles.secondaryButton, padding: '6px 12px' }}>✕</button>
        </div>

        <div style={styles.modalBody}>
          {/* Email Info */}
          {doc.email_from && (
            <div style={styles.modalSection}>
              <div style={styles.modalSectionTitle}>📨 Email-Informationen</div>
              <div style={styles.fieldRow}>
                <span style={styles.fieldLabel}>Von</span>
                <span style={styles.fieldValue}>{doc.email_from}</span>
              </div>
              <div style={styles.fieldRow}>
                <span style={styles.fieldLabel}>Betreff</span>
                <span style={styles.fieldValue}>{doc.email_subject || '—'}</span>
              </div>
              <div style={styles.fieldRow}>
                <span style={styles.fieldLabel}>Empfangen</span>
                <span style={styles.fieldValue}>{formatDate(doc.email_received_at)}</span>
              </div>
            </div>
          )}

          {/* Customer Assignment */}
          <div style={styles.modalSection}>
            <div style={styles.modalSectionTitle}>👤 Kundenzuordnung</div>
            {assignedCustomer ? (
              <div style={styles.fieldRow}>
                <span style={styles.fieldLabel}>Zugeordnet an</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={styles.fieldValue}>{assignedCustomer.name}</span>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>✓ Zugeordnet</span>
                  <button
                    onClick={() => {
                      setShowAssignDropdown(true);
                      if (leads.length === 0) loadLeads();
                    }}
                    style={{ ...styles.secondaryButton, fontSize: '11px', padding: '2px 8px' }}
                  >
                    Ändern
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ ...styles.fieldRow, background: '#fffbeb' }}>
                <span style={{ ...styles.fieldLabel, color: '#f59e0b' }}>⚠️ Nicht zugeordnet</span>
                <button
                  onClick={() => {
                    setShowAssignDropdown(true);
                    if (leads.length === 0) loadLeads();
                  }}
                  style={{ ...styles.secondaryButton, fontSize: '12px', padding: '4px 12px' }}
                >
                  Manuell zuordnen
                </button>
              </div>
            )}

            {/* Assign Dropdown */}
            {showAssignDropdown && (
              <div style={{
                marginTop: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                background: '#f8fafc',
              }}>
                <input
                  type="text"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder="Kunde suchen..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'Outfit, sans-serif',
                    marginBottom: '8px',
                    boxSizing: 'border-box' as const,
                  }}
                  autoFocus
                />
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {leadsLoading ? (
                    <div style={{ textAlign: 'center', padding: '12px', color: '#9ca3af', fontSize: '13px' }}>
                      Lade Kunden...
                    </div>
                  ) : leads.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '12px', color: '#9ca3af', fontSize: '13px' }}>
                      Keine Kunden gefunden
                    </div>
                  ) : (
                    leads
                      .filter((l: any) => {
                        if (!assignSearch) return true;
                        const term = assignSearch.toLowerCase();
                        const name = `${l.firstName || ''} ${l.lastName || ''}`.toLowerCase();
                        const email = (l.email || '').toLowerCase();
                        return name.includes(term) || email.includes(term);
                      })
                      .map((lead: any) => (
                        <button
                          key={lead.id}
                          onClick={() => handleAssign(lead.id, `${lead.firstName} ${lead.lastName}`)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            padding: '8px 10px',
                            border: 'none',
                            background: assignedCustomer?.id === lead.id ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontFamily: 'Outfit, sans-serif',
                            textAlign: 'left' as const,
                            transition: 'background 0.15s',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.background = '#e2e8f0')}
                          onMouseOut={(e) => (e.currentTarget.style.background = assignedCustomer?.id === lead.id ? 'rgba(37, 99, 235, 0.08)' : 'transparent')}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>
                              {lead.firstName} {lead.lastName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                              {lead.email || 'Keine Email'}
                            </div>
                          </div>
                          {assignedCustomer?.id === lead.id && (
                            <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                          )}
                        </button>
                      ))
                  )}
                </div>
                <button
                  onClick={() => setShowAssignDropdown(false)}
                  style={{ ...styles.secondaryButton, width: '100%', marginTop: '8px', fontSize: '12px', padding: '6px' }}
                >
                  Abbrechen
                </button>
              </div>
            )}
          </div>

          {/* OCR Results */}
          <div style={styles.modalSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={styles.modalSectionTitle}>🔍 Extrahierte Daten (OCR)</div>
              {ocrData.length > 0 && !loading && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{ ...styles.primaryButton, fontSize: '12px', padding: '4px 14px' }}
                      >
                        {isSaving ? '⏳ Speichern...' : '💾 Speichern'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          const initial: Record<string, string> = {};
                          ocrData.forEach((f) => { initial[f.field_name] = f.field_value || ''; });
                          setEditedData(initial);
                        }}
                        style={{ ...styles.secondaryButton, fontSize: '12px', padding: '4px 12px' }}
                      >
                        Abbrechen
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{ ...styles.secondaryButton, fontSize: '12px', padding: '4px 12px' }}
                    >
                      ✏️ Bearbeiten
                    </button>
                  )}
                </div>
              )}
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>Laden...</div>
            ) : ocrData.length > 0 ? (
              ocrData.map((field, i) => (
                <div key={i} style={styles.fieldRow}>
                  <span style={styles.fieldLabel}>{field.field_name.replace(/_/g, ' ')}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData[field.field_name] || ''}
                        onChange={(e) => setEditedData({ ...editedData, [field.field_name]: e.target.value })}
                        style={{
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          width: '200px',
                          textAlign: 'right',
                          fontFamily: 'Outfit, sans-serif',
                        }}
                      />
                    ) : (
                      <span style={styles.fieldValue}>
                        {field.field_type === 'currency' && field.field_value
                          ? `${Number(field.field_value).toLocaleString('de-AT')} €`
                          : field.field_value || '—'}
                      </span>
                    )}
                    <ConfidenceBadge value={field.confidence} />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                Keine OCR-Daten verfügbar
              </div>
            )}
          </div>

          {/* File Info */}
          <div style={styles.modalSection}>
            <div style={styles.modalSectionTitle}>📁 Datei-Informationen</div>
            <div style={styles.fieldRow}>
              <span style={styles.fieldLabel}>Dateityp</span>
              <span style={styles.fieldValue}>{doc.file_type || '—'}</span>
            </div>
            <div style={styles.fieldRow}>
              <span style={styles.fieldLabel}>Größe</span>
              <span style={styles.fieldValue}>{formatFileSize(doc.file_size)}</span>
            </div>
            <div style={styles.fieldRow}>
              <span style={styles.fieldLabel}>Verarbeitet am</span>
              <span style={styles.fieldValue}>{formatDate(doc.ocr_processed_at)}</span>
            </div>
            {doc.ocr_error && (
              <div style={{ ...styles.fieldRow, background: '#fef2f2' }}>
                <span style={{ ...styles.fieldLabel, color: '#ef4444' }}>Fehler</span>
                <span style={{ fontSize: '13px', color: '#ef4444' }}>{doc.ocr_error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Documents Page Component
// ============================================================
export default function DocumentsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 15, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await apiFetch('/stats');
      setStats(data.documents);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  // Fetch documents
  const fetchDocuments = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pagination.limit) });
      if (filter === 'unassigned') params.append('unassigned', 'true');
      else if (filter !== 'all') params.append('status', filter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const data = await apiFetch(`?${params}`);
      setDocuments(data.documents || []);
      setPagination(data.pagination || { page: 1, limit: 15, total: 0, pages: 0 });
    } catch (err) {
      console.error('Failed to load documents:', err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [filter, typeFilter, pagination.limit]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchDocuments(1); }, [filter, typeFilter]); // eslint-disable-line

  const refreshAll = () => {
    fetchStats();
    fetchDocuments(pagination.page);
  };

  // Filter documents by search term (client-side)
  const filteredDocs = documents.filter(d => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (d.filename || '').toLowerCase().includes(term) ||
      (d.email_from || '').toLowerCase().includes(term) ||
      (d.email_subject || '').toLowerCase().includes(term) ||
      (d.customer_first_name || '').toLowerCase().includes(term) ||
      (d.customer_last_name || '').toLowerCase().includes(term)
    );
  });

  return (
    <div style={styles.container} className="documents-page">
      {/* Page Header */}
      <h1 style={styles.pageTitle}>Dokumente</h1>
      <p style={styles.pageSubtitle}>
        Email-OCR Verarbeitung · Automatische Dokumentenerkennung & Kundenzuordnung
      </p>

      {/* Action Bar */}
      <div style={styles.actionBar} className="docs-action-bar">
        <button style={styles.primaryButton} onClick={() => setShowUpload(true)}>
          <span>📤</span> Dokumente hochladen
        </button>
        <button style={styles.secondaryButton} onClick={refreshAll}>
          🔄 Aktualisieren
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={styles.statsRow} className="docs-stats-row">
          <StatCard
            icon="📄"
            value={stats.total_documents || 0}
            label="Dokumente Gesamt"
            sub={`${stats.completed || 0} verarbeitet`}
            subColor="#10b981"
          />
          <StatCard
            icon="✅"
            value={stats.assigned || 0}
            label="Zugeordnet"
            sub={Number(stats.unassigned) > 0 ? `${stats.unassigned} offen` : 'Alle zugeordnet'}
            subColor={Number(stats.unassigned) > 0 ? '#f59e0b' : '#10b981'}
          />
          <StatCard
            icon="⏳"
            value={(parseInt(stats.processing || '0') + parseInt(stats.pending || '0'))}
            label="In Verarbeitung"
            sub={Number(stats.failed) > 0 ? `${stats.failed} fehlgeschlagen` : ''}
            subColor="#ef4444"
          />
          <StatCard
            icon="💰"
            value={stats.gehaltszettel || 0}
            label="Gehaltszettel"
          />
          <StatCard
            icon="🏦"
            value={stats.kontoauszug || 0}
            label="Kontoauszüge"
          />
        </div>
      )}

      {/* Filters */}
      <div style={styles.filterBar} className="docs-filter-bar">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>🔍</span>
          <input
            style={styles.searchInput}
            placeholder="Suchen nach Name, Email, Datei..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ width: '1px', height: '28px', background: '#e5e7eb' }} />
        {[
          { key: 'all', label: 'Alle' },
          { key: 'completed', label: '✅ Abgeschlossen' },
          { key: 'processing', label: '⏳ In Verarbeitung' },
          { key: 'failed', label: '❌ Fehler' },
          { key: 'unassigned', label: '⚠️ Nicht zugeordnet' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={filter === f.key ? { ...styles.filterChip, ...styles.filterChipActive } : styles.filterChip}
          >
            {f.label}
          </button>
        ))}
        <div style={{ width: '1px', height: '28px', background: '#e5e7eb' }} />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ ...styles.filterChip, cursor: 'pointer', appearance: 'auto' }}
        >
          <option value="all">Alle Typen</option>
          <option value="gehaltszettel">💰 Gehaltszettel</option>
          <option value="kontoauszug">🏦 Kontoauszug</option>
          <option value="kaufvertrag">📋 Kaufvertrag</option>
          <option value="grundbuchauszug">📜 Grundbuch</option>
          <option value="sonstiges">📄 Sonstiges</option>
        </select>
      </div>

      {/* Documents Table */}
      <div style={styles.tableWrapper} className="docs-table-wrapper">
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Dokument</th>
              <th style={styles.th}>Typ</th>
              <th style={styles.th}>Kunde</th>
              <th style={styles.th}>Email Von</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Konfidenz</th>
              <th style={styles.th}>Datum</th>
              <th style={styles.th}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ ...styles.td, textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                  Dokumente werden geladen...
                </td>
              </tr>
            ) : filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ ...styles.td, textAlign: 'center', padding: '60px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                    Keine Dokumente gefunden
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>
                    {filter !== 'all' || typeFilter !== 'all'
                      ? 'Versuche andere Filter oder lade Dokumente hoch'
                      : 'Sende Emails mit Anhängen oder lade Dokumente manuell hoch'}
                  </div>
                  <button style={styles.primaryButton} onClick={() => setShowUpload(true)}>
                    📤 Erstes Dokument hochladen
                  </button>
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr
                  key={doc.id}
                  style={{
                    ...styles.tr,
                    background: hoveredRow === doc.id ? '#f9fafb' : 'transparent',
                  }}
                  onMouseEnter={() => setHoveredRow(doc.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => setSelectedDoc(doc)}
                >
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>
                        {doc.file_type === 'application/pdf' ? '📕' : '🖼️'}
                      </span>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '14px' }}>
                          {doc.filename?.length > 30 ? doc.filename.substring(0, 30) + '...' : doc.filename}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {formatFileSize(doc.file_size)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <DocTypeBadge type={doc.document_type} />
                  </td>
                  <td style={styles.td}>
                    {doc.customer_id ? (
                      <div>
                        <div style={{ fontWeight: '500', color: '#1a1a2e' }}>
                          {doc.customer_first_name} {doc.customer_last_name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{doc.customer_email}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#f59e0b', fontSize: '13px' }}>⚠️ Nicht zugeordnet</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      {doc.email_from || '— Manuell hochgeladen'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <StatusBadge status={doc.ocr_status} />
                  </td>
                  <td style={styles.td}>
                    {(doc.assignment_confidence ?? 0) > 0 ? (
                      <ConfidenceBadge value={doc.assignment_confidence} />
                    ) : (
                      <span style={{ color: '#d1d5db' }}>—</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      {formatDate(doc.created_at)}
                    </span>
                  </td>
                  <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        style={{ ...styles.secondaryButton, padding: '4px 10px', fontSize: '12px' }}
                        title="Details anzeigen"
                      >
                        🔍
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={styles.pagination}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              {pagination.total} Dokumente · Seite {pagination.page} von {pagination.pages}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => fetchDocuments(pagination.page - 1)}
                disabled={pagination.page <= 1}
                style={{ ...styles.secondaryButton, opacity: pagination.page <= 1 ? 0.4 : 1 }}
              >
                ← Zurück
              </button>
              <button
                onClick={() => fetchDocuments(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                style={{ ...styles.secondaryButton, opacity: pagination.page >= pagination.pages ? 0.4 : 1 }}
              >
                Weiter →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={refreshAll}
        />
      )}
      {selectedDoc && (
        <DocumentDetailModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}