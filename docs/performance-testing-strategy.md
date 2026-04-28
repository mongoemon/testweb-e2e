# ShoesHub — Performance Testing Strategy
### มุมมอง Senior QA ตามหลัก SDLC

---

## 1. Context Analysis — รู้จัก Application ก่อนออกแบบ Test

ก่อนเลือก test type หรือตั้งตัวเลขใดๆ Senior QA ต้องเข้าใจ **application profile** ก่อนเสมอ เพราะตัวเลขที่ดีสำหรับ blog ต่างจาก e-commerce อย่างสิ้นเชิง

### 1.1 Application Profile

| มิติ | ShoesHub | ผลกระทบต่อ performance test |
|------|----------|---------------------------|
| **ประเภท** | E-commerce (shoes) | มี write-heavy path (cart, order) ไม่ใช่แค่ read |
| **Auth model** | JWT (Bearer token) | ทุก authenticated request มี auth overhead |
| **State ที่ต้อง concern** | Cart, Stock, Order | concurrent write ต้องระวัง race condition |
| **Critical revenue path** | Login → Browse → Cart → Checkout | path นี้ล่าช้าหรือ error = lost revenue |
| **Backend** | FastAPI (Python/async) | async framework — thread model ต่างจาก sync framework |
| **Target env** | localhost → QA → Prod | dev spec ต่ำ ตัวเลขต้องปรับตาม env |

### 1.2 Risk-Based Prioritization

ไม่ใช่ทุก endpoint มีความเสี่ยงเท่ากัน Senior QA จัดลำดับตาม **ความเสี่ยงทางธุรกิจ × ความซับซ้อนทางเทคนิค**:

```
ความเสี่ยงสูง
    │
    │  ████ POST /api/orders    — DB write + stock deduct (atomic)
    │  ████ POST /api/cart      — concurrent shared resource
    │  ███░ POST /api/auth/login — rate-limit sensitive, token invalidation
    │  ██░░ GET /api/products   — high read volume, cacheable
    │  █░░░ GET /api/categories — low change rate
    │
    └─────────────────────────────→ Volume สูง
```

**หลักคิด:** test หนักที่สุดตรง path ที่ถ้าพังแล้วกระทบ revenue และ data integrity มากที่สุด

---

## 2. SDLC Positioning — ทำ Performance Test ตอนไหน

```
Sprint Planning → Dev → Code Review → QA (Functional) → Performance → Staging → Release
                                                              ↑
                                                         จุดนี้คือที่ทำ
```

### 2.1 Gate ต่อ Phase

| Phase | Test ที่รัน | เป้าหมาย |
|-------|------------|---------|
| **Per Commit / PR** | Smoke (2 VU, 1m) | ยืนยัน critical flow ไม่แตก — รัน < 2 นาที |
| **Per Sprint Release** | Load (50 VU, 8m) | ยืนยัน normal traffic ยังอยู่ใน SLO |
| **Pre-Release / RC** | Stress + Scenario | หา breaking point ก่อน deploy prod |
| **ก่อน Flash Sale / Event** | Checkout Burst scenario | ทดสอบ spike ที่รู้ล่วงหน้า |
| **Ad-hoc (ถ้ามี perf regression)** | Transaction-based | isolate ว่า bottleneck อยู่ step ไหน |

### 2.2 Environment Rule

```
DEV  → Smoke เท่านั้น       (spec ต่ำ ตัวเลขไม่ representative)
QA   → Smoke + Load          (spec ใกล้เคียง prod — baseline ที่ใช้ได้)
STG  → ทุก type รวม Stress   (clone of prod — ตัวเลขเชื่อถือได้)
PROD → Smoke เท่านั้น        (ห้ามรัน load/stress บน production เด็ดขาด)
```

---

## 3. Test Type Selection — เลือกอะไรและทำไม

### 3.1 Smoke Test (`k6/smoke.js`)

**คำถามที่ตอบ:** "ระบบยังทำงานได้ไหม ก่อนที่จะลงทุนรัน test ใหญ่?"

**ทำไมต้องมี:**
- เป็น **sanity gate** — ถ้า smoke ไม่ผ่านหมายความว่า deploy ล่าสุดทำให้ basic flow พัง ไม่ควรรัน load/stress ต่อ
- ใช้ resource น้อย (2 VU, 1 นาที) — รัน CI ได้ทุก push โดยไม่เปลืองเวลา
- ตรวจ **regression** ได้เร็วที่สุด

