import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from './session';
import { redirect } from 'next/navigation';

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session.userId) {
    redirect('/login');
  }
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session.userId) redirect('/login');
  if (session.role !== 'admin') redirect('/attendance');
  return session;
}
