import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { verifyWebhookSignature } from '../../lib/razorpay-client.js';
import { findUserByEmail, updateUser } from '../../lib/cosmos-client.js';

async function razorpayWebhook(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      context.warn('Invalid webhook signature');
      return { status: 400, jsonBody: { error: 'Invalid signature' } };
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    context.log(`Razorpay webhook: ${eventType}`);

    if (eventType === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      if (payment) {
        const email = payment.notes?.email;
        const userId = payment.notes?.userId;

        if (email) {
          const user = await findUserByEmail(email);
          if (user) {
            const paymentRecord = {
              orderId: payment.order_id || '',
              paymentId: payment.id,
              amount: payment.amount,
              currency: payment.currency,
              status: 'captured',
              timestamp: new Date().toISOString(),
            };

            await updateUser(user.id, user.email, {
              plan: 'pro',
              paymentHistory: [...(user.paymentHistory || []), paymentRecord],
            });

            context.log(`User ${email} upgraded to pro via webhook`);
          }
        }
      }
    }

    if (eventType === 'payment.failed') {
      const payment = event.payload?.payment?.entity;
      context.warn(`Payment failed for ${payment?.notes?.email || 'unknown'}: ${payment?.error_description || 'unknown error'}`);
    }

    return { status: 200, jsonBody: { received: true } };
  } catch (error: any) {
    context.error('Webhook error:', error);
    return { status: 500, jsonBody: { error: 'Webhook processing failed' } };
  }
}

app.http('razorpayWebhook', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'payment/webhook',
  handler: razorpayWebhook,
});