**Coverage:**
```
VU 1: Products list → Product detail → Auth/me → Clear cart → Add cart → Place order
VU 2: Products list → Product detail → Auth/me   (ไม่ทำ cart — ป้องกัน shared-cart race)
```

**ทำไม VU 1 เท่านั้นที่ทำ cart→order:**
Cart ของ `testuser` เป็น shared state ระหว่าง VU ทั้งหมดที่ใช้ token เดียวกัน ถ้าทั้ง VU 1 และ VU 2 เพิ่ม cart พร้อมกัน จะเกิด race condition ทำให้ quantity ไม่ predictable และผล test ไม่ deterministic

---

### 3.2 Load Test (`k6/load.js`)

**คำถามที่ตอบ:** "ระบบรับ traffic ปกติในวันธรรมดาได้ไหม? SLO ยังอยู่ครบไหม?"

**ทำไมต้องมี:**
- ยืนยัน **baseline performance** ที่ acceptable สำหรับ user ทั่วไป
- จับ degradation ที่เกิดขึ้นช้าๆ เช่น memory leak, connection pool exhaustion ภายใต้ sustained load
- ใช้เป็น **reference point** เปรียบเทียบก่อน/หลัง deploy

**Workload Design (50 VU — ที่มาของตัวเลข):**

```
Concurrent Users จริง = Active Sessions × Request Frequency

สมมติ:
  - ShoesHub เป็น SME e-commerce
  - Peak hour: 500 concurrent visitors
  - แต่ละ visitor ทำ request ทุก ~10 วินาที (browse + think time)
  - Effective concurrent load = 500 × (avg_request_time / think_time)
                              ≈ 500 × (0.3s / 10s) ≈ 15 VU "active"

50 VU = ~3.3x peak estimate → เป็น "comfortable headroom" สำหรับ e-commerce ขนาดกลาง
```

**Stage Rationale:**

```
[0→50 VU ใน 2m]  Ramp-up: ให้ระบบ warm up — connection pool, JIT compilation, cache warm
[50 VU คงที่ 5m]  Sustain: วัด steady-state performance จริง (ไม่ใช่ spike artifact)
[50→0 VU ใน 1m]  Ramp-down: ดู resource cleanup — ถ้า error rate ขึ้นตอน ramp-down แสดงว่า connection ไม่ได้ release
```

ถ้า ramp-up สั้นเกินไป (เช่น 10 วินาที) จะเห็น spike ที่ไม่ represent ความเป็นจริง เพราะ server ยังไม่ warm

---

### 3.3 Stress Test (`k6/stress.js`)

**คำถามที่ตอบ:** "ระบบ break ที่ load เท่าไร? หลังจาก break แล้ว recover กลับมาได้ไหม?"

**ทำไมต้องมี:**
- รู้ **capacity limit** ก่อนที่ user จริงจะเจอ
- ป้องกันการ over-provision (จ่ายค่า server แพงเกินจำเป็น) หรือ under-provision (ระบบล่มตอน traffic จริงมา)
- ใช้วางแผน **auto-scaling trigger** — ถ้ารู้ว่า break ที่ 150 VU ก็ตั้ง scale-out ที่ 100 VU

**Workload Design (50→100→150→200 VU — ที่มาของตัวเลข):**

```
50 VU  = load test level (baseline — ต้องผ่านแน่นอน)
100 VU = 2x load (ทดสอบ headroom)
150 VU = 3x load (significant stress)
200 VU = 4x load (ค้นหา breaking point)

ทำไม step ละ 2m:
  - น้อยกว่านี้ → ระบบไม่มีเวลา stabilize ที่ load ใหม่ ตัวเลขไม่ accurate
  - มากกว่านี้ → เสียเวลา + เสี่ยง resource exhaustion แบบสะสม
```

**สิ่งที่ดูระหว่าง stress test:**
- **Knee point:** จุดที่ response time เริ่ม exponential (ไม่ใช่ linear) — นี่คือ capacity limit จริง
- **Degradation pattern:** error เริ่มที่ VU เท่าไร (timeout? 5xx? connection refused?)
- **Recovery:** หลัง ramp-down กลับ 0 VU แล้ว error rate กลับมา 0% ไหม — ถ้าไม่ = resource leak

