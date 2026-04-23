/**
 * Smoke Test — ตรวจสอบว่าทุก critical endpoint ยังทำงานได้
 * VU: 2, Duration: 1m
 * ใช้รันก่อน load/stress เพื่อยืนยัน baseline
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { login, authHeaders, BASE_URL } from './helpers/auth.js';

export var options = {
  vus: 2,
  duration: '1m',
  thresholds: {
    http_req_failed:                        ['rate<0.01'],
    'http_req_duration{endpoint:auth}':     ['p(95)<500'],
    'http_req_duration{endpoint:products}': ['p(95)<300'],
    'http_req_duration{endpoint:cart}':     ['p(95)<400'],
    'http_req_duration{endpoint:orders}':   ['p(95)<1000'],
  },
};

var SHIPPING = JSON.stringify({
  shipping_name:    'Load Test User',
  shipping_address: '123 Test Rd',
  shipping_city:    'Bangkok',
  shipping_postal:  '10110',
  shipping_phone:   '081-000-0000',
  payment_method:   'credit_card',
});

export function setup() {
  var token = login('testuser', 'test1234');
  return { token: token };
}

export default function (data) {
  group('Products', function () {
    var list = http.get(
      BASE_URL + '/api/products',
      { tags: { endpoint: 'products' } }
    );
    check(list, { 'products 200': function (r) { return r.status === 200; } });

    var detail = http.get(
      BASE_URL + '/api/products/1',
      { tags: { endpoint: 'products' } }
    );
    check(detail, { 'product detail 200': function (r) { return r.status === 200; } });
  });

  sleep(1);

  group('Auth', function () {
    var me = http.get(
      BASE_URL + '/api/auth/me',
      authHeaders(data.token, { endpoint: 'auth' })
    );
    check(me, { 'me 200': function (r) { return r.status === 200; } });
  });

  sleep(1);

  group('Cart → Order', function () {
    http.del(
      BASE_URL + '/api/cart/clear',
      null,
      authHeaders(data.token, { endpoint: 'cart' })
    );

    var add = http.post(
      BASE_URL + '/api/cart',
      JSON.stringify({ product_id: 1, size: '42', quantity: 1 }),
      authHeaders(data.token, { endpoint: 'cart' })
    );
    check(add, { 'add to cart 200': function (r) { return r.status === 200; } });

    var order = http.post(
      BASE_URL + '/api/orders',
      SHIPPING,
      authHeaders(data.token, { endpoint: 'orders' })
    );
    check(order, { 'place order 200': function (r) { return r.status === 200; } });
  });

  sleep(1);
}
