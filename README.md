# ShoesHub E2E Test Suite

Playwright E2E + API tests สำหรับ [ShoesHub](http://localhost:8000) — ครอบคลุม Authentication, Cart, Checkout, Products, Orders และ Admin พร้อม k6 Performance Testing

---

## Requirements

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| k6 | 0.49+ (สำหรับ performance test) |

---

## Installation

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. ติดตั้ง Playwright browsers
npx playwright install chromium
```

### ติดตั้ง k6 (สำหรับ performance test)

```bash
# macOS
brew install k6

# Windows (Chocolatey)
choco install k6

# Linux (Debian/Ubuntu)
sudo gpg --no-default-keyring \
  --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

---

## VSCode Extensions

Extensions ที่ติดตั้งอยู่และใช้งานกับโปรเจคนี้:

| Extension | Version | ใช้ทำอะไร |
|-----------|---------|-----------|
| [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) `ms-playwright.playwright` | 1.1.17 | รัน/debug test จาก sidebar, record test ด้วย Codegen, pick locator บน browser |
| [GitHub Actions](https://marketplace.visualstudio.com/items?itemName=github.vscode-github-actions) `github.vscode-github-actions` | 0.31.5 | ดู workflow run, trigger manual run, validate syntax ใน `.github/workflows/` |
| [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) `eamodio.gitlens` | 17.12.2 | Git blame inline, ดู commit history, เปรียบเทียบ branch |
| [YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) `redhat.vscode-yaml` | 1.22.0 | Syntax validation และ autocomplete สำหรับ `playwright.yml` |
| [Bruno](https://marketplace.visualstudio.com/items?itemName=bruno-api-client.bruno) `bruno-api-client.bruno` | 5.0.0 | REST API client สำหรับทดสอบ endpoint ใน `http://localhost:8000/docs` ก่อนเขียน test |
| [Cucumber](https://marketplace.visualstudio.com/items?itemName=cucumberopen.cucumber-official) `cucumberopen.cucumber-official` | 1.11.0 | Syntax highlighting สำหรับ BDD feature files (ถ้าขยายไปใช้ Gherkin ในอนาคต) |
| [Rainbow CSV](https://marketplace.visualstudio.com/items?itemName=mechatroner.rainbow-csv) `mechatroner.rainbow-csv` | 3.24.1 | แสดงสี column ใน CSV สำหรับดู export test data |

### ติดตั้งทีเดียวทุกตัว

```bash
code --install-extension ms-playwright.playwright
code --install-extension github.vscode-github-actions
code --install-extension eamodio.gitlens
code --install-extension redhat.vscode-yaml
code --install-extension bruno-api-client.bruno
code --install-extension cucumberopen.cucumber-official
code --install-extension mechatroner.rainbow-csv
```

### แนะนำให้ติดตั้งเพิ่ม

Extensions ด้านล่างยังไม่ได้ติดตั้ง แต่ช่วยเพิ่มประสิทธิภาพการเขียน test script อย่างมีนัยสำคัญ:

| Extension | ใช้ทำอะไร | ทำไมถึงจำเป็น |
|-----------|-----------|--------------|
| [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) `dbaeumer.vscode-eslint` | Lint TypeScript แบบ real-time | จับ error เช่น unused import, `await` ที่ลืมใส่ ก่อนรัน test |
| [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) `esbenp.prettier-vscode` | Auto-format เมื่อ save | รักษา code style ให้สม่ำเสมอทั้งทีม โดยไม่ต้องแก้มือ |
| [Error Lens](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens) `usernamehw.errorlens` | แสดง TypeScript error inline ทันที | เห็น error ตรงบรรทัดโดยไม่ต้อง hover หรือดู Problems panel |
| [Path Intellisense](https://marketplace.visualstudio.com/items?itemName=christian-kohler.path-intellisense) `christian-kohler.path-intellisense` | Autocomplete path ใน import | ป้องกัน import path ผิด เช่น `../../utils/excelReader` |
| [DotENV](https://marketplace.visualstudio.com/items?itemName=mikestead.dotenv) `mikestead.dotenv` | Syntax highlight ไฟล์ `.env` | อ่าน env config เช่น `BASE_URL` ได้ง่ายขึ้น |

```bash
# ติดตั้งทั้ง 5 ตัวในคำสั่งเดียว
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension usernamehw.errorlens
code --install-extension christian-kohler.path-intellisense
code --install-extension mikestead.dotenv
```

---

## Project Structure

```
testweb-e2e/
├── .github/
│   └── workflows/
│       └── playwright.yml          # CI/CD pipeline (E2E + k6 smoke)
├── docs/
│   └── ShoesHub_Test_Cases.xlsx   # Test cases, test data, environments (source of truth)
├── fixtures/
│   └── auth.fixture.ts            # Shared login fixtures (userPage, adminPage)
├── k6/
│   ├── helpers/
│   │   ├── auth.js                # k6 login helper + bearer header
│   │   └── report.js              # HTML + text summary generator
│   ├── reports/                   # HTML reports (gitignored — generated at runtime)
│   ├── smoke.js                   # 2 VU, 1m — ตรวจสอบ critical flows
│   ├── load.js                    # ramp 0→50 VU, 8m — normal traffic
│   └── stress.js                  # ramp 0→200 VU, 10m — หา breaking point
├── pages/
│   ├── LoginPage.ts               # Page Object Model สำหรับหน้า login
│   └── CartPage.ts                # Page Object Model สำหรับหน้า cart
├── tests/
│   ├── api/                       # API tests (Playwright APIRequestContext)
│   │   ├── auth.api.spec.ts       # POST /api/auth/login, GET /api/auth/me
│   │   ├── products.api.spec.ts   # GET /api/products, /api/products/:id
│   │   ├── cart.api.spec.ts       # POST/GET/DELETE /api/cart
│   │   ├── orders.api.spec.ts     # POST /api/orders, GET /api/orders/:id
│   │   └── admin.api.spec.ts      # Admin endpoints (requires admin token)
│   ├── auth/                      # E2E authentication tests
│   │   └── TC_AUTH_001_login_success.spec.ts
│   └── cart/                      # E2E cart tests
│       └── TC_CART_001_add_to_cart.spec.ts
├── utils/
│   ├── excelReader.ts             # อ่านข้อมูลจาก xlsx (test cases, data, environments)
│   └── apiClient.ts               # API helper — loginAs(), bearer()
└── playwright.config.ts
```

---

## Running Tests

### รันทุก test

```bash
npm test
```

### รันแบบมี browser แสดง

```bash
npm run test:headed
```

### รันผ่าน Playwright UI (interactive)

```bash
npm run test:ui
```

### รันแบบ debug (step-by-step)

```bash
npm run test:debug
```

### รัน test เฉพาะ module

```bash
# E2E tests
npx playwright test tests/auth/
npx playwright test tests/cart/

# API tests
npx playwright test tests/api/
npx playwright test tests/api/auth.api.spec.ts
```

### กรองด้วย tag

```bash
npx playwright test --grep "TC_AUTH_001"
```

---

## Environments

ค่า default คือ `http://localhost:8000` (ต้องรัน ShoesHub server ก่อน)

```bash
# QA
npm run test:qa

# Staging
npm run test:staging

# Production
npm run test:prod

# กำหนด URL เอง
BASE_URL=http://localhost:3000 npx playwright test
```

---

## Test Data (xlsx)

Test data ทั้งหมดอยู่ใน `docs/ShoesHub_Test_Cases.xlsx` มี 3 sheet ที่ใช้ใน automation:

| Sheet | เนื้อหา |
|-------|---------|
| Test Cases | รายการ test case 78 รายการพร้อม steps, priority, expected result |
| Test Data | Input data เช่น username, password, email |
| Environments | Config URL และ credentials ต่อ environment |

### ใช้งาน excelReader ใน test

```ts
import { getTestData, getTestCases, getCredentials, getEnvironment } from '../../utils/excelReader';

// ดึง credentials ตาม TC Reference
const { username, password } = getCredentials('TC-AUTH-05');

// ดึง test data ทั้งหมด
const allData = getTestData();

// กรอง test cases เฉพาะ P0
const smokeCases = getTestCases({ Priority: 'P0' });

// ดึง config ของ environment
const qa = getEnvironment('QA');
console.log(qa['Base URL']); // https://shoeshub-qa.onrender.com
```

### Title format ใน E2E tests

Test name จะแสดง TC ID และ Priority จาก xlsx ให้เห็นใน report:

```
[TC-AUTH-05][P0] เข้าสู่ระบบสำเร็จด้วย valid credentials
```

---

## Fixtures

`fixtures/auth.fixture.ts` เตรียม browser session ที่ login อยู่แล้วให้ใช้ใน test ได้เลย

```ts
import { test, expect } from '../../fixtures/auth.fixture';

// userPage — login เป็น testuser (TC-AUTH-05 จาก xlsx)
test('example', async ({ userPage }) => {
  await userPage.goto('/products.html');
});

// adminPage — login เป็น admin (TC-AUTH-06 จาก xlsx)
test('admin example', async ({ adminPage }) => {
  await adminPage.goto('/admin.html');
});
```

---

## Reports

### Playwright HTML Report

```bash
# เปิด HTML report หลังรัน test
npm run report
```

Report อยู่ที่ `playwright-report/index.html` — แสดง test name พร้อม `[TC_ID][Priority]`, steps BDD, screenshot เมื่อ fail

### k6 Performance Report

HTML report จะถูกสร้างอัตโนมัติหลังรัน k6 script ใดก็ตาม:

| Script | Output |
|--------|--------|
| `perf:smoke` | `k6/reports/smoke-report.html` |
| `perf:load` | `k6/reports/load-report.html` |
| `perf:stress` | `k6/reports/stress-report.html` |

```bash
# เปิด report หลังรัน smoke
start k6/reports/smoke-report.html       # Windows
open k6/reports/smoke-report.html        # macOS
```

> รายงาน k6 อยู่ใน `k6/reports/` ซึ่ง gitignore ไว้ — ไม่ถูก commit ขึ้น repo  
> บน CI/CD รายงานจะถูก upload เป็น GitHub Actions artifact อัตโนมัติ

---

## Performance Testing (k6)

### โครงสร้าง

```
k6/
├── helpers/
│   ├── auth.js        # login() + authHeaders() + BASE_URL
│   └── report.js      # summary() → HTML + stdout text
├── smoke.js           # 2 VU, 1m — ตรวจสอบ critical flows ทุกตัว
├── load.js            # ramp 0→50 VU, 8m — normal traffic simulation
├── stress.js          # ramp 0→200 VU, 10m — หา breaking point
└── scenarios.js       # Scenario-based: 3 กลุ่มผู้ใช้รันพร้อมกัน
```

### SLO (Thresholds)

| Endpoint group | Metric | Smoke / Load | Stress |
|---------------|--------|-------------|--------|
| auth | p(95) response time | < 500ms | < 3000ms |
| products | p(95) response time | < 300ms | < 2000ms |
| cart | p(95) response time | < 400ms | < 2000ms |
| orders | p(95) response time | < 1000ms | — |
| ทุก endpoint | error rate | < 1% | < 10% |

### รัน performance test

```bash
# Smoke — รันก่อน load/stress เสมอ (1 นาที)
npm run perf:smoke

# Load — normal traffic 50 VU (8 นาที)
npm run perf:load

# Stress — หา breaking point 200 VU (10 นาที)
npm run perf:stress

# Scenario-based — 3 กลุ่มผู้ใช้รันพร้อมกัน (~9 นาที)
npm run perf:scenario

# Smoke บน QA environment
npm run perf:smoke:qa

# กำหนด BASE_URL เอง
BASE_URL=https://shoeshub-staging.onrender.com k6 run k6/load.js
```

> **หมายเหตุ:** อย่ารัน load/stress บน production — ใช้ DEV หรือ staging เท่านั้น

---

## Scenario-Based Testing

`k6/scenarios.js` จำลองพฤติกรรมผู้ใช้หลายกลุ่มที่รันพร้อมกัน แทนที่จะ ramp VU เป็นตัวเลขเดียว

### Timeline

```
0m ──────────────────────────────────── 9m
│
├─ [browse_anonymous]    0m ──────────── 9m   ramping-vus (0→40→40→0)
├─ [returning_customer]      1m ──────── 9m   constant-vus (15 VU)
└─ [checkout_burst]              4m ── 7m     ramping-arrival-rate (spike)
```

### Executor Types

| Executor | ควบคุม | เหมาะกับ |
|----------|--------|----------|
| `ramping-vus` | จำนวน VU (คน) | Traffic ที่ค่อย ๆ เพิ่มแบบปกติ |
| `constant-vus` | จำนวน VU คงที่ | Steady-state load ของกลุ่มผู้ใช้ที่ active |
| `ramping-arrival-rate` | Request/วินาที (RPS) | Flash sale, spike event — rate คงที่แม้ backend ช้า |

### Scenario Functions

| Function | Scenario | พฤติกรรม |
|----------|----------|----------|
| `browseAnonymous` | `browse_anonymous` | List → Search → Product detail (ไม่ login) |
| `authenticatedShopper` | `returning_customer` | Me → Categories → Detail → Add cart (50%) |
| `checkoutFlow` | `checkout_burst` | Clear → Add → Place order ทันที |

### Thresholds แยกต่อ Scenario

```js
'http_req_duration{scenario:browse_anonymous}':   ['p(95)<400'],   // เร็วสุด
'http_req_duration{scenario:returning_customer}': ['p(95)<800'],   // มี auth overhead
'http_req_duration{scenario:checkout_burst}':     ['p(95)<3000'],  // ยืดหยุ่นในช่วง spike
'http_req_failed{scenario:checkout_burst}':       ['rate<0.10'],   // error budget สูงกว่า
```

---

## CI/CD (GitHub Actions)

Pipeline มี 2 job ที่รันต่อกัน:

```
push / PR to main
       │
       ▼
  [test] E2E + API Tests (Playwright)
  → upload playwright-report/ artifact
       │
       ▼ (needs: test)
  [k6-smoke] Smoke Performance Test
  → upload k6/reports/ artifact
```

### Trigger manual run

ไปที่ **Actions → Playwright E2E Tests → Run workflow** เลือก environment: `qa` / `staging` / `prod`

### Artifacts

| Artifact | เนื้อหา | เก็บ |
|----------|---------|------|
| `playwright-report-{env}-{run}` | Playwright HTML report | 30 วัน |
| `k6-smoke-report-{env}-{run}` | k6 HTML report | 30 วัน |

---

## Seed Accounts

| Role | Username | Password |
|------|----------|----------|
| User | `testuser` | `test1234` |
| Admin | `admin` | `admin1234` |

> Credentials เหล่านี้มาจาก sheet Test Data ใน xlsx — อย่าแก้ในโค้ดโดยตรง