**Threshold ผ่อนปรนกว่า load test:**
```javascript
http_req_failed: ['rate<0.10']  // ยอม 10% error (stress คือการหา limit ไม่ใช่วัด SLO)
p(95) products < 2000ms         // ยอม 2s แทน 300ms
```

---

### 3.4 Scenario-Based Test (`k6/scenarios.js`)

**คำถามที่ตอบ:** "เมื่อผู้ใช้หลายกลุ่มทำพฤติกรรมต่างกันพร้อมกัน ระบบจัดการได้ไหม?"

**ทำไมต้องมี:**
- Load/Stress test ทุก VU ทำ **action เดียวกัน** — ไม่ reflect ความจริงที่ผู้ใช้มีหลาย pattern
- Scenario test จำลอง **traffic mix** ที่สมจริงกว่า:
  - 60-70% browse โดยไม่ login
  - 20-30% login แล้ว browse/add cart
  - 5-10% จนถึง checkout
- เหมาะสำหรับ **pre-release regression** ก่อน event สำคัญ

**3 Scenarios ที่เลือก:**

```
browse_anonymous   (ramping-vus 0→40):  จำลองคนทั่วไปดูสินค้า
returning_customer (constant 15 VU):    ลูกค้า returning ที่ login
checkout_burst     (arrival-rate 1→20): flash sale — คน checkout พร้อมกัน
```

**ทำไม checkout_burst ใช้ arrival-rate executor:**

VU-based executor = "จำนวนคนที่กำลังทำงาน" → ถ้า response ช้า request rate จะลด
Arrival-rate executor = "จำนวน request ต่อวินาที" → rate คงที่แม้ server ช้า

Flash sale scenario ที่สมจริงคือ **request rate คงที่** (คนกดพร้อมกัน) ไม่ใช่รอให้ request ก่อนหน้าเสร็จ นั่นคือสาเหตุที่ต้องใช้ arrival-rate

---

### 3.5 Transaction-Based Test (`k6/transactions.js`)

**คำถามที่ตอบ:** "User journey ทั้งหมด end-to-end ใช้เวลาเท่าไร? bottleneck อยู่ step ไหน?"

**ทำไมต้องมี:**
- HTTP `http_req_duration` วัดแค่ **per-request** — ไม่บอกว่า "login → จนได้ order confirmation" ใช้เวลากี่วินาที
- Custom `Trend` metric วัด **transaction time** แบบ end-to-end ได้
- Traffic mix 60/25/15 reflect พฤติกรรมจริงของ e-commerce:

```
60% Browse Only    = Window shoppers — ดูแล้วไป ไม่ซื้อ
25% Add Cart Only  = Cart abandonment — พบบ่อยมากใน e-commerce (อัตราทั่วไป ~70%)
15% Full Purchase  = จ่ายเงินจริง
```

**Custom Metrics ที่สร้าง:**

| Metric | วัดอะไร | Threshold |
|--------|---------|-----------|
| `tx_full_purchase_ms` | เวลาตั้งแต่เริ่มจนได้ order ID | p(95) < 8,000ms |
| `tx_checkout_only_ms` | เฉพาะขั้นตอน add cart → place order | p(95) < 3,000ms |
| `tx_success_rate` | % transaction ที่สำเร็จ | > 90% |

---

### 3.6 Soak/Endurance Test (ยังไม่ได้ทำ — อธิบายเหตุผล)

**คำถามที่ตอบ:** "ระบบรับ load ต่อเนื่องหลายชั่วโมงโดยไม่ degradation ได้ไหม?"

**ตัวอย่าง config:**
```javascript
stages: [
  { duration: '5m',  target: 30 },  // warm up
  { duration: '4h',  target: 30 },  // sustain ยาว
  { duration: '5m',  target: 0  },  // ramp down
]
```

**เมื่อไรควรเพิ่ม:** เมื่อ application จะ deploy บน production จริงและมีระบบ monitoring พร้อม ใช้จับ memory leak, DB connection leak, file descriptor exhaustion ที่ไม่เห็นใน short test

