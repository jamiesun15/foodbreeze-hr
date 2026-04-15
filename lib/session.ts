import { SessionOptions } from 'iron-session';

export interface SessionData {
  userId: number;
  username: string;
  role: 'admin' | 'employee';
  employeeId?: number;
  employeeName?: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'foodbreeze-hr-secret-key-2024-change-this',
  cookieName: 'hrapp-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 8, // 8시간
  },
};
