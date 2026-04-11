import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import bcrypt from 'bcryptjs';
import { findUserByEmail } from '../../lib/cosmos-client.js';
import { generateToken } from '../../lib/auth-middleware.js';

async function login(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = (await request.json()) as { email?: string; password?: string };

    if (!body.email || !body.password) {
      return { status: 400, jsonBody: { error: 'Email and password are required' } };
    }

    const email = body.email.toLowerCase().trim();
    const user = await findUserByEmail(email);

    if (!user) {
      return { status: 401, jsonBody: { error: 'Invalid email or password' } };
    }

    const passwordValid = await bcrypt.compare(body.password, user.passwordHash);
    if (!passwordValid) {
      return { status: 401, jsonBody: { error: 'Invalid email or password' } };
    }

    const token = generateToken({ userId: user.id, email: user.email, plan: user.plan });

    return {
      status: 200,
      jsonBody: {
        token,
        user: { id: user.id, email: user.email, plan: user.plan },
      },
    };
  } catch (error: any) {
    context.error('Login error:', error);
    return { status: 500, jsonBody: { error: 'Internal server error' } };
  }
}

app.http('login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: login,
});
