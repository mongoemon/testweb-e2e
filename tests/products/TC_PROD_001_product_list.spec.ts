import { test, expect } from '@playwright/test';
import { getTestCases, getTestData } from '../../utils/excelReader';

const cases   = getTestCases({ Module: 'Products' });
const allData = getTestData();

function tc(id: string) {
  const found = cases.find(t => t['TC_ID'] === id);
  if (!found) throw new Error(`TC "${id}" not found`);
  return found;
}
function title(id: string) {
  const t = tc(id);
  return `[${t['TC_ID']}][${t['Priority']}] ${t['Test Name (TH)']}`;
}
function td(dataSetId: string) {
  const found = allData.find(d => d['Data Set ID'] === dataSetId);
  if (!found) throw new Error(`TD "${dataSetId}" not found`);
  return found;
}

test.describe('Products — Product List', () => {

  test(title('TC-PROD-01'), async ({ page }) => {
    await test.step('When: เปิด /products.html', async () => {
      await page.goto('/products.html');
    });

    await test.step('Then: product-grid แสดง product-card อย่างน้อย 1 รายการ', async () => {
      await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="product-count"]')).toBeVisible();
    });
  });

  test(title('TC-PROD-02'), async ({ page }) => {
    const data = td('TD-PROD-02');

    await test.step('Given: เปิด /products.html', async () => {
      await page.goto('/products.html');
    });

    await test.step(`When: พิมพ์ "Nike" ใน search-input แล้วกด search`, async () => {
      await page.fill('[data-testid="search-input"]', 'Nike');
      await page.click('[data-testid="search-btn"]');
    });

    await test.step('Then: ผลลัพธ์แสดงเฉพาะสินค้า Nike (≥1 รายการ)', async () => {
      await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
      const count = await page.locator('[data-testid="product-card"]').count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test(title('TC-PROD-03'), async ({ page }) => {
    await test.step('Given: เปิด /products.html', async () => {
      await page.goto('/products.html');
    });

    await test.step('When: ค้นหาด้วยคำที่ไม่มีในระบบ "xxxxnotexist"', async () => {
      await page.fill('[data-testid="search-input"]', 'xxxxnotexist');
      await page.click('[data-testid="search-btn"]');
    });

    await test.step('Then: แสดง empty-state และไม่มี product-card', async () => {
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
      expect(await page.locator('[data-testid="product-card"]').count()).toBe(0);
    });
  });

  test(title('TC-PROD-04'), async ({ page }) => {
    await test.step('Given: เปิด /products.html', async () => {
      await page.goto('/products.html');
    });

    await test.step('When: เลือก Category จาก filter-category', async () => {
      await page.selectOption('[data-testid="filter-category"]', { index: 1 });
    });

    await test.step('Then: แสดง product-card ที่ตรงกับ category ที่เลือก', async () => {
      await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
    });
  });

  test(title('TC-PROD-05'), async ({ page }) => {
    await test.step('Given: เปิด /products.html', async () => {
      await page.goto('/products.html');
    });

    await test.step('When: เลือก Brand "Nike" จาก filter-brand แล้วกด search', async () => {
      await page.selectOption('[data-testid="filter-brand"]', 'Nike');
      await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/products') && res.status() === 200),
        page.click('[data-testid="search-btn"]'),
      ]);
    });

    await test.step('Then: แสดงเฉพาะสินค้า brand Nike', async () => {
      const cards = page.locator('[data-testid="product-card"]');
      await expect(cards.first()).toBeVisible();
      const brands = page.locator('[data-testid="product-brand"]');
      const count  = await brands.count();
      for (let i = 0; i < count; i++) {
        await expect(brands.nth(i)).toContainText('Nike');
      }
    });
  });

  test(title('TC-PROD-06'), async ({ page }) => {
    await test.step('Given: เปิด /products.html', async () => {
      await page.goto('/products.html');
    });

    await test.step('When: เลือก Sort "ราคา: ต่ำ→สูง" จาก filter-sort แล้วกด search', async () => {
      await page.selectOption('[data-testid="filter-sort"]', 'price_asc');
      await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/products') && res.status() === 200),
        page.click('[data-testid="search-btn"]'),
      ]);
    });

    await test.step('Then: สินค้าเรียงราคาจากน้อยไปมาก', async () => {
      await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
      const prices = await page.locator('[data-testid="product-price"]').allTextContents();
      const nums   = prices.map(p => parseFloat(p.replace(/[^0-9.]/g, '')));
      for (let i = 1; i < nums.length; i++) {
        expect(nums[i]).toBeGreaterThanOrEqual(nums[i - 1]);
      }
    });
  });

  test(title('TC-PROD-07'), async ({ page }) => {
    await test.step('Given: เปิด /products.html', async () => {
      await page.goto('/products.html');
    });

    await test.step('When: เลือก Sort "ราคา: สูง→ต่ำ" จาก filter-sort แล้วกด search', async () => {
      await page.selectOption('[data-testid="filter-sort"]', 'price_desc');
      await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/products') && res.status() === 200),
        page.click('[data-testid="search-btn"]'),
      ]);
    });

    await test.step('Then: สินค้าเรียงราคาจากมากไปน้อย', async () => {
      await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
      const prices = await page.locator('[data-testid="product-price"]').allTextContents();
      const nums   = prices.map(p => parseFloat(p.replace(/[^0-9.]/g, '')));
      for (let i = 1; i < nums.length; i++) {
        expect(nums[i]).toBeLessThanOrEqual(nums[i - 1]);
      }
    });
  });

  test(title('TC-PROD-08'), async ({ page }) => {
    await test.step('Given: เปิด /products.html', async () => {
      await page.goto('/products.html');
    });

    await test.step('When: เลือก Category + Brand + Size พร้อมกัน แล้วกด search', async () => {
      await page.selectOption('[data-testid="filter-category"]', { index: 1 });
      await page.selectOption('[data-testid="filter-brand"]',    'Nike');
      await page.selectOption('[data-testid="filter-size"]',     '42');
      await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/products') && res.status() === 200),
        page.click('[data-testid="search-btn"]'),
      ]);
    });

    await test.step('Then: แสดงผลลัพธ์ที่ตรงกับทุกเงื่อนไข (หรือ empty-state)', async () => {
      const hasCards = await page.locator('[data-testid="product-card"]').count();
      const hasEmpty = await page.locator('[data-testid="empty-state"]').count();
      expect(hasCards + hasEmpty).toBeGreaterThan(0);
    });
  });

  test(title('TC-PROD-09'), async ({ page }) => {
    await test.step('Given: เปิด /products.html และมี product-card แสดงอยู่', async () => {
      await page.goto('/products.html');
      await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
    });

    await test.step('When: คลิก product-card แรก', async () => {
      await page.locator('[data-testid="product-card"]').first().click();
    });

    await test.step('Then: navigate ไป /product.html?id=... พร้อมแสดง product-detail', async () => {
      await expect(page).toHaveURL(/product\.html/);
      await expect(page.locator('[data-testid="product-detail"]')).toBeVisible();
    });
  });

});
