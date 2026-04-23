/**
 * Transaction-Based Performance Test — ShoesHub
 *
 * แนวคิด: จำลอง "user journey" ที่ API รันต่อกันเป็นลำดับ
 * เทียบกับ JMeter:
 *
 *   JMeter                          k6
 *   ──────────────────────────────────────────────────────
 *   Transaction Controller      →   group() / custom Trend
 *   Sampler                     →   http.get() / http.post()
 *   Assertion                   →   check()
 *   Pre/Post Processor          →   code ก่อน/หลัง request
 *   Extract response (RegEx)    →   res.json('field')
 *   If Controller               →   if/else ธรรมดา
 *   While Controller            →   while loop ธรรมดา
 *
 * ใน k6 request วิ่ง sequential โดย default — ไม่ต้องตั้งค่าพิเศษ
 * response ของ step หนึ่งส่งต่อ step ถัดไปได้เลยผ่าน JS variable
 */

import http from 'k6/http';
import { check, group, sleep, fail } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';
import { login, authHeaders, BASE_URL } from './helpers/auth.js';
import { summary } from './helpers/report.js';

// ---------------------------------------------------------------------------
// Custom Metrics — สร้างเพื่อวัด end-to-end transaction time
// ---------------------------------------------------------------------------
//
// k6 วัด http_req_duration ต่อ request อยู่แล้ว
// แต่ถ้าอยากวัด "ตั้งแต่ login จน order สำเร็จ" เป็น 1 ตัวเลข → ใช้ Trend

// วัดเวลาทั้ง flow "login → browse → cart → order"
var txFullPurchase   = new Trend('tx_full_purchase_ms',   true);

// วัดเฉพาะ "add cart → place order" (checkout portion)
var txCheckoutOnly   = new Trend('tx_checkout_only_ms',   true);

// นับจำนวน transaction ที่สำเร็จ / ล้มเหลว
var txSuccessCounter = new Counter('tx_success');
var txFailCounter    = new Counter('tx_fail');

// อัตรา transaction สำเร็จ (ใช้ใน threshold)
var txSuccessRate    = new Rate('tx_success_rate');

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export var options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 10 },
    { duration: '1m', target: 0  },
  ],
  thresholds: {
    // per-request SLO
    'http_req_duration{endpoint:auth}':     ['p(95)<500'],
    'http_req_duration{endpoint:products}': ['p(95)<300'],
    'http_req_duration{endpoint:cart}':     ['p(95)<400'],
    'http_req_duration{endpoint:orders}':   ['p(95)<1000'],
    'http_req_failed':                      ['rate<0.05'],

    // transaction SLO — end-to-end
    'tx_full_purchase_ms':  ['p(95)<8000'],  // full journey < 8s (p95)
    'tx_checkout_only_ms':  ['p(95)<3000'],  // checkout portion < 3s
    'tx_success_rate':      ['rate>0.90'],   // transaction success > 90%
  },
};

export function handleSummary(data) {
  return summary(data, 'transaction-report.html');
}

// ---------------------------------------------------------------------------
// setup() — รันครั้งเดียวก่อนเริ่ม test ทุก VU
// login ที่นี่ครั้งเดียว แล้วส่ง token ไปให้ทุก VU ผ่าน data
// ป้องกัน VU แต่ละตัว login ซ้ำซึ่งจะ invalidate token ของ VU อื่น
// ---------------------------------------------------------------------------

export function setup() {
  var token      = login('testuser', 'test1234');
  var adminToken = login('admin',    'admin1234');
  return { token: token, adminToken: adminToken };
}

export function teardown(data) {
  var res = http.del(
    BASE_URL + '/api/admin/orders/cleanup',
    JSON.stringify({ shipping_name_prefix: 'PERF_TX_' }),
    authHeaders(data.adminToken)
  );
  if (res.status === 200) {
    var deleted = res.json('deleted') || '?';
    console.log('[teardown] Deleted ' + deleted + ' PERF_TX_ orders.');
  } else {
    console.log('[teardown] Cleanup skipped (HTTP ' + res.status + '). ' +
                'Run manually: DELETE FROM orders WHERE shipping_name LIKE \'PERF_TX_%\'');
  }
}

