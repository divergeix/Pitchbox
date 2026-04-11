export type TemplateType = 'cold-email' | 'linkedin-dm' | 'cold-call-opener';

export interface Template {
  id: string;
  type: TemplateType;
  label: string;
  personaId: string;
}

export const TEMPLATES: Template[] = [
  // Marketing persona
  { id: 'mkt-email', type: 'cold-email', label: 'Cold Email', personaId: 'marketing' },
  { id: 'mkt-linkedin', type: 'linkedin-dm', label: 'LinkedIn DM', personaId: 'marketing' },
  { id: 'mkt-call', type: 'cold-call-opener', label: 'Cold Call Opener', personaId: 'marketing' },

  // Engineering persona
  { id: 'eng-email', type: 'cold-email', label: 'Cold Email', personaId: 'engineering' },
  { id: 'eng-linkedin', type: 'linkedin-dm', label: 'LinkedIn DM', personaId: 'engineering' },
  { id: 'eng-call', type: 'cold-call-opener', label: 'Cold Call Opener', personaId: 'engineering' },

  // Operations persona
  { id: 'ops-email', type: 'cold-email', label: 'Cold Email', personaId: 'operations' },
  { id: 'ops-linkedin', type: 'linkedin-dm', label: 'LinkedIn DM', personaId: 'operations' },
  { id: 'ops-call', type: 'cold-call-opener', label: 'Cold Call Opener', personaId: 'operations' },
];