---

## 4. Workload Configuration — สิ่งที่ต้อง Config

### 4.1 Environment Variables

```bash
# รัน test บน environment ต่างๆ
BASE_URL=http://localhost:8000 k6 run k6/smoke.js
BASE_URL=http://qa.shoeshub.internal k6 run k6/load.js

# ใน k6 script รับค่าด้วย
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
```

**ทำไมต้อง externalise BASE_URL:**
- ไม่ hardcode URL ใน script — รัน environment เดียวกันบน DEV/QA/STG ได้โดยไม่แก้โค้ด
- CI/CD pipeline ส่ง env var ต่างกันได้ตาม branch

### 4.2 Test Data Management Strategy

**ปัญหาหลักใน performance test:** VU หลายสิบตัวที่ทำ cart → order พร้อมกัน ทำให้:
1. **Stock หมด** — `"Only 0 items in stock"` error ตั้งแต่ VU ที่ 2
2. **Order data ค้างใน DB** — ทำให้ test run ถัดไปมี polluted state

**วิธีแก้ที่ใช้:**

```javascript
// setup() — รันครั้งเดียวก่อน VU เริ่ม
export function setup() {
  restock(adminToken, productId=1, quantity=1000);  // ให้มี stock พอสำหรับทุก VU
  return { token, adminToken };
}

// teardown() — รันครั้งเดียวหลัง VU ทุกตัวหยุด
export function teardown(data) {
  cleanupOrders(data.adminToken, 'PERF_SMOKE_');    // ลบ order ที่สร้างจาก test
}
```

**Tag-based cleanup strategy:**
```javascript
// ทุก order ที่สร้างระหว่าง test ใช้ prefix ที่รู้ว่าเป็น test data
shipping_name: 'PERF_SMOKE_testuser'  // smoke.js
shipping_name: 'PERF_TX_VU' + __VU   // transactions.js

// teardown ลบโดย prefix — ไม่กระทบ real data
DELETE FROM orders WHERE shipping_name LIKE 'PERF_%'
```

### 4.3 Threshold Configuration

Threshold คือ **SLO (Service Level Objective)** ที่ผูกกับ test — ถ้า threshold fail = test fail

**หลักคิดในการตั้งค่า:**

```
ตั้งจาก user expectation → ไม่ใช่ตั้งแบบสุ่ม

Auth (500ms p95):
  Login/profile check เป็น operation ที่ user คาดว่าเร็ว
  500ms p95 = 95% ของ request เสร็จใน 0.5s → acceptable

Products (300ms p95):
  Browse list/detail = first impression — ต้องเร็วที่สุด
  Google benchmark: 53% ของ mobile user ออกถ้าหน้าโหลดเกิน 3s
  300ms p95 = conservative target สำหรับ API layer เพียงอย่างเดียว

Cart (400ms p95):
  มี auth overhead + cart lookup → ยอมช้ากว่า products นิด

Orders (1000ms p95):
  Write operation: validate stock + deduct + create order record
  DB transaction หลาย step → 1s เป็น acceptable SLO

Error rate (< 1% load, < 10% stress):
  Load: 1% คือ standard industry SLO สำหรับ availability
  Stress: 10% เป็น "we found the limit" marker ไม่ใช่ "acceptable production value"
```

### 4.4 Tags สำหรับ Scoped Thresholds

```javascript
// Tagged request
http.get(BASE_URL + '/api/products', { tags: { endpoint: 'products' } })

// Threshold ที่ scoped ด้วย tag
thresholds: {
  'http_req_duration{endpoint:products}': ['p(95)<300'],
  'http_req_duration{endpoint:auth}':     ['p(95)<500'],
}
```

**ทำไม tag แทนที่จะ threshold รวม:**
ถ้าใช้ `http_req_duration` รวม — p(95) ของ endpoint เร็ว (products 100ms) จะ "dilute" ค่าของ endpoint ช้า (orders 900ms) ทำให้ไม่เห็น bottleneck ที่ชัดเจน

### 4.5 Report Output

```javascript
export function handleSummary(data) {
  return summary(data, 'smoke-report.html');  // k6/helpers/report.js
}
```

Output แยกต่อ script:
- `k6/reports/smoke-report.html`
- `k6/reports/load-report.html`
- `k6/reports/stress-report.html`

