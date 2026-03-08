// src/pages/Documents/constants.ts
import React from 'react';

export const DOC_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  gehaltszettel: { label: 'Gehaltszettel', icon: '\u{1F4B0}', color: '#10b981', bg: '#ecfdf5' },
  kontoauszug: { label: 'Kontoauszug', icon: '\u{1F3E6}', color: '#3b82f6', bg: '#eff6ff' },
  kaufvertrag: { label: 'Kaufvertrag', icon: '\u{1F4CB}', color: '#8b5cf6', bg: '#f5f3ff' },
  grundbuchauszug: { label: 'Grundbuch', icon: '\u{1F4DC}', color: '#f59e0b', bg: '#fffbeb' },
  sonstiges: { label: 'Sonstiges', icon: '\u{1F4C4}', color: '#6b7280', bg: '#f9fafb' },
};

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  completed: { label: 'Abgeschlossen', color: '#10b981', bg: '#ecfdf5', icon: '\u2705' },
  processing: { label: 'Verarbeitung...', color: '#3b82f6', bg: '#eff6ff', icon: '\u231B' },
  pending: { label: 'Wartend', color: '#f59e0b', bg: '#fffbeb', icon: '\u{1F504}' },
  failed: { label: 'Fehler', color: '#ef4444', bg: '#fef2f2', icon: '\u274C' },
};

export function formatDate(dateStr: string | null) {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('de-AT', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function formatFileSize(bytes: number | null) {
  if (!bytes) return '\u2014';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const styles: Record<string, React.CSSProperties> = {
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
  statIcon: { fontSize: '24px', marginBottom: '8px' },
  statValue: { fontSize: '28px', fontWeight: '700', color: '#1a1a2e', margin: '0' },
  statLabel: {
    fontSize: '11px', fontWeight: '600', color: '#9ca3af',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px',
  },
  statSub: { fontSize: '12px', marginTop: '6px', fontWeight: '500' },
  filterBar: {
    display: 'flex', gap: '10px', marginBottom: '20px',
    flexWrap: 'wrap', alignItems: 'center',
  },
  filterChip: {
    padding: '6px 14px', borderRadius: '20px', fontSize: '13px',
    fontWeight: '500', cursor: 'pointer', border: '1px solid #e5e7eb',
    background: 'white', color: '#6b7280', transition: 'all 0.2s',
  },
  filterChipActive: { background: '#1a3a5c', color: 'white', border: '1px solid #1a3a5c' },
  searchInput: {
    padding: '8px 14px 8px 36px', borderRadius: '8px',
    border: '1px solid #e5e7eb', fontSize: '13px',
    width: '260px', outline: 'none', background: 'white',
  },
  tableWrapper: {
    background: 'white', borderRadius: '12px',
    border: '1px solid #e5e7eb', overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '14px 16px', textAlign: 'left', fontSize: '11px',
    fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase',
    letterSpacing: '0.5px', borderBottom: '1px solid #e5e7eb', background: '#fafafa',
  },
  td: {
    padding: '14px 16px', fontSize: '14px', color: '#374151',
    borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle',
  },
  tr: { cursor: 'pointer', transition: 'background 0.15s' },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
  },
  confidenceBadge: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '42px', height: '24px', borderRadius: '12px',
    fontSize: '11px', fontWeight: '700',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    paddingTop: '60px', zIndex: 1000, overflowY: 'auto',
  },
  modal: {
    background: 'white', borderRadius: '16px', width: '720px',
    maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto',
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
  },
  modalHeader: {
    padding: '24px 28px', borderBottom: '1px solid #e5e7eb',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  modalBody: { padding: '24px 28px' },
  modalSection: { marginBottom: '24px' },
  modalSectionTitle: {
    fontSize: '13px', fontWeight: '600', color: '#9ca3af',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px',
  },
  fieldRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px', borderRadius: '8px', marginBottom: '4px', background: '#f9fafb',
  },
  fieldLabel: { fontSize: '13px', color: '#6b7280', fontWeight: '500' },
  fieldValue: { fontSize: '14px', color: '#1a1a2e', fontWeight: '600' },
  uploadArea: {
    border: '2px dashed #d1d5db', borderRadius: '12px', padding: '40px',
    textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: '#fafafa',
  },
  uploadAreaActive: { border: '2px dashed #1a3a5c', background: '#f0f4f8' },
  emptyState: { padding: '80px 40px', textAlign: 'center' },
  pagination: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', borderTop: '1px solid #e5e7eb',
  },
};
