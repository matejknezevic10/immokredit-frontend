// src/components/Dashboard/StatsCard.tsx
import React from 'react';
import './StatsCard.css';

interface StatsCardProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  value: number | string;
  label: string;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  iconBg,
  iconColor,
  value,
  label,
  trend,
}) => {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>
          {icon}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {trend && (
        <div className={`stat-trend ${trend.direction}`}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
        </div>
      )}
    </div>
  );
};