---

## 5. Reading Results — ผลลัพธ์ที่ดีดูอะไร

### 5.1 Metrics ที่ต้องดูทุกครั้ง

```
http_req_duration ............. response time distribution
  - min / avg / med / max
  - p(90) p(95) p(99)        ← สำคัญที่สุด: p(95) ต้องอยู่ใน threshold

http_req_failed ............... error rate
  - rate = จำนวน non-2xx / ทั้งหมด  ← ต้อง < 1% (load) / < 10% (stress)

http_reqs ..................... throughput
  - requests/second          ← ยิ่งสูงยิ่งดี (ภายใต้ acceptable latency)

vus / vus_max ................. concurrent users peak
iterations .................... จำนวนรอบที่ VU รัน
iteration_duration ............ เวลา 1 รอบรวม think time
```

### 5.2 ตัวอย่าง Output ที่ "ผ่าน"

```
✓ http_req_failed..................: 0.12%  ✓ (< 1%)
✓ http_req_duration{endpoint:auth}.: avg=87ms p(95)=312ms  ✓ (< 500ms)
✓ http_req_duration{endpoint:products}: avg=45ms p(95)=189ms  ✓ (< 300ms)
✓ http_req_duration{endpoint:cart}.: avg=93ms p(95)=380ms  ✓ (< 400ms)
✓ http_req_duration{endpoint:orders}: avg=245ms p(95)=780ms  ✓ (< 1000ms)

http_reqs: 12,450  (26.0/s)
```

### 5.3 ตัวอย่าง Output ที่ "ตก" และ Root Cause

```
✗ http_req_failed: 3.21% (> 1%)
  → ดู error type: timeout? 500? 429?
  → 429 = rate limiting hit → ต้องปรับ config หรือ distribute traffic
  → 500 = application error → check server logs, อาจเป็น null pointer หรือ DB error
  → timeout = server ไม่ตอบทัน → อาจ CPU/memory bound หรือ DB slow query

✗ http_req_duration{endpoint:orders}: p(95)=4,230ms (> 1000ms)
  → ดู histogram: เป็น long tail หรือทุก request ช้า?
  → long tail = มี slow DB query บาง request → check query plan, index
  → ทุก request ช้า = DB connection pool exhausted หรือ lock contention
```

### 5.4 Smoke Test — Pass Criteria

| Check | Expected | ถ้า fail |
|-------|---------|---------|
| products list 200 | ✓ | API route พัง / server ไม่ขึ้น |
| product detail 200 | ✓ | product id ไม่มีในระบบ |
| auth/me 200 | ✓ | token invalid / auth middleware พัง |
| add to cart 200 | ✓ | stock หมด / cart logic พัง |
| place order 200 | ✓ | DB write error / validation fail |
| p(95) products < 300ms | ✓ | infrastructure problem หรือ N+1 query |

### 5.5 Load Test — ดูสิ่งเหล่านี้ระหว่าง Sustain Phase

**Response time stability:**
```
Good:   p(95) flat at 200ms ตลอด 5 นาที
Bad:    p(95) ค่อยๆ ขึ้น 200ms → 400ms → 800ms  → memory leak / connection leak
Bad:    spike ที่ minute 3 แล้วกลับมา → GC pause หรือ periodic background task
```

**Error rate pattern:**
```
Good:   rate flat near 0%
Bad:    rate ค่อยๆ ขึ้น → pool exhaustion
Bad:    sudden spike แล้วลง → circuit breaker trigger
```

### 5.6 Stress Test — สิ่งที่ต้องสังเกต

**หา Knee Point:**
```
VU  50:  p(95) = 200ms  (baseline)
VU 100:  p(95) = 350ms  (linear scale — ดี)
VU 150:  p(95) = 800ms  (เริ่ม non-linear — warning zone)
VU 200:  p(95) = 4,200ms  ← knee point — ระบบเริ่ม saturate
```

**Recovery Check:**
```
หลัง ramp-down กลับ 0 VU:
  ✓ Good:   error rate กลับ 0% ใน 30 วินาที — graceful recovery
  ✗ Bad:    error rate ยังสูงอยู่ 5 นาทีหลัง ramp-down — resource stuck
  ✗ Worst:  server ต้อง restart เพื่อกลับมา — เจอ deadlock หรือ OOM
```

