// src/components/Pipeline/DealCard.tsx
import React from 'react';
import { Deal, AmpelStatus, Temperatur } from '@/types';
import './DealCard.css';

interface DealCardProps {
  deal: Deal;
  onClick?: () => void;
}

const ampelConfig = {
  [AmpelStatus.GREEN]: { emoji: '🟢', label: 'Grün', class: 'badge-green' },
  [AmpelStatus.YELLOW]: { emoji: '🟡', label: 'Gelb', class: 'badge-yellow' },
  [AmpelStatus.RED]: { emoji: '🔴', label: 'Rot', class: 'badge-red' },
};

const temperaturConfig = {
  [Temperatur.HOT]: { emoji: '🔥', label: 'Heiß', class: 'badge-fire' },
  [Temperatur.WARM]: { emoji: '🌤', label: 'Warm', class: 'badge-warm' },
  [Temperatur.COLD]: { emoji: '❄️', label: 'Kalt', class: 'badge-cold' },
};

export const DealCard: React.FC<DealCardProps> = ({ deal, onClick }) => {
  const ampel = deal.lead ? ampelConfig[deal.lead.ampelStatus] : ampelConfig[AmpelStatus.YELLOW];
  const temp = deal.lead ? temperaturConfig[deal.lead.temperatur] : temperaturConfig[Temperatur.WARM];

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="deal-card" onClick={onClick}>
      <div className="deal-name">{deal.title}</div>
      <div className="deal-value">{formatValue(deal.value)}</div>
      <div className="deal-meta">
        <span className={`deal-badge ${ampel.class}`}>
          {ampel.emoji} {ampel.label}
        </span>
        <span className={`deal-badge ${temp.class}`}>
          {temp.emoji} {temp.label}
        </span>
      </div>
    </div>
  );
};
