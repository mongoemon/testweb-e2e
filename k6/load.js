/**
 * Load Test — จำลอง normal expected traffic
 * Ramp up → 50 VU → sustain 5m → ramp down
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { login, authHeaders, BASE_URL } from './helpers/auth.js';

export var options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '1m', target: 0  },
  ],
  thresholds: {
    http_req_failed:                        ['rate<0.01'],
    'http_req_duration{endpoint:auth}':     ['p(95)<500'],
    'http_req_duration{endpoint:products}': ['p(95)<300'],
    'http_req_duration{endpoint:cart}':     ['p(95)<400'],
  },
};

export function setup() {
  var token = login('testuser', 'test1234');
  return { token: token };
}

export default function (data) {
  group('Browse Products', function () {
    var list = http.get(
      BASE_URL + '/api/products',
      { tags: { endpoint: 'products' } }
    );
    check(list, {
      'products 200':          function (r) { return r.status === 200; },
      'has items':             function (r) { return r.json('items').length > 0; },
      'has pagination fields': function (r) { return r.json('total') !== undefined; },
    });

    sleep(Math.random() * 2 + 1);

    var detail = http.get(
      BASE_URL + '/api/products/1',
      { tags: { endpoint: 'products' } }
    );
    check(detail, { 'product detail 200': function (r) { return r.status === 200; } });

    var search = http.get(
      BASE_URL + '/api/products?search=nike&sort=price_asc',
      { tags: { endpoint: 'products' } }
    );
    check(search, { 'search 200': function (r) { return r.status === 200; } });
  });

  sleep(1);

  group('Authenticated Browse', function () {
    var me = http.get(
      BASE_URL + '/api/auth/me',
      authHeaders(data.token, { endpoint: 'auth' })
    );
    check(me, { 'me 200': function (r) { return r.status === 200; } });

    var cart = http.get(
      BASE_URL + '/api/cart',
      authHeaders(data.token, { endpoint: 'cart' })
    );
    check(cart, { 'cart 200': function (r) { return r.status === 200; } });
  });

  sleep(Math.random() * 2 + 1);

  group('Categories', function () {
    var cats = http.get(
      BASE_URL + '/api/categories',
      { tags: { endpoint: 'products' } }
    );
    check(cats, { 'categories 200': function (r) { return r.status === 200; } });
  });

  sleep(1);
}
