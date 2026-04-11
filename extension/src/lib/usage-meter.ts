import { getUsage, getUserPlan } from './storage';

export const FREE_LIMITS = {
  scansPerDay: 5,
  draftsPerDay: 3,
};

export interface UsageCheck {
  allowed: boolean;
  plan: 'free' | 'pro';
  scansRemaining: number;
  draftsRemaining: number;
  scansUsed: number;
  draftsUsed: number;
}

export async function checkScanAllowed(): Promise<UsageCheck> {
  const plan = await getUserPlan();
  const usage = await getUsage();

  if (plan === 'pro') {
    return {
      allowed: true, plan, scansRemaining: Infinity, draftsRemaining: Infinity,
      scansUsed: usage.scansToday, draftsUsed: usage.draftsToday,
    };
  }

  return {
    allowed: usage.scansToday < FREE_LIMITS.scansPerDay,
    plan,
    scansRemaining: Math.max(0, FREE_LIMITS.scansPerDay - usage.scansToday),
    draftsRemaining: Math.max(0, FREE_LIMITS.draftsPerDay - usage.draftsToday),
    scansUsed: usage.scansToday,
    draftsUsed: usage.draftsToday,
  };
}

export async function checkDraftAllowed(): Promise<UsageCheck> {
  const plan = await getUserPlan();
  const usage = await getUsage();

  if (plan === 'pro') {
    return {
      allowed: true, plan, scansRemaining: Infinity, draftsRemaining: Infinity,
      scansUsed: usage.scansToday, draftsUsed: usage.draftsToday,
    };
  }

  return {
    allowed: usage.draftsToday < FREE_LIMITS.draftsPerDay,
    plan,
    scansRemaining: Math.max(0, FREE_LIMITS.scansPerDay - usage.scansToday),
    draftsRemaining: Math.max(0, FREE_LIMITS.draftsPerDay - usage.draftsToday),
    scansUsed: usage.scansToday,
    draftsUsed: usage.draftsToday,
  };
}
