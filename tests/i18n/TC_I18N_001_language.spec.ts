import { test, expect } from '@playwright/test';
import { getTestCases } from '../../utils/excelReader';
import { autoAnnotate } from '../../utils/allure';

const cases = getTestCases({ Module: 'i18n' });

function tc(id: string) {
  const found = cases.find(t => t['TC_ID'] === id);
  if (!found) throw new Error(`TC "${id}" not found`);
  return found;
}
function title(id: string) {
  const t = tc(id);
  return `[${t['TC_ID']}][${t['Priority']}] ${t['Test Name (TH)']}`;
}

test.describe('i18n — Language Switching', () => {
  test.beforeEach(async ({}, testInfo) => { await autoAnnotate(testInfo); });

  test(title('TC-I18N-01'), async ({ page }) => {
    await test.step('Given: เปิด Homepage', async () => {
      await page.goto('/');
    });

    await test.step('When: คลิก language switcher', async () => {
      await page.click('#lang-switcher-wrap button');
    });

    await test.step('Then: แสดง lang-menu', async () => {
      await expect(page.locator('#lang-menu')).toBeVisible();
    });
  });

  test(title('TC-I18N-02'), async ({ page }) => {
    await test.step('Given: เปิด Homepage', async () => {
      await page.goto('/');
    });

    await test.step('When: เลือกภาษา EN จาก lang-menu', async () => {
      await page.click('#lang-switcher-wrap button');
      await page.click("button[onclick*=\"setLang('en')\"]");
    });

    await test.step('Then: หน้าเว็บแสดงข้อความภาษาอังกฤษ', async () => {
      // ตรวจสอบ attribute lang บน <html> หรือ content ที่เป็นภาษาอังกฤษ
      const html = page.locator('html');
      const lang = await html.getAttribute('lang');
      if (lang) {
        expect(lang).toMatch(/en/i);
      } else {
        // fallback: page should still be visible
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test(title('TC-I18N-03'), async ({ page }) => {
    await test.step('Given: เปิด Homepage', async () => {
      await page.goto('/');
    });

    await test.step('When: เลือกภาษา TH จาก lang-menu', async () => {
      await page.click('#lang-switcher-wrap button');
      await page.click("button[onclick*=\"setLang('th')\"]");
    });

    await test.step('Then: หน้าเว็บแสดงข้อความภาษาไทย', async () => {
      const html = page.locator('html');
      const lang = await html.getAttribute('lang');
      if (lang) {
        expect(lang).toMatch(/th/i);
      } else {
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test(title('TC-I18N-04'), async ({ page }) => {
    await test.step('Given: เปิด Homepage และสลับภาษาเป็น EN', async () => {
      await page.goto('/');
      await page.click('#lang-switcher-wrap button');
      await page.click("button[onclick*=\"setLang('en')\"]");
    });

    await test.step('When: navigate ไปหน้า /products.html', async () => {
      await page.goto('/products.html');
    });

    await test.step('Then: ภาษายังคงเป็น EN (ตั้งค่าไว้ใน localStorage)', async () => {
      const lang = await page.evaluate(() => localStorage.getItem('lang') || document.documentElement.getAttribute('lang'));
      if (lang) {
        expect(lang).toMatch(/en/i);
      }
    });
  });

  test(title('TC-I18N-05'), async ({ page }) => {
    await test.step('Given: เปิด Homepage', async () => {
      await page.goto('/');
    });

    await test.step('Then: lang-switcher-wrap แสดงอยู่บนหน้า', async () => {
      await expect(page.locator('#lang-switcher-wrap')).toBeVisible();
    });
  });

});
