/**
 * Scenario-Based Performance Test — ShoesHub
 *
 * แนวคิด: แทนที่จะ simulate แค่ "จำนวน VU ที่เพิ่มขึ้น" เหมือน load/stress.js
 * เราจำลอง "พฤติกรรมผู้ใช้จริง" หลายกลุ่มที่รันพร้อมกัน
 *
 * Timeline:
 *
 *   0m ──────────────────────────── 9m
 *   │
 *   ├── [browse_anonymous]   0m→9m   ramp 0→40→40→0 VU
 *   ├── [returning_customer] 1m→9m   คงที่ 15 VU
 *   └── [checkout_burst]     4m→7m   arrival-rate spike (โปรโมชั่น flash)
 *
 * Executor Types ที่ใช้:
 *   - ramping-vus        → ควบคุม "จำนวน VU" (คน) ให้ขึ้น/ลงตาม stages
 *   - constant-vus       → VU คงที่ตลอด — ดีสำหรับ steady-state
 *   - ramping-arrival-rate → ควบคุม "จำนวน request/วินาที" (RPS)
 *                            ต่างจาก VU-based คือ k6 จะ spawn VU เพิ่มเองถ้าจำเป็น
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { login, authHeaders, BASE_URL } from './helpers/auth.js';
import { summary } from './helpers/report.js';

// ---------------------------------------------------------------------------
// Options — ประกาศ scenario ทั้งหมดที่นี่
// ---------------------------------------------------------------------------

export var options = {

  scenarios: {

    // -----------------------------------------------------------------------
    // Scenario 1: Anonymous Browse
    // -----------------------------------------------------------------------
    // จำลองคนทั่วไปที่เข้ามาดูสินค้าโดยไม่ login
    // ใช้ ramping-vus เพราะอยากควบคุม "จำนวนคน" ที่เพิ่มขึ้นแบบ gradual
    // exec ชี้ไปฟังก์ชัน browseAnonymous() ด้านล่าง
    browse_anonymous: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 40 },   // warm-up: ramp ขึ้นถึง 40 VU
        { duration: '5m', target: 40 },   // sustain: คงที่ 5 นาที
        { duration: '2m', target: 0  },   // ramp-down: ลงช้า ๆ
      ],
      exec: 'browseAnonymous',
      // tags จะติดทุก request ใน scenario นี้ → กรอง threshold ได้
      tags: { scenario: 'browse_anonymous' },
    },

    // -----------------------------------------------------------------------
    // Scenario 2: Returning Customer (Authenticated)
    // -----------------------------------------------------------------------
    // จำลองลูกค้าที่ login แล้ว เลือกสินค้า เพิ่มลง cart ดู cart
    // ใช้ constant-vus เพราะอยากให้ 15 คนรันตลอดโดยไม่ขึ้นลง
    // startTime: '1m' → เริ่มหลัง browse warm-up เพื่อไม่ spike ระบบตอน 0 วิ
    returning_customer: {
      executor: 'constant-vus',
      vus: 15,
      duration: '8m',
      startTime: '1m',                    // เริ่ม 1 นาทีหลัง test start
      exec: 'authenticatedShopper',
      tags: { scenario: 'returning_customer' },
    },

    // -----------------------------------------------------------------------
    // Scenario 3: Checkout Burst (Flash Promotion)
    // -----------------------------------------------------------------------
    // จำลองช่วงที่มีโปรโมชั่น flash sale → คน checkout พร้อมกันอย่างรวดเร็ว
    // ใช้ ramping-arrival-rate เพราะ:
    //   - กำหนดเป็น "request ต่อวินาที" แทน VU
    //   - สะท้อนความเป็นจริง: ระบบได้รับ 20 req/s ไม่ว่า VU จะเสร็จช้าหรือเร็ว
    //   - k6 จะ spawn VU เพิ่มเองถ้า VU ปัจจุบันทำงานไม่ทัน (ถึง maxVUs)
    checkout_burst: {
      executor: 'ramping-arrival-rate',
      startRate: 1,                       // เริ่มที่ 1 req/s
      timeUnit: '1s',
      preAllocatedVUs: 20,                // จอง VU ไว้ล่วงหน้า
      maxVUs: 80,                         // k6 spawn เพิ่มได้สูงสุด 80
      stages: [
        { duration: '30s', target: 3  },  // warm-up
        { duration: '2m',  target: 20 },  // spike: ขึ้นถึง 20 req/s
        { duration: '1m',  target: 20 },  // sustain spike
        { duration: '30s', target: 1  },  // cool-down
      ],
      startTime: '4m',                    // เริ่มตอนกลาง test (หลัง browse stabilize)
      exec: 'checkoutFlow',
      tags: { scenario: 'checkout_burst' },
    },

  },

  // -------------------------------------------------------------------------
  // Thresholds — กำหนดต่อ scenario tag เพื่อให้ SLO แต่ละกลุ่มต่างกันได้
  // -------------------------------------------------------------------------
  thresholds: {
    // Browse anonymous: ต้องเร็ว เพราะเป็น first impression ของผู้ใช้
    'http_req_duration{scenario:browse_anonymous}':    ['p(95)<400'],

    // Returning customer: มี auth overhead ยอมให้ช้าขึ้นนิด
    'http_req_duration{scenario:returning_customer}':  ['p(95)<800'],

    // Checkout burst: ช่วง spike ยอมให้ช้าได้บ้าง แต่ห้ามเกิน 3s
    'http_req_duration{scenario:checkout_burst}':      ['p(95)<3000'],

    // Error rate รวมทุก scenario
    http_req_failed: ['rate<0.05'],

    // Scoped error ต่อ scenario — ถ้าอยากดูแยก
    'http_req_failed{scenario:checkout_burst}': ['rate<0.10'],
  },

};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function handleSummary(data) {
  return summary(data, 'scenario-report.html');
}

/**
 * setup() รันครั้งเดียวก่อน scenario ทั้งหมดเริ่ม
 * return value จะถูกส่งเป็น argument `data` ในทุกฟังก์ชัน
 */
