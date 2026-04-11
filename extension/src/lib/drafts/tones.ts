export interface Tone {
  id: string;
  label: string;
  description: string;
  systemInstruction: string;
}

export const TONES: Tone[] = [
  {
    id: 'direct',
    label: 'Direct',
    description: 'Straightforward, no fluff, get to the point',
    systemInstruction: 'Write in a direct, no-nonsense tone. Get straight to the point. No compliments, no fluff. Every sentence should earn its place.',
  },
  {
    id: 'consultative',
    label: 'Consultative',
    description: 'Helpful expert sharing observations, not selling',
    systemInstruction: 'Write in a consultative, advisory tone. Position yourself as a helpful expert sharing observations, not pitching. Ask smart questions. Lead with insight.',
  },
  {
    id: 'punchy',
    label: 'Punchy',
    description: 'Short, bold, high-energy, pattern-interrupt style',
    systemInstruction: 'Write in a punchy, high-energy tone. Keep sentences short and bold. Use pattern-interrupt style. No corporate speak. Sound human and confident.',
  },
];
