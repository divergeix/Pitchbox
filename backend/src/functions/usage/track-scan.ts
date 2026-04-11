import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest } from '../../lib/auth-middleware.js';
import { incrementUsage } from '../../lib/cosmos-client.js';

async function trackScan(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return { status: 401, jsonBody: { error: 'Authentication required' } };
    }

    const body = (await request.json()) as { type?: 'scan' | 'draft' };
    const type = body.type || 'scan';

    if (type !== 'scan' && type !== 'draft') {
      return { status: 400, jsonBody: { error: 'Type must be "scan" or "draft"' } };
    }

    const field = type === 'scan' ? 'scans' : 'drafts';
    const usage = await incrementUsage(auth.userId, field as 'scans' | 'drafts');

    return {
      status: 200,
      jsonBody: {
        scans: usage.scans,
        drafts: usage.drafts,
        date: usage.date,
      },
    };
  } catch (error: any) {
    context.error('Track scan error:', error);
    return { status: 500, jsonBody: { error: 'Failed to track usage' } };
  }
}

app.http('trackScan', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'usage/track',
  handler: trackScan,
});