export function setup() {
  var token = login('testuser', 'test1234');
  return { token: token };
}

// ---------------------------------------------------------------------------
// Scenario Functions
// ---------------------------------------------------------------------------

/**
 * Scenario 1: Anonymous Browse
 * พฤติกรรม: เข้า home → ดูรายการสินค้า → search → ดู product detail → ออก
 */
export function browseAnonymous() {
  group('S1: Anonymous Browse', function () {

    // landing — list สินค้าหน้าแรก
    var list = http.get(
      BASE_URL + '/api/products',
      { tags: { endpoint: 'products', scenario: 'browse_anonymous' } }
    );
    check(list, { 's1 products 200': function (r) { return r.status === 200; } });

    sleep(randomBetween(1, 3)); // จำลองการอ่านรายการ

    // search — ลูกค้าพิมพ์ค้นหา
    var keywords = ['nike', 'adidas', 'running', 'jordan', 'slip on'];
    var kw = keywords[Math.floor(Math.random() * keywords.length)];
    var search = http.get(
      BASE_URL + '/api/products?search=' + kw,
      { tags: { endpoint: 'products', scenario: 'browse_anonymous' } }
    );
    check(search, { 's1 search 200': function (r) { return r.status === 200; } });

    sleep(randomBetween(1, 2));

    // product detail — คลิกดูสินค้าที่สนใจ
    var ids = [1, 2, 3, 4, 5];
    var pid = ids[Math.floor(Math.random() * ids.length)];
    var detail = http.get(
      BASE_URL + '/api/products/' + pid,
      { tags: { endpoint: 'products', scenario: 'browse_anonymous' } }
    );
    check(detail, { 's1 detail 200': function (r) { return r.status === 200; } });

    sleep(randomBetween(2, 4)); // อ่านรายละเอียด
  });
}

