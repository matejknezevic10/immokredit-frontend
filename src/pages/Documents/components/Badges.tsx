// src/pages/Documents/components/Badges.tsx
import { styles, STATUS_CONFIG, DOC_TYPE_CONFIG } from '../constants';

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{ ...styles.badge, background: config.bg, color: config.color }}>
      {config.icon} {config.label}
    </span>
  );
}

export function DocTypeBadge({ type }: { type: string | null | undefined }) {
  const config = DOC_TYPE_CONFIG[type || 'sonstiges'] || DOC_TYPE_CONFIG.sonstiges;
  return (
    <span style={{ ...styles.badge, background: config.bg, color: config.color }}>
      {config.icon} {config.label}
    </span>
  );
}

export function ConfidenceBadge({ value }: { value: number | null }) {
  const pct = Math.round((value || 0) * 100);
  let bg = '#fef2f2'; let color = '#ef4444';
  if (pct >= 80) { bg = '#ecfdf5'; color = '#10b981'; }
  else if (pct >= 50) { bg = '#fffbeb'; color = '#f59e0b'; }
  return (
    <span style={{ ...styles.confidenceBadge, background: bg, color }}>{pct}%</span>
  );
}
