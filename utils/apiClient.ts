import { APIRequestContext, expect } from '@playwright/test';
import { getCredentials } from './excelReader';

export async function loginAs(
  request: APIRequestContext,
  tcRef: 'TC-AUTH-05' | 'TC-AUTH-06'
): Promise<string> {
  const { username, password } = getCredentials(tcRef);
  const res = await request.post('/api/auth/login', { data: { username, password } });
  expect(res.status()).toBe(200);
  const body = await res.json();
  return body.access_token as string;
}

export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}
