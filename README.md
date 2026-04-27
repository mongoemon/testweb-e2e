# ShoesHub E2E Test Suite

Playwright E2E + API tests สำหรับ [ShoesHub](http://127.0.0.1:8000) — ครอบคลุม Authentication, Cart, Checkout, Products, Orders, Profile, Admin และ i18n พร้อม Allure Report และ k6 Performance Testing

**100 test cases** across 10 modules (E2E + API)

---

## Requirements

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Java | 11+ (สำหรับ Allure CLI) |
| k6 | 0.49+ (สำหรับ performance test) |

> **Windows 11 note:** ใช้ `http://127.0.0.1:8000` เสมอ — `localhost` บน Windows 11 resolve เป็น IPv6 `::1` ซึ่งอาจชี้ไปยัง server ที่ผิด

---

## Installation

```bash
# 1. ติดตั้ง dependencies (รวม allure-playwright และ allure-commandline)
npm install

# 2. ติดตั้ง Playwright browsers
npx playwright install chromium
```

### ติดตั้ง Allure CLI (สำหรับ generate report)

Allure CLI ต้องใช้ Java 11+ และติดตั้งแยกจาก npm:

```bash
# macOS (Homebrew)
brew install allure

# Windows (Scoop)
scoop install allure

# Windows (Chocolatey)
choco install allure

# ตรวจสอบว่าติดตั้งสำเร็จ
allure --version
```

> `allure-playwright` (npm package) และ `allure-commandline` (npm package) ถูกติดตั้งไว้แล้วใน `devDependencies` ใช้งานผ่าน `npx allure` ได้โดยไม่ต้องติดตั้ง global

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
| [Bruno](https://marketplace.visualstudio.com/items?itemName=bruno-api-client.bruno) `bruno-api-client.bruno` | 5.0.0 | REST API client สำหรับทดสอบ endpoint ใน `http://127.0.0.1:8000/docs` ก่อนเขียน test |
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

| Extension | ใช้ทำอะไร | ทำไมถึงจำเป็น |
|-----------|-----------|--------------|
| [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) `dbaeumer.vscode-eslint` | Lint TypeScript แบบ real-time | จับ error เช่น unused import, `await` ที่ลืมใส่ ก่อนรัน test |
| [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) `esbenp.prettier-vscode` | Auto-format เมื่อ save | รักษา code style ให้สม่ำเสมอทั้งทีม โดยไม่ต้องแก้มือ |
| [Error Lens](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens) `usernamehw.errorlens` | แสดง TypeScript error inline ทันที | เห็น error ตรงบรรทัดโดยไม่ต้อง hover หรือดู Problems panel |
| [Path Intellisense](https://marketplace.visualstudio.com/items?itemName=christian-kohler.path-intellisense) `christian-kohler.path-intellisense` | Autocomplete path ใน import | ป้องกัน import path ผิด เช่น `../../utils/excelReader` |
| [DotENV](https://marketplace.visualstudio.com/items?itemName=mikestead.dotenv) `mikestead.dotenv` | Syntax highlight ไฟล์ `.env` | อ่าน env config เช่น `BASE_URL` ได้ง่ายขึ้น |

```bash
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
│       └── playwright.yml              # CI/CD pipeline (E2E + k6 smoke)
├── allure-report/                      # Generated HTML report (gitignored)
├── allure-results/                     # Raw Allure data from test run (gitignored)
├── docs/
│   └── ShoesHub_Test_Cases.xlsx        # Test cases, test data, environments (source of truth)
├── fixtures/
│   └── auth.fixture.ts                 # Shared login fixtures (userPage, adminPage) + Allure auto-annotation
├── globalSetup.ts                      # Restocks test products (id 2, 3) before every run
├── k6/
│   ├── helpers/
│   │   ├── auth.js                     # k6 login helper + bearer header
│   │   └── report.js                   # HTML + text summary generator
│   ├── reports/                        # HTML reports (gitignored)
│   ├── smoke.js                        # 2 VU, 1m
│   ├── load.js                         # ramp 0→50 VU, 8m
│   └── stress.js                       # ramp 0→200 VU, 10m
├── pages/
│   ├── LoginPage.ts
│   └── CartPage.ts
├── tests/
│   ├── api/                            # API tests (Playwright APIRequestContext)
│   │   ├── auth.api.spec.ts
│   │   ├── products.api.spec.ts
│   │   ├── cart.api.spec.ts
│   │   ├── orders.api.spec.ts
│   │   └── admin.api.spec.ts
│   ├── auth/
│   │   ├── TC_AUTH_001_login_success.spec.ts
│   │   ├── TC_AUTH_002_register.spec.ts
│   │   └── TC_AUTH_003_protected_routes.spec.ts
│   ├── home/
│   │   └── TC_HOME_001_homepage.spec.ts
│   ├── products/
│   │   ├── TC_PROD_001_product_list.spec.ts
│   │   └── TC_DETAIL_001_product_detail.spec.ts
│   ├── cart/
│   │   ├── TC_CART_001_add_to_cart.spec.ts
│   │   └── TC_CART_002_cart_management.spec.ts
│   ├── checkout/
│   │   └── TC_CHK_001_checkout.spec.ts
│   ├── orders/
│   │   └── TC_ORD_001_orders.spec.ts
│   ├── profile/
│   │   └── TC_PROF_001_profile.spec.ts
│   ├── admin/
│   │   ├── TC_DASH_001_dashboard.spec.ts
│   │   ├── TC_APROD_001_admin_products.spec.ts
│   │   └── TC_AORD_001_admin_orders.spec.ts
│   ├── i18n/
│   │   └── TC_I18N_001_language.spec.ts
│   └── nav/
│       └── TC_NAV_001_navigation.spec.ts
├── utils/
│   ├── excelReader.ts                  # อ่านข้อมูลจาก xlsx
│   ├── apiClient.ts                    # loginAs(), bearer()
│   └── allure.ts                       # autoAnnotate() — ใส่ TC_ID + severity ใน Allure
└── playwright.config.ts
```

---

## Running Tests

### รันทุก test

```bash
npm test
```

`globalSetup.ts` จะรันก่อนอัตโนมัติ — restock สินค้า id 2 และ 3 เพื่อป้องกัน "หมดสต็อก" จาก test run ก่อนหน้า

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
npx playwright test tests/auth/
npx playwright test tests/cart/
npx playwright test tests/checkout/
npx playwright test tests/profile/
npx playwright test tests/admin/
npx playwright test tests/api/
```

### กรองด้วย grep

```bash
npx playwright test --grep "TC-AUTH"
npx playwright test --grep "P0"
```

---

## Environments

ค่า default คือ `http://127.0.0.1:8000` (ต้องรัน ShoesHub server ก่อน)

```bash
# QA
npm run test:qa

# Staging
npm run test:staging

# Production
npm run test:prod

# กำหนด URL เอง
BASE_URL=http://127.0.0.1:3000 npx playwright test
```

---

## Test Data (xlsx)

Test data ทั้งหมดอยู่ใน `docs/ShoesHub_Test_Cases.xlsx` มี 3 sheet:

| Sheet | เนื้อหา |
|-------|---------|
| Test Cases | รายการ test case พร้อม steps, priority, expected result |
| Test Data | Input data เช่น username, password, email |
| Environments | Config URL และ credentials ต่อ environment |

### ใช้งาน excelReader ใน test

```ts
import { getTestData, getTestCases, getCredentials, getEnvironment } from '../../utils/excelReader';

const { username, password } = getCredentials('TC-AUTH-05');
const smokeCases = getTestCases({ Priority: 'P0' });
const qa = getEnvironment('QA');
```

### Title format

Test name ดึง TC_ID และ Priority จาก xlsx ให้เห็นใน report ทุกตัว:

```
[TC-AUTH-05][P0] เข้าสู่ระบบสำเร็จด้วย valid credentials
[TC-CART-02][P1] ตะกร้ามีสินค้า
```

---

## Fixtures

`fixtures/auth.fixture.ts` เตรียม browser session ที่ login ไว้แล้ว และ **ใส่ TC_ID + severity annotation ใน Allure อัตโนมัติ** จากชื่อ test

```ts
import { test, expect } from '../../fixtures/auth.fixture';

test('example', async ({ userPage }) => {
  await userPage.goto('/products.html');
});

test('admin example', async ({ adminPage }) => {
  await adminPage.goto('/admin.html');
});
```

---

## Global Setup

`globalSetup.ts` รันก่อนทุก test run โดยอัตโนมัติ — login เป็น admin แล้ว restore ข้อมูล seed สินค้าที่ใช้ใน test:

| Product | Name | Brand | Stock |
|---------|------|-------|-------|
| id: 2 | Adidas Ultraboost 23 | Adidas | 999 |
| id: 3 | New Balance 990v6 | New Balance | 999 |

สาเหตุที่ต้องมี: checkout tests ลด stock จริงทุกครั้งที่ place order สำเร็จ — หาก stock เป็น 0 ปุ่ม Add to Cart จะ disabled และ tests ที่เกี่ยวกับสินค้าจะ fail

---

## Reports

### Playwright HTML Report

```bash
npm run report
```

Report อยู่ที่ `playwright-report/index.html` — แสดง test name พร้อม `[TC_ID][Priority]`, steps BDD, screenshot และ video เมื่อ fail

### Allure Report

Allure แสดง dashboard พร้อม trend, severity breakdown, TC_ID label, steps, screenshot และ trace

```bash
# 1. รัน test (สร้าง allure-results/ อัตโนมัติ)
npm test

# 2. Generate HTML report จาก allure-results/
npm run report:allure

# 3. เปิด report ผ่าน HTTP server (ต้อง serve ผ่าน HTTP — เปิด file:// โดยตรงไม่ได้)
npm run report:allure:open
# → เปิดที่ http://localhost:8080

# หรือ generate + open ในคำสั่งเดียว
npm run report:allure:serve
```

> **สำคัญ:** เปิด `allure-report/index.html` โดยตรงด้วย `file://` จะค้างที่หน้า Loading เพราะเบราว์เซอร์บล็อก fetch request — ต้อง serve ผ่าน HTTP เสมอ

#### Allure Labels ที่ใส่อัตโนมัติ

| Label | มาจาก | ตัวอย่าง |
|-------|--------|---------|
| `TC_ID` | title pattern `[TC-XXX-YY]` | `TC-AUTH-05` |
| `severity` | priority `[P0]`–`[P3]` | `blocker` / `critical` / `normal` / `minor` |

ระบบ auto-annotate ผ่าน `utils/allure.ts` → `autoAnnotate()` ซึ่งถูกเรียกใน:
- `fixtures/auth.fixture.ts` — ครอบคลุม tests ที่ใช้ `userPage` / `adminPage`
- `test.beforeEach()` ใน spec files ที่ใช้ plain `page`

---

### Screenshot / Video / Trace

ควบคุมผ่าน `use` ใน `playwright.config.ts`:

```ts
use: {
  screenshot: 'only-on-failure', // เปลี่ยนได้ตามตาราง
  video:      'retain-on-failure',
  trace:      'retain-on-failure',
}
```

#### ค่าที่ใช้ได้

**screenshot**

| ค่า | พฤติกรรม |
|-----|----------|
| `'off'` | ไม่เก็บเลย |
| `'only-on-failure'` | เก็บเฉพาะ test ที่ fail **(default)** |
| `'on'` | เก็บภาพสุดท้ายของทุก test ทั้ง pass และ fail |

**video**

| ค่า | พฤติกรรม |
|-----|----------|
| `'off'` | ไม่บันทึก (เร็วขึ้น ~20–30%) |
| `'retain-on-failure'` | บันทึกทุก test แต่ลบทิ้งถ้า pass **(default)** |
| `'on'` | เก็บวิดีโอทุก test ทั้ง pass และ fail |

**trace**

| ค่า | พฤติกรรม |
|-----|----------|
| `'off'` | ไม่เก็บ |
| `'retain-on-failure'` | เก็บเฉพาะ test ที่ fail **(default)** |
| `'on'` | เก็บ trace ทุก test |
| `'on-first-retry'` | เก็บเฉพาะครั้งแรกที่ retry (ใช้บน CI) |

> Trace คือ Playwright's built-in time-travel debugger — เปิดดูด้วย `npx playwright show-trace trace.zip`

#### แนวทางเลือกตาม use case

| สถานการณ์ | screenshot | video | trace |
|-----------|-----------|-------|-------|
| **Local dev** (ปัจจุบัน) | `only-on-failure` | `retain-on-failure` | `retain-on-failure` |
| **CI / PR check** | `only-on-failure` | `retain-on-failure` | `on-first-retry` |
| **Debug test ที่ flaky** | `on` | `on` | `on` |
| **Minimal / เร็วสุด** | `off` | `off` | `off` |

ไฟล์จะถูกเก็บที่ `test-results/` (gitignored) และ Allure จะ attach เข้า report อัตโนมัติเมื่อรัน `npm run report:allure`

### k6 Performance Report

HTML report สร้างอัตโนมัติหลังรัน k6:

| Script | Output |
|--------|--------|
| `perf:smoke` | `k6/reports/smoke-report.html` |
| `perf:load` | `k6/reports/load-report.html` |
| `perf:stress` | `k6/reports/stress-report.html` |

---

## Performance Testing (k6)

### โครงสร้าง

```
k6/
├── helpers/
│   ├── auth.js          # login() + authHeaders() + BASE_URL
│   └── report.js        # summary() → HTML + stdout text
├── smoke.js             # 2 VU, 1m — ตรวจสอบ critical flows
├── load.js              # ramp 0→50 VU, 8m — normal traffic simulation
├── stress.js            # ramp 0→200 VU, 10m — หา breaking point
├── scenarios.js         # Scenario-based: 3 กลุ่มผู้ใช้รันพร้อมกัน
└── transactions.js      # Transaction-based: user journey end-to-end
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
npm run perf:smoke       # Smoke — 2 VU, 1 นาที
npm run perf:load        # Load — 50 VU, 8 นาที
npm run perf:stress      # Stress — 200 VU, 10 นาที
npm run perf:scenario    # Scenario-based — 3 groups, ~9 นาที
npm run perf:transaction # Transaction-based — user journey, 5 นาที
npm run perf:smoke:qa    # Smoke บน QA environment
```

> **หมายเหตุ:** อย่ารัน load/stress บน production

---

## CI/CD (GitHub Actions)

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

> Credentials มาจาก sheet Test Data ใน xlsx — อย่าแก้ในโค้ดโดยตรง
