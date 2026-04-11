import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest, generateToken } from '../../lib/auth-middleware.js';
import { verifyPaymentSignature } from '../../lib/razorpay-client.js';
import { findUserByEmail, updateUser } from '../../lib/cosmos-client.js';

async function verifyPayment(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return { status: 401, jsonBody: { error: 'Authentication required' } };
    }

    const body = (await request.json()) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
      return { status: 400, jsonBody: { error: 'Missing payment verification fields' } };
    }

    // Verify signature
    const isValid = verifyPaymentSignature(
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature
    );

    if (!isValid) {
      return { status: 400, jsonBody: { error: 'Invalid payment signature' } };
    }

    // Update user to pro
    const user = await findUserByEmail(auth.email);
    if (!user) {
      return { status: 404, jsonBody: { error: 'User not found' } };
    }

    const paymentRecord = {
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      amount: 49900,
      currency: 'INR',
      status: 'captured',
      timestamp: new Date().toISOString(),
    };

    await updateUser(user.id, user.email, {
      plan: 'pro',
      paymentHistory: [...(user.paymentHistory || []), paymentRecord],
    });

    // Generate new token with updated plan
    const newToken = generateToken({ userId: user.id, email: user.email, plan: 'pro' });

    return {
      status: 200,
      jsonBody: {
        success: true,
        plan: 'pro',
        token: newToken,
      },
    };
  } catch (error: any) {
    context.error('Verify payment error:', error);
    return { status: 500, jsonBody: { error: 'Payment verification failed' } };
  }
}

app.http('verifyPayment', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'payment/verify',
  handler: verifyPayment,
});
