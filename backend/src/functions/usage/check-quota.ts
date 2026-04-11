import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest } from '../../lib/auth-middleware.js';
import { getOrCreateUsage } from '../../lib/cosmos-client.js';

const FREE_LIMITS = { scansPerDay: 5, draftsPerDay: 3 };

async function checkQuota(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return { status: 401, jsonBody: { error: 'Authentication required' } };
    }

    const today = new Date().toISOString().split('T')[0];
    const usage = await getOrCreateUsage(auth.userId, today);

    if (auth.plan === 'pro') {
      return {
        status: 200,
        jsonBody: {
          plan: 'pro',
          scansUsed: usage.scans,
          draftsUsed: usage.drafts,
          scansRemaining: Infinity,
          draftsRemaining: Infinity,
          scanAllowed: true,
          draftAllowed: true,
        },
      };
    }

    return {
      status: 200,
      jsonBody: {
        plan: 'free',
        scansUsed: usage.scans,
        draftsUsed: usage.drafts,
        scansRemaining: Math.max(0, FREE_LIMITS.scansPerDay - usage.scans),
        draftsRemaining: Math.max(0, FREE_LIMITS.draftsPerDay - usage.drafts),
        scanAllowed: usage.scans < FREE_LIMITS.scansPerDay,
        draftAllowed: usage.drafts < FREE_LIMITS.draftsPerDay,
      },
    };
  } catch (error: any) {
    context.error('Check quota error:', error);
    return { status: 500, jsonBody: { error: 'Failed to check quota' } };
  }
}

app.http('checkQuota', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'usage/check-quota',
  handler: checkQuota,
});
