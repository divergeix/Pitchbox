import { AngleCategory } from './rules-engine';

export const ANGLE_CATEGORY_META: Record<AngleCategory, { label: string; icon: string; color: string }> = {
  marketing: { label: 'Marketing', icon: '📢', color: '#818cf8' },
  engineering: { label: 'Engineering', icon: '⚙️', color: '#22d3ee' },
  operations: { label: 'Operations', icon: '🔧', color: '#f59e0b' },
  ecommerce: { label: 'Ecommerce', icon: '🛒', color: '#a78bfa' },
  revops: { label: 'RevOps', icon: '📊', color: '#34d399' },
  'design-cro': { label: 'Design / CRO', icon: '🎨', color: '#fb923c' },
  support: { label: 'Support', icon: '💬', color: '#38bdf8' },
  growth: { label: 'Growth', icon: '🚀', color: '#4ade80' },
  founder: { label: 'Founder', icon: '👤', color: '#e879f9' },
};
