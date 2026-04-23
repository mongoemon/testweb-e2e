/**
 * Stress Test — หา breaking point ของระบบ
 * เพิ่ม VU ทีละขั้นจนกว่า threshold จะพัง
 * ไม่ควรรันบน production
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { login, authHeaders, BASE_URL } from './helpers/auth.js';

export var options = {
  stages: [
    { duration: '2m', target: 50  },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 150 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 0   },
  ],
  thresholds: {
    http_req_failed:                        ['rate<0.10'],
    'http_req_duration{endpoint:products}': ['p(95)<2000'],
    'http_req_duration{endpoint:auth}':     ['p(95)<3000'],
  },
};

export function setup() {
  var token = login('testuser', 'test1234');
  return { token: token };
}

export default function (data) {
  group('Products under stress', function () {
    var list = http.get(
      BASE_URL + '/api/products',
      { tags: { endpoint: 'products' } }
    );
    check(list, { 'products ok': function (r) { return r.status === 200; } });

    var search = http.get(
      BASE_URL + '/api/products?search=nike',
      { tags: { endpoint: 'products' } }
    );
    check(search, { 'search ok': function (r) { return r.status === 200; } });
  });

  sleep(0.5);

  group('Auth under stress', function () {
    var me = http.get(
      BASE_URL + '/api/auth/me',
      authHeaders(data.token, { endpoint: 'auth' })
    );
    check(me, { 'me ok': function (r) { return r.status === 200; } });
  });

  sleep(0.5);
}
