import http from 'k6/http';
import { check } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export function login(username, password) {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ username, password }),
    { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'auth' } }
  );
  check(res, { 'login 200': (r) => r.status === 200 });
  return res.json('access_token');
}

export function authHeaders(token, tags) {
  var params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
  };
  if (tags) params.tags = tags;
  return params;
}
