import React from 'react';
import { OutreachAngle } from '../../lib/angles/rules-engine';
import { ANGLE_CATEGORY_META } from '../../lib/angles/angle-categories';

interface Props {
  angles: OutreachAngle[];
  selectedAngle: OutreachAngle | null;
  onSelectAngle: (angle: OutreachAngle) => void;
}

export function AngleCard({ angles, selectedAngle, onSelectAngle }: Props) {
  return (
    <div className="card">
      <div className="section-title">Outreach Angles ({angles.length})</div>
      <div className="space-y-2">
        {angles.map(angle => {
          const meta = ANGLE_CATEGORY_META[angle.category];
          const isSelected = selectedAngle?.id === angle.id;
          return (
            <button
              key={angle.id}
              onClick={() => onSelectAngle(angle)}
              className={`w-full text-left border rounded-lg p-3 transition-colors ${
                isSelected
                  ? 'border-pitch-accent bg-pitch-accent/10'
                  : 'border-pitch-border hover:border-pitch-accent/50 bg-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{meta?.icon}</span>
                  <span className="text-sm font-medium text-pitch-text">{angle.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`badge-${angle.strength === 'strong' ? 'strong' : angle.strength === 'medium' ? 'inferred' : 'low'}`}>
                    {angle.confidence}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-pitch-text-muted">{angle.description}</p>
              <p className="text-xs text-pitch-accent mt-1.5 italic">"{angle.suggestedOpener}"</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
