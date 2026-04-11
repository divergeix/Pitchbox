export interface Persona {
  id: string;
  label: string;
  description: string;
  targetTitles: string[];
}

export const PERSONAS: Persona[] = [
  {
    id: 'marketing',
    label: 'Marketing Leader',
    description: 'VP Marketing, CMO, Head of Growth, Marketing Director',
    targetTitles: ['VP Marketing', 'CMO', 'Head of Marketing', 'Marketing Director', 'Head of Growth', 'Growth Lead'],
  },
  {
    id: 'engineering',
    label: 'Engineering Leader',
    description: 'CTO, VP Engineering, Engineering Manager, Tech Lead',
    targetTitles: ['CTO', 'VP Engineering', 'Engineering Manager', 'Tech Lead', 'Head of Engineering'],
  },
  {
    id: 'operations',
    label: 'Operations Leader',
    description: 'COO, VP Operations, RevOps Lead, Head of Ops',
    targetTitles: ['COO', 'VP Operations', 'RevOps Lead', 'Head of Operations', 'Operations Director'],
  },
];