// ---------------------------------------------------------------------------
// Default Function — เรียก transaction แต่ละแบบตาม user type
// data.token มาจาก setup() — ใช้ร่วมกันทุก VU
// ---------------------------------------------------------------------------

export default function (data) {

  // สุ่มแบ่ง traffic ตามพฤติกรรมจริง
  var rand = Math.random();

  if (rand < 0.60) {
    // 60% — browse แล้วออก (window shopper)
    txBrowseOnly();
  } else if (rand < 0.85) {
    // 25% — login + เพิ่ม cart แต่ไม่ checkout (cart abandonment)
    txAddToCartOnly(data.token);
  } else {
    // 15% — full purchase flow
    txFullPurchaseFlow(data.token);
  }
}

// ---------------------------------------------------------------------------
// Transaction 1: Browse Only
// ไม่ login — แค่ดูสินค้า
// เทียบ JMeter: Transaction Controller "Browse Flow"
// ---------------------------------------------------------------------------

function txBrowseOnly() {
  group('TX Browse Only', function () {

    // Step 1: List products
    var list = http.get(
      BASE_URL + '/api/products',
      { tags: { endpoint: 'products', tx: 'browse' } }
    );
    if (!check(list, { 'list 200': function (r) { return r.status === 200; } })) {
      return; // abort transaction — เหมือน JMeter "Stop Thread on Error"
    }

    sleep(randomBetween(1, 3)); // think time

    // Step 2: Search — ข้อมูลจาก Step 1 ไม่จำเป็น แต่แสดงให้เห็น pattern
    var search = http.get(
      BASE_URL + '/api/products?search=nike&sort=price_asc',
      { tags: { endpoint: 'products', tx: 'browse' } }
    );
    check(search, { 'search 200': function (r) { return r.status === 200; } });

    sleep(randomBetween(1, 2));

    // Step 3: Product detail — ใช้ product id จาก list response
    //   ดึง items array ออกมา แล้วสุ่มเลือก 1 ตัว
    var items = list.json('items');
    var pid   = (items && items.length > 0)
                  ? items[Math.floor(Math.random() * items.length)].id
                  : 1; // fallback

    var detail = http.get(
      BASE_URL + '/api/products/' + pid,
      { tags: { endpoint: 'products', tx: 'browse' } }
    );
    check(detail, { 'detail 200': function (r) { return r.status === 200; } });

    sleep(randomBetween(2, 4));
  });
}

// ---------------------------------------------------------------------------
// Transaction 2: Add To Cart (No Checkout)
// login → browse → add cart → ออก (cart abandonment)
// เทียบ JMeter: Transaction Controller "Add Cart Flow"
// ---------------------------------------------------------------------------

function txAddToCartOnly(token) {
  group('TX Add Cart Only', function () {

    // ── Step 1: Browse ───────────────────────────────────────────────────
    var list = http.get(
      BASE_URL + '/api/products',
      { tags: { endpoint: 'products', tx: 'add_cart' } }
    );
    check(list, { 'list 200': function (r) { return r.status === 200; } });

    sleep(randomBetween(2, 4));

    // ── Step 2: Add to Cart ──────────────────────────────────────────────
    // token มาจาก setup() — login ครั้งเดียวก่อนรัน ไม่ invalidate VU อื่น
    var add = http.post(
      BASE_URL + '/api/cart',
      JSON.stringify({ product_id: 1, size: '42', quantity: 1 }),
      authHeaders(token, { endpoint: 'cart', tx: 'add_cart' })
    );
    check(add, { 'add cart 200': function (r) { return r.status === 200; } });

    sleep(randomBetween(3, 8)); // คิดอยู่นาน... แล้วก็ปิด tab
    // ไม่ checkout — cart abandonment
  });
}

