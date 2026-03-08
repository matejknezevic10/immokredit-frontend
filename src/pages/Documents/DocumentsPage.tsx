// src/pages/Documents/DocumentsPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { Document, Pagination, Stats } from './types';
import { apiFetch } from './api';
import { styles, formatDate, formatFileSize } from './constants';
import { StatCard } from './components/StatCard';
import { StatusBadge, DocTypeBadge, ConfidenceBadge } from './components/Badges';
import { UploadModal } from './components/UploadModal';
import { DocumentDetailModal } from './components/DocumentDetailModal';

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
