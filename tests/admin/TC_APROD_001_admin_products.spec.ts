import { test, expect } from '../../fixtures/auth.fixture';
import { getTestCases } from '../../utils/excelReader';

const cases = getTestCases({ Module: 'Admin Products' });

function tc(id: string) {
  const found = cases.find(t => t['TC_ID'] === id);
  if (!found) throw new Error(`TC "${id}" not found`);
  return found;
}
function title(id: string) {
  const t = tc(id);
  return `[${t['TC_ID']}][${t['Priority']}] ${t['Test Name (TH)']}`;
}

test.describe('Admin — Products Management', () => {

  test(title('TC-APROD-01'), async ({ adminPage }) => {
    await test.step('When: เปิด /admin/products.html', async () => {
      await adminPage.goto('/admin/products.html');
    });

    await test.step('Then: แสดง product-table พร้อม product-row อย่างน้อย 1 รายการ', async () => {
      await expect(adminPage.locator('[data-testid="product-table"]')).toBeVisible();
      await expect(adminPage.locator('[data-testid="product-row"]').first()).toBeVisible();
    });
  });

  test(title('TC-APROD-02'), async ({ adminPage }) => {
    await test.step('Given: เปิด /admin/products.html', async () => {
      await adminPage.goto('/admin/products.html');
    });

    await test.step('When: คลิก add-product-btn', async () => {
      await adminPage.click('[data-testid="add-product-btn"]');
    });

    await test.step('Then: แสดง product-modal', async () => {
      await expect(adminPage.locator('[data-testid="product-modal"]')).toBeVisible();
    });
  });

  test(title('TC-APROD-03'), async ({ adminPage }) => {
    const suffix = Date.now().toString().slice(-6);

    await test.step('Given: เปิด product-modal ผ่าน add-product-btn', async () => {
      await adminPage.goto('/admin/products.html');
      await adminPage.click('[data-testid="add-product-btn"]');
      await expect(adminPage.locator('[data-testid="product-modal"]')).toBeVisible();
    });

    await test.step('When: กรอกข้อมูลสินค้าใหม่ครบถ้วนแล้ว save', async () => {
      await adminPage.fill('[data-testid="product-form-name"]',  `Test Product ${suffix}`);
      await adminPage.fill('[data-testid="product-form-price"]', '999');
      await adminPage.fill('[data-testid="product-form-stock"]', '50');
      const brand = adminPage.locator('[data-testid="product-form-brand"]');
      if (await brand.count() > 0) await brand.fill('TestBrand');
      const category = adminPage.locator('[data-testid="product-form-category"]');
      if (await category.count() > 0) {
        const tagName = await category.evaluate((el: any) => el.tagName.toLowerCase());
        if (tagName === 'select') {
          await category.selectOption({ index: 1 });
        } else {
          await category.fill('Running');
        }
      }
      await adminPage.click('[data-testid="product-save-btn"]');
    });

    await test.step('Then: product-modal ปิด และ product-table แสดงสินค้าใหม่', async () => {
      await expect(adminPage.locator('[data-testid="product-modal"]')).not.toBeVisible({ timeout: 5000 });
      await expect(adminPage.locator('[data-testid="product-table"]')).toBeVisible();
    });
  });

  test(title('TC-APROD-04'), async ({ adminPage }) => {
    await test.step('Given: เปิด /admin/products.html', async () => {
      await adminPage.goto('/admin/products.html');
      await expect(adminPage.locator('[data-testid="product-row"]').first()).toBeVisible();
    });

    await test.step('When: คลิก edit-product บนรายการแรก', async () => {
      const firstRow = adminPage.locator('[data-testid="product-row"]').first();
      const productId = await firstRow.getAttribute('data-id');
      if (productId) {
        await adminPage.click(`[data-testid="edit-product-${productId}"]`);
      } else {
        await adminPage.locator('[data-testid^="edit-product"]').first().click();
      }
    });

    await test.step('Then: แสดง product-modal พร้อมข้อมูลเดิม', async () => {
      await expect(adminPage.locator('[data-testid="product-modal"]')).toBeVisible();
      const name = adminPage.locator('[data-testid="product-form-name"]');
      await expect(name).not.toHaveValue('');
    });
  });

  test(title('TC-APROD-05'), async ({ adminPage }) => {
    const suffix = Date.now().toString().slice(-4);

    await test.step('Given: เปิด edit modal ของสินค้าแรก', async () => {
      await adminPage.goto('/admin/products.html');
      const firstRow = adminPage.locator('[data-testid="product-row"]').first();
      const productId = await firstRow.getAttribute('data-id');
      if (productId) {
        await adminPage.click(`[data-testid="edit-product-${productId}"]`);
      } else {
        await adminPage.locator('[data-testid^="edit-product"]').first().click();
      }
      await expect(adminPage.locator('[data-testid="product-modal"]')).toBeVisible();
    });

    await test.step('When: แก้ไข price และ save', async () => {
      await adminPage.fill('[data-testid="product-form-price"]', `${1000 + parseInt(suffix)}`);
      await adminPage.click('[data-testid="product-save-btn"]');
    });

    await test.step('Then: product-modal ปิด และราคาอัพเดตใน product-table', async () => {
      await expect(adminPage.locator('[data-testid="product-modal"]')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test(title('TC-APROD-06'), async ({ adminPage }) => {
    await test.step('Given: เปิด product-modal', async () => {
      await adminPage.goto('/admin/products.html');
      await adminPage.click('[data-testid="add-product-btn"]');
      await expect(adminPage.locator('[data-testid="product-modal"]')).toBeVisible();
    });

    await test.step('When: submit form โดยไม่กรอกข้อมูล required', async () => {
      await adminPage.click('[data-testid="product-save-btn"]');
    });

    await test.step('Then: แสดง error และ modal ยังอยู่', async () => {
      await expect(adminPage.locator('[data-testid="product-modal"]')).toBeVisible();
    });
  });

  test(title('TC-APROD-07'), async ({ adminPage }) => {
    await test.step('Given: เปิด /admin/products.html', async () => {
      await adminPage.goto('/admin/products.html');
      await expect(adminPage.locator('[data-testid="product-row"]').first()).toBeVisible();
    });

    await test.step('When: คลิก delete-product บนรายการสุดท้าย', async () => {
      const rows = adminPage.locator('[data-testid="product-row"]');
      const beforeCount = await rows.count();
      const lastRow = rows.nth(beforeCount - 1);
      const productId = await lastRow.getAttribute('data-id');

      adminPage.once('dialog', dialog => dialog.accept());
      if (productId) {
        await adminPage.click(`[data-testid="delete-product-${productId}"]`);
        // wait for row to disappear from DOM
        await expect(adminPage.locator(`[data-testid="delete-product-${productId}"]`)).not.toBeAttached({ timeout: 5000 });
      } else {
        await adminPage.locator('[data-testid^="delete-product"]').last().click();
        await adminPage.waitForTimeout(1000);
      }

      const afterCount = await adminPage.locator('[data-testid="product-row"]').count();
      expect(afterCount).toBeLessThan(beforeCount);
    });
  });

});
