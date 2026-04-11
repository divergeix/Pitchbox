import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { findUserByEmail, createUser, UserRecord } from '../../lib/cosmos-client.js';
import { generateToken } from '../../lib/auth-middleware.js';

async function register(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = (await request.json()) as { email?: string; password?: string };

    if (!body.email || !body.password) {
      return { status: 400, jsonBody: { error: 'Email and password are required' } };
    }

    const email = body.email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { status: 400, jsonBody: { error: 'Invalid email format' } };
    }

    if (body.password.length < 8) {
      return { status: 400, jsonBody: { error: 'Password must be at least 8 characters' } };
    }

    // Check if user exists
    const existing = await findUserByEmail(email);
    if (existing) {
      return { status: 409, jsonBody: { error: 'An account with this email already exists' } };
    }

    // Create user
    const passwordHash = await bcrypt.hash(body.password, 10);
    const id = crypto.randomUUID();
    const user: UserRecord = {
      id,
      email,
      passwordHash,
      plan: 'free',
      createdAt: new Date().toISOString(),
      paymentHistory: [],
    };

    await createUser(user);

    const token = generateToken({ userId: id, email, plan: 'free' });

    return {
      status: 201,
      jsonBody: { token, user: { id, email, plan: 'free' } },
    };
  } catch (error: any) {
    context.error('Registration error:', error);
    return { status: 500, jsonBody: { error: 'Internal server error' } };
  }
}

app.http('register', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/register',
  handler: register,
});
