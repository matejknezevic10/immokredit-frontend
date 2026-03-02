// src/components/Pipeline/PipelineStage.tsx
import React from 'react';
import { DealCard } from './DealCard';
import { Deal, DealStage } from '@/types';
import './PipelineStage.css';

interface PipelineStageProps {
  stage: DealStage;
  title: string;
  icon: string;
  deals: Deal[];
  onDealClick?: (deal: Deal) => void;
}

export const PipelineStage: React.FC<PipelineStageProps> = ({
  title,
  icon,
  deals,
  onDealClick,
}) => {
  return (
    <div className="pipeline-stage">
      <div className="stage-header">
        <div className="stage-title">
          {icon} {title}
        </div>
        <div className="stage-count">{deals.length}</div>
      </div>
      <div className="stage-deals">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onClick={() => onDealClick?.(deal)} />
        ))}
        {deals.length === 0 && (
          <div className="stage-empty">Keine Deals</div>
        )}
      </div>
    </div>
  );
};
