import React, { useState } from 'react';
import { DetectionResult } from '../../lib/detectors/cms';

interface Props {
  detections: DetectionResult[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'CMS / Site Builder': 'bg-blue-900/30 text-blue-400 border-blue-800/50',
  'Analytics': 'bg-purple-900/30 text-purple-400 border-purple-800/50',
  'Marketing': 'bg-pink-900/30 text-pink-400 border-pink-800/50',
  'Sales / Support': 'bg-cyan-900/30 text-cyan-400 border-cyan-800/50',
  'Ecommerce / Payments': 'bg-orange-900/30 text-orange-400 border-orange-800/50',
  'Infrastructure': 'bg-green-900/30 text-green-400 border-green-800/50',
  'Lead Capture': 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50',
  'SEO': 'bg-indigo-900/30 text-indigo-400 border-indigo-800/50',
  'Trust / Compliance': 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50',
};

export function StackCard({ detections }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (detections.length === 0) {
    return (
      <div className="card">
        <div className="section-title">Tech Stack</div>
        <p className="text-sm text-pitch-text-muted">No technologies detected on this page.</p>
      </div>
    );
  }

  // Group by category
  const grouped = detections.reduce<Record<string, DetectionResult[]>>((acc, d) => {
    (acc[d.category] = acc[d.category] || []).push(d);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="section-title mb-0">Tech Stack</div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-pitch-accent hover:text-pitch-accent-hover"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {!expanded ? (
        <div className="flex flex-wrap gap-1.5">
          {detections.map((d, i) => (
            <span
              key={i}
              className={`badge border ${CATEGORY_COLORS[d.category] || 'bg-pitch-border text-pitch-text-muted'}`}
              title={`${d.source} (${d.confidence})`}
            >
              {d.name}
            </span>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat}>
              <p className="text-xs font-medium text-pitch-text-muted mb-1">{cat}</p>
              <div className="space-y-1">
                {grouped[cat].map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-pitch-text">{d.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-pitch-text-muted">{d.source}</span>
                      <span className={`w-2 h-2 rounded-full ${
                        d.confidence === 'strong' ? 'bg-green-400' :
                        d.confidence === 'inferred' ? 'bg-yellow-400' : 'bg-red-400'
                      }`} title={d.confidence} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
