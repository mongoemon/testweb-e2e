import http from 'k6/http';
import { authHeaders, BASE_URL } from './auth.js';

/**
 * restock — set product stock ก่อนรัน performance test
 * เรียกใน setup() เพื่อให้มั่นใจว่าสินค้ามีสต็อกเพียงพอ
 *
 * ใช้ PUT /api/products/:id (admin only)
 * ส่งเฉพาะ field ที่ต้องการ — backend merge กับค่าเดิม
 */
export function restock(adminToken, productId, quantity) {
  var current = http.get(BASE_URL + '/api/products/' + productId);
  if (current.status !== 200) {
    console.log('[admin] restock: product ' + productId + ' not found');
    return false;
  }
  var p = current.json();
  var res = http.put(
    BASE_URL + '/api/products/' + productId,
    JSON.stringify({
      name:     p.name,
      price:    p.price,
      stock:    quantity,
    }),
    authHeaders(adminToken)
  );
  if (res.status === 200) {
    console.log('[admin] restocked product ' + productId + ' → ' + quantity + ' units');
    return true;
  }
  console.log('[admin] restock failed (HTTP ' + res.status + '): ' + res.body.substring(0, 200));
  return false;
}

/**
 * cleanupOrders — ลบ order ที่ shipping_name ขึ้นต้นด้วย prefix
 * เรียกใน teardown() หลัง test จบ
 *
 * ถ้า backend ไม่มี cleanup endpoint → log SQL สำหรับ manual run
 */
export function cleanupOrders(adminToken, prefix) {
  var res = http.del(
    BASE_URL + '/api/admin/orders/cleanup',
    JSON.stringify({ shipping_name_prefix: prefix }),
    authHeaders(adminToken)
  );
  if (res.status === 200) {
    var deleted = res.json('deleted') || '?';
    console.log('[admin] deleted ' + deleted + ' orders with prefix "' + prefix + '"');
  } else {
    console.log('[admin] no cleanup endpoint (HTTP ' + res.status + '). ' +
                'Manual SQL: DELETE FROM orders WHERE shipping_name LIKE \'' + prefix + '%\'');
  }
}
