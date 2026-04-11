import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest } from '../../lib/auth-middleware.js';
import { createOrder } from '../../lib/razorpay-client.js';

const PRO_PLAN_AMOUNT = 49900; // 499 INR in paise
const CURRENCY = 'INR';

async function createPaymentOrder(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return { status: 401, jsonBody: { error: 'Authentication required' } };
    }

    const order = await createOrder({
      amount: PRO_PLAN_AMOUNT,
      currency: CURRENCY,
      receipt: `pitchbox_pro_${auth.userId}_${Date.now()}`,
      notes: {
        userId: auth.userId,
        email: auth.email,
        plan: 'pro',
      },
    });

    return {
      status: 200,
      jsonBody: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    };
  } catch (error: any) {
    context.error('Create order error:', error);
    return { status: 500, jsonBody: { error: 'Failed to create payment order' } };
  }
}

app.http('createOrder', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'payment/create-order',
  handler: createPaymentOrder,
});
