import { redirect } from 'react-router';
import { auth } from './auth.server';

export async function requireAuth(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    throw redirect('/login');
  }

  return session;
}
