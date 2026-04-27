import { TestInfo } from '@playwright/test';
import { allure } from 'allure-playwright';

const SEVERITY_MAP: Record<string, string> = {
  P0: 'blocker',
  P1: 'critical',
  P2: 'normal',
  P3: 'minor',
};

export async function autoAnnotate(testInfo: TestInfo) {
  const match = testInfo.title.match(/^\[([^\]]+)\]\[([^\]]+)\]/);
  if (!match) return;
  const [, tcId, priority] = match;
  try {
    await allure.label('TC_ID', tcId);
    await allure.severity((SEVERITY_MAP[priority] ?? 'normal') as any);
  } catch {
    // allure context not available in this test scope — skip annotation
  }
}
