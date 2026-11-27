import type { Request } from 'express';

export const sessionCookie = 'trasu_session';

export function requestToken(request: Request): string | undefined {
  const values = (request.headers.cookie ?? '')
    .split(';')
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith(`${sessionCookie}=`));
  return values.length === 1
    ? values[0].slice(sessionCookie.length + 1)
    : undefined;
}
