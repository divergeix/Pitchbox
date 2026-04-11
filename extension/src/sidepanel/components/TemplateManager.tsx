import React from 'react';
import { TEMPLATES, Template, TemplateType } from '../../lib/drafts/templates';
import { PERSONAS } from '../../lib/drafts/personas';

interface Props {
  selectedPersona: string;
  selectedType: TemplateType;
  onSelectType: (type: TemplateType) => void;
  onSelectPersona: (id: string) => void;
}

export function TemplateManager({ selectedPersona, selectedType, onSelectType, onSelectPersona }: Props) {
  const personaTemplates = TEMPLATES.filter(t => t.personaId === selectedPersona);

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {PERSONAS.map(p => (
          <button
            key={p.id}
            onClick={() => onSelectPersona(p.id)}
            className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
              selectedPersona === p.id
                ? 'bg-pitch-accent text-white'
                : 'bg-pitch-border text-pitch-text-muted hover:bg-pitch-accent/20'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5">
        {personaTemplates.map(t => (
          <button
            key={t.id}
            onClick={() => onSelectType(t.type)}
            className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
              selectedType === t.type
                ? 'bg-pitch-accent/20 text-pitch-accent border border-pitch-accent/30'
                : 'bg-pitch-border text-pitch-text-muted hover:bg-pitch-accent/10 border border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