### 5.7 Transaction Metrics — อ่านอย่างไร

```
tx_full_purchase_ms p(95) = 3,200ms  ✓ (< 8,000ms)
tx_checkout_only_ms p(95) = 1,800ms  ✓ (< 3,000ms)
tx_success_rate = 94.2%              ✓ (> 90%)
tx_fail counter = 14

ถ้า tx_fail สูงแต่ http_req_failed ต่ำ:
  → HTTP level succeed (200) แต่ business logic fail
  → เช่น: stock หมด (200 with error body), order ซ้ำ, validation fail
  → ต้องอ่าน response body ไม่ใช่แค่ status code
```

---

## 6. Integration กับ SDLC

### 6.1 CI/CD Gate ปัจจุบัน

```yaml
# .github/workflows/playwright.yml
jobs:
  test:       # Playwright E2E + API
  k6-smoke:   # Smoke performance (รันหลัง test ผ่าน)
    needs: test
```

**หลักการ:** Smoke เป็น **blocking gate** — ถ้า smoke fail, pipeline fail, ไม่ deploy

### 6.2 เพิ่ม Load Test Gate (ก่อน deploy to STG)

```yaml
# Recommended addition สำหรับ pre-staging gate
k6-load:
  needs: k6-smoke
  if: github.ref == 'refs/heads/main'  # รันแค่บน main branch
  run: k6 run k6/load.js
  env:
    BASE_URL: ${{ vars.QA_BASE_URL }}
```

### 6.3 Baseline Tracking (สำคัญมาก)

Performance test **ไม่มีความหมาย** ถ้าไม่ track ผลเทียบกับ baseline:

```
Sprint 1 load test:  p(95) products = 145ms, orders = 380ms
Sprint 2 load test:  p(95) products = 148ms, orders = 390ms  ✓ stable
Sprint 3 load test:  p(95) products = 420ms, orders = 1,200ms  ✗ REGRESSION
                                                               ↑ ต้อง investigate sprint 3 changes
```

เครื่องมือที่ช่วย: k6 Cloud, Grafana + InfluxDB, หรือแค่ spreadsheet บันทึก p(95) ต่อ sprint

---

## 7. Quick Reference — สรุปสำหรับใช้งาน

### รันตาม Phase

```bash
# ก่อน commit / PR
npm run perf:smoke

# Sprint review
npm run perf:load

# Pre-release
npm run perf:stress
npm run perf:scenario

# Debug bottleneck
npm run perf:transaction
```

### Decision Tree

```
Smoke fail?
  └─ ใช่ → อย่ารัน test อื่น, fix deploy ก่อน

Load fail (error rate > 1%)?
  └─ ดู error type:
     429 → rate limiting / auth issue
     5xx → application bug → check logs
     timeout → capacity issue → stress test

Load fail (latency > SLO)?
  └─ ดู which endpoint:
     orders ช้า → DB write bottleneck
     products ช้า → cache miss / N+1
     auth ช้า → token validation overhead

Stress knee point ต่ำกว่า 3x load?
  └─ ระบบ scale ได้น้อย → ต้อง optimize ก่อน event

Transaction success rate < 90%?
  └─ ดู tx_fail counter + response body
     ถ้า HTTP 200 แต่ fail → business logic bug ไม่ใช่ performance
```

### SLO Reference Table

| Endpoint | Test Type | p(95) Target | Error Rate |
|---------|-----------|-------------|------------|
| Auth | Smoke/Load | < 500ms | < 1% |
| Auth | Stress | < 3,000ms | < 10% |
| Products | Smoke/Load | < 300ms | < 1% |
| Products | Stress | < 2,000ms | < 10% |
| Cart | Smoke/Load | < 400ms | < 1% |
| Orders | Smoke/Load | < 1,000ms | < 1% |
| Full Purchase TX | Transaction | < 8,000ms (e2e) | < 10% fail rate |
| Checkout TX | Transaction | < 3,000ms | - |
| Anonymous Browse | Scenario | < 400ms | < 5% |
| Returning Customer | Scenario | < 800ms | < 5% |
| Checkout Burst | Scenario | < 3,000ms | < 10% |
