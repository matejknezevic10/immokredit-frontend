// src/pages/Documents/components/StatCard.tsx
import { styles } from '../constants';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  sub?: string;
  subColor?: string;
}

export function StatCard({ icon, value, label, sub, subColor }: StatCardProps) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
      {sub && <div style={{ ...styles.statSub, color: subColor || '#10b981' }}>{sub}</div>}
    </div>
  );
}