/**
 * Scenario 2: Authenticated Shopper
 * พฤติกรรม: ดู profile → browse → เพิ่มของลง cart → ดู cart
 * (ไม่ checkout — แค่ browse + add แบบลูกค้า returning)
 */
export function authenticatedShopper(data) {
  group('S2: Authenticated Shopper', function () {

    // ตรวจสอบ session ยังอยู่
    var me = http.get(
      BASE_URL + '/api/auth/me',
      authHeaders(data.token, { endpoint: 'auth', scenario: 'returning_customer' })
    );
    check(me, { 's2 me 200': function (r) { return r.status === 200; } });

    sleep(1);

    // browse categories
    var cats = http.get(
      BASE_URL + '/api/categories',
      { tags: { endpoint: 'products', scenario: 'returning_customer' } }
    );
    check(cats, { 's2 categories 200': function (r) { return r.status === 200; } });

    sleep(randomBetween(1, 2));

    // เลือกดูสินค้า
    var detail = http.get(
      BASE_URL + '/api/products/1',
      { tags: { endpoint: 'products', scenario: 'returning_customer' } }
    );
    check(detail, { 's2 detail 200': function (r) { return r.status === 200; } });

    sleep(randomBetween(1, 3));

    // เพิ่มลง cart (50% ของ iteration เท่านั้น — ไม่ใช่ทุกคนที่ดูแล้วจะซื้อ)
    if (Math.random() < 0.5) {
      var add = http.post(
        BASE_URL + '/api/cart',
        JSON.stringify({ product_id: 1, size: '42', quantity: 1 }),
        authHeaders(data.token, { endpoint: 'cart', scenario: 'returning_customer' })
      );
      check(add, { 's2 add cart 200': function (r) { return r.status === 200; } });

      sleep(1);

      // ดู cart หลังเพิ่ม
      var cart = http.get(
        BASE_URL + '/api/cart',
        authHeaders(data.token, { endpoint: 'cart', scenario: 'returning_customer' })
      );
      check(cart, { 's2 cart 200': function (r) { return r.status === 200; } });
    }

    sleep(randomBetween(2, 4));
  });
}

/**
 * Scenario 3: Checkout Burst (Flash Sale)
 * พฤติกรรม: เข้ามาแล้ว checkout ทันที — จำลองคนที่รอ promo แล้ว rush
 * ใช้ arrival-rate executor → request rate คงที่แม้ response ช้า
 */
export function checkoutFlow(data) {
  group('S3: Checkout Burst', function () {

    // ล้าง cart ก่อน (เพื่อไม่ให้ state พัง)
    http.del(
      BASE_URL + '/api/cart/clear',
      null,
      authHeaders(data.token, { endpoint: 'cart', scenario: 'checkout_burst' })
    );

    // เพิ่มสินค้า
    var add = http.post(
      BASE_URL + '/api/cart',
      JSON.stringify({ product_id: 1, size: '42', quantity: 1 }),
      authHeaders(data.token, { endpoint: 'cart', scenario: 'checkout_burst' })
    );
    check(add, { 's3 add cart 200': function (r) { return r.status === 200; } });

    // checkout ทันที — ไม่รอ
    var order = http.post(
      BASE_URL + '/api/orders',
      JSON.stringify({
        shipping_name:    'Burst User',
        shipping_address: '99 Flash Rd',
        shipping_city:    'Bangkok',
        shipping_postal:  '10110',
        shipping_phone:   '081-999-0000',
        payment_method:   'credit_card',
      }),
      authHeaders(data.token, { endpoint: 'orders', scenario: 'checkout_burst' })
    );
    check(order, { 's3 order 200': function (r) { return r.status === 200; } });

    // arrival-rate executor ไม่ต้องการ sleep — rate ถูกควบคุมจาก executor
    // แต่ใส่นิดหน่อยเพื่อจำลอง network latency จริง
    sleep(0.2);
  });
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
