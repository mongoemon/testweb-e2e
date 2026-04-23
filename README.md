# ShoesHub E2E Test Suite

Playwright E2E tests for [ShoesHub](http://localhost:8000) — ครอบคลุม Authentication, Cart, Checkout, Products, Profile, Orders และ Admin

---

## Requirements

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |

---

## Installation

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. ติดตั้ง Playwright browsers
npx playwright install chromium
```

---

## Project Structure

```
testweb-e2e/
├── docs/
│   └── ShoesHub_Test_Cases.xlsx   # Test cases, test data, environments (source of truth)
├── fixtures/
│   └── auth.fixture.ts            # Shared login fixtures (userPage, adminPage)
├── pages/
│   ├── LoginPage.ts               # Page Object Model สำหรับหน้า login
│   └── CartPage.ts                # Page Object Model สำหรับหน้า cart
├── tests/
│   ├── auth/                      # Authentication test cases
│   └── cart/                      # Cart test cases
├── utils/
│   └── excelReader.ts             # Helper อ่านข้อมูลจาก xlsx
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
npx playwright test tests/auth/
npx playwright test tests/cart/
```

### รัน test เฉพาะไฟล์

```bash
npx playwright test tests/auth/TC_AUTH_001_login_success.spec.ts
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
| 📋 Test Cases | รายการ test case 78 รายการพร้อม steps และ expected result |
| 📁 Test Data | Input data เช่น username, password, email |
| 🌐 Environments | Config URL และ credentials ต่อ environment |

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

---

## Fixtures

`fixtures/auth.fixture.ts` เตรียม browser session ที่ login อยู่แล้วให้ใช้ใน test ได้เลย

```ts
import { test, expect } from '../../fixtures/auth.fixture';

// userPage — login เป็น testuser (TD-AUTH-05 จาก xlsx)
test('example', async ({ userPage }) => {
  await userPage.goto('/products.html');
});

// adminPage — login เป็น admin (TD-AUTH-06 จาก xlsx)
test('admin example', async ({ adminPage }) => {
  await adminPage.goto('/admin.html');
});
```

---

## Reports

```bash
# เปิด HTML report หลังรัน test
npm run report
```

Report จะอยู่ที่ `playwright-report/index.html`  
Screenshot เมื่อ test fail อยู่ที่ `test-results/`

---

## Seed Accounts

| Role | Username | Password |
|------|----------|----------|
| User | `testuser` | `test1234` |
| Admin | `admin` | `admin1234` |

> Credentials เหล่านี้มาจาก sheet 📁 Test Data ใน xlsx — อย่าแก้ในโค้ดโดยตรง