// ---------------------------------------------------------------------------
// Transaction 3: Full Purchase Flow
// login → browse → add cart → checkout → confirm order
// เทียบ JMeter: Transaction Controller ครอบทุก sampler ตั้งแต่ต้นจนจบ
// ---------------------------------------------------------------------------

function txFullPurchaseFlow(token) {
  var txStart = Date.now(); // จับเวลาเริ่ม transaction

  group('TX Full Purchase Flow', function () {

    // ── Step 1: Browse Products ──────────────────────────────────────────
    // token มาจาก setup() แล้ว — ข้ามขั้นตอน login ในที่นี้
    var list = http.get(
      BASE_URL + '/api/products',
      { tags: { endpoint: 'products', tx: 'full_purchase' } }
    );
    check(list, { 'list 200': function (r) { return r.status === 200; } });

    sleep(randomBetween(1, 3));

    // ── Step 2: View Product Detail ──────────────────────────────────────
    var detail = http.get(
      BASE_URL + '/api/products/1',
      { tags: { endpoint: 'products', tx: 'full_purchase' } }
    );
    check(detail, { 'detail 200': function (r) { return r.status === 200; } });

    sleep(randomBetween(1, 2));

    // ── Step 3: Clear Cart (เคลียร์ก่อนเพื่อไม่ให้ค้าง) ─────────────────
    http.del(
      BASE_URL + '/api/cart/clear',
      null,
      authHeaders(token, { endpoint: 'cart', tx: 'full_purchase' })
    );

    // ── Step 4: Add to Cart ──────────────────────────────────────────────
    var add = http.post(
      BASE_URL + '/api/cart',
      JSON.stringify({ product_id: 1, size: '42', quantity: 1 }),
      authHeaders(token, { endpoint: 'cart', tx: 'full_purchase' })
    );
    if (!check(add, { 'add cart 200': function (r) { return r.status === 200; } })) {
      txFailCounter.add(1);
      txSuccessRate.add(false);
      return; // สินค้าอาจหมด — หยุด transaction นี้
    }

    sleep(randomBetween(1, 2)); // กรอก shipping info

    // ── Step 5: Place Order ──────────────────────────────────────────────
    var checkoutStart = Date.now(); // จับเวลาเฉพาะ checkout portion

    var order = http.post(
      BASE_URL + '/api/orders',
      JSON.stringify({
        shipping_name:    'PERF_TX_VU' + __VU,
        shipping_address: '1 Test Road',
        shipping_city:    'Bangkok',
        shipping_postal:  '10110',
        shipping_phone:   '081-000-0001',
        payment_method:   'credit_card',
      }),
      authHeaders(token, { endpoint: 'orders', tx: 'full_purchase' })
    );
    var orderOk = check(order, { 'order 200': function (r) { return r.status === 200; } });


    txCheckoutOnly.add(Date.now() - checkoutStart); // บันทึก checkout time

    if (!orderOk) {
      txFailCounter.add(1);
      txSuccessRate.add(false);
      return;
    }

    // ── Step 6: Confirm — ดึง order detail ด้วย order id ที่ได้จาก step 5 ─
    // ใน JMeter ต้องใช้ JSON Extractor — ใน k6 ใช้ .json('id') ได้เลย
    var orderId = order.json('id');

    if (orderId) {
      var confirm = http.get(
        BASE_URL + '/api/orders/' + orderId,
        authHeaders(token, { endpoint: 'orders', tx: 'full_purchase' })
      );
      check(confirm, {
        'confirm 200':              function (r) { return r.status === 200; },
        'order id matches':         function (r) { return r.json('id') === orderId; },
        'status is pending/placed': function (r) {
          var s = r.json('status');
          return s === 'pending' || s === 'placed' || s === 'confirmed';
        },
      });
    }

    // ── Transaction สำเร็จ — บันทึก metrics ──────────────────────────────
    txFullPurchase.add(Date.now() - txStart);
    txSuccessCounter.add(1);
    txSuccessRate.add(true);

    sleep(1);
  });
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
