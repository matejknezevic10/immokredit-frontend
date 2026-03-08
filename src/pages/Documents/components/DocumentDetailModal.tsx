// src/pages/Documents/components/DocumentDetailModal.tsx
import { useState, useEffect } from 'react';
import { Document, OcrField } from '../types';
import { apiFetch, apiGenericFetch } from '../api';
import { styles, DOC_TYPE_CONFIG, formatDate, formatFileSize } from '../constants';
import { StatusBadge, DocTypeBadge, ConfidenceBadge } from './Badges';

interface DocumentDetailModalProps {
  document: Document | null;
  onClose: () => void;
}

export function DocumentDetailModal({ document: doc, onClose }: DocumentDetailModalProps) {
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
                <span style={styles.fieldValue}>{doc.email_subject || '\u2014'}</span>
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
                marginTop: '8px', border: '1px solid #e2e8f0',
                borderRadius: '8px', padding: '12px', background: '#f8fafc',
              }}>
                <input
                  type="text"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder="Kunde suchen..."
                  style={{
                    width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '13px', fontFamily: 'Outfit, sans-serif',
                    marginBottom: '8px', boxSizing: 'border-box' as const,
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
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            width: '100%', padding: '8px 10px', border: 'none',
                            background: assignedCustomer?.id === lead.id ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                            borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
                            fontFamily: 'Outfit, sans-serif', textAlign: 'left' as const,
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
                          border: '1px solid #d1d5db', borderRadius: '6px', padding: '4px 8px',
                          fontSize: '13px', fontWeight: 600, width: '200px', textAlign: 'right',
                          fontFamily: 'Outfit, sans-serif',
                        }}
                      />
                    ) : (
                      <span style={styles.fieldValue}>
                        {field.field_type === 'currency' && field.field_value
                          ? `${Number(field.field_value).toLocaleString('de-AT')} €`
                          : field.field_value || '\u2014'}
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
              <span style={styles.fieldValue}>{doc.file_type || '\u2014'}</span>
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
