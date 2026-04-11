import React from 'react';
import { Signal } from '../../lib/signals/commercial';

interface Props {
  signals: Signal[];
}

const TYPE_STYLES: Record<string, { bg: string; label: string }> = {
  commercial: { bg: 'bg-blue-900/20 border-blue-800/40', label: 'Commercial' },
  operational: { bg: 'bg-amber-900/20 border-amber-800/40', label: 'Operational' },
  negative: { bg: 'bg-red-900/20 border-red-800/40', label: 'Gap' },
};

export function SignalCard({ signals }: Props) {
  if (signals.length === 0) {
    return (
      <div className="card">
        <div className="section-title">Buying Signals</div>
        <p className="text-sm text-pitch-text-muted">No notable signals detected.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="section-title">Buying Signals ({signals.length})</div>
      <div className="space-y-2">
        {signals.map((signal, i) => {
          const style = TYPE_STYLES[signal.type] || TYPE_STYLES.commercial;
          return (
            <div key={i} className={`border rounded-lg p-2.5 ${style.bg}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-pitch-text">{signal.title}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-pitch-text-muted uppercase">{style.label}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    signal.confidence === 'strong' ? 'bg-green-400' :
                    signal.confidence === 'inferred' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                </div>
              </div>
              <p className="text-xs text-pitch-text-muted">{signal.description}</p>
              {signal.sourceDetections.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {signal.sourceDetections.map((src, j) => (
                    <span key={j} className="text-[10px] bg-pitch-bg/50 px-1.5 py-0.5 rounded text-pitch-text-muted">
                      {src}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
