import { Session } from 'better-auth/types';
import { NextRequest } from 'next/server';

export const getSession = async (req: NextRequest): Promise<Session | null> => {
  const response = await fetch(
    new URL(
      '/api/auth/get-session?disableCookieCache=true',
      req.nextUrl.origin
    ),
    {
      headers: {
        cookie: req.headers.get('cookie') || ''
      }
    }
  );

  if (!response.ok) {
    return null;
  }

  try {
    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error parsing session JSON:', error);
    return null;
  }
};
