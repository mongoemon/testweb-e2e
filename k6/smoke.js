/**
 * Smoke Test — ตรวจสอบว่าทุก critical endpoint ยังทำงานได้
 * VU: 2, Duration: 1m
 * ใช้รันก่อน load/stress เพื่อยืนยัน baseline
 *
 * Data Management Strategy: Tag prefix + teardown()
 * - ทุก order ใช้ shipping_name ขึ้นต้นด้วย PERF_SMOKE_
 * - teardown() ลบ order เหล่านั้นผ่าน admin API หลัง test จบ
 *
 * Race Condition Fix:
 * - 2 VU ใช้ token เดียวกัน (same user = same cart)
 * - เฉพาะ VU 1 เท่านั้นที่ทำ cart→order เพื่อป้องกัน shared-cart race
 * - VU 2 ทำแค่ products + auth (ยืนยัน read endpoints)
 *
 * Stock Fix:
 * - setup() restocks product ก่อนรัน — ป้องกัน "Only 0 items in stock"
 * - teardown() cleanup PERF_SMOKE_ orders หลังรัน
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { login, authHeaders, BASE_URL } from './helpers/auth.js';
import { restock, cleanupOrders } from './helpers/admin.js';
import { summary } from './helpers/report.js';

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
  shipping_name:    'PERF_SMOKE_testuser',
  shipping_address: '123 Test Rd',
  shipping_city:    'Bangkok',
  shipping_postal:  '10110',
  shipping_phone:   '081-000-0000',
  payment_method:   'credit_card',
});

export function handleSummary(data) {
  return summary(data, 'smoke-report.html');
}

// ---------------------------------------------------------------------------
// setup() — รันครั้งเดียว ก่อน VU ทั้งหมดเริ่ม
// ---------------------------------------------------------------------------

export function setup() {
  var token      = login('testuser', 'test1234');
  var adminToken = login('admin',    'admin1234');

  // restock ก่อนรัน — ป้องกัน stock หมดจาก test run ก่อนหน้า
  restock(adminToken, 1, 1000);

  return { token: token, adminToken: adminToken };
}

// ---------------------------------------------------------------------------
// teardown() — รันครั้งเดียว หลัง VU ทุกตัวหยุดแล้ว
// ---------------------------------------------------------------------------

export function teardown(data) {
  cleanupOrders(data.adminToken, 'PERF_SMOKE_');
}

// ---------------------------------------------------------------------------
// Default function
// VU 1 → Products + Auth + Cart→Order  (full critical path)
// VU 2 → Products + Auth only          (ป้องกัน shared-cart race condition)
// ---------------------------------------------------------------------------

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

  // เฉพาะ VU 1 — ป้องกัน shared-cart race condition กับ VU 2
  if (__VU === 1) {
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
}
