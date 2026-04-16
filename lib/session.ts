import { SessionOptions } from 'iron-session';

export interface SessionData {
  userId: number;
  username: string;
  role: 'admin' | 'employee';
  employeeId?: number;
  employeeName?: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'fB9xK2mQ7vL4nR8wT1pJ6hD3cY0sA5gU9eI2oW7zN4bV8xM1',
  cookieName: 'hrapp-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 8, // 8시간
  },
};
