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
