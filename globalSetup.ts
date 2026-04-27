import { request } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8000';

// Seed state for products used by tests — restored before every run
const PRODUCT_SEEDS = [
  {
    id: 2,
    name: 'Adidas Ultraboost 23',
    description: 'รองเท้าวิ่งพรีเมี่ยมจาก Adidas รุ่น Ultraboost 23 นุ่มสบายเท้า',
    price: 7990,
    stock: 999,
    brand: 'Adidas',
    sizes: ['38', '39', '40', '41', '42', '43', '44'],
    is_active: true,
  },
  {
    id: 3,
    name: 'New Balance 990v6',
    description: 'รองเท้าวิ่งระดับพรีเมี่ยมจาก New Balance รุ่น 990v6',
    price: 8990,
    stock: 999,
    brand: 'New Balance',
    sizes: ['38', '39', '40', '41', '42', '43', '44'],
    is_active: true,
  },
];

export default async function globalSetup() {
  const ctx = await request.newContext({ baseURL: BASE_URL });

  const loginRes = await ctx.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin1234' },
  });
  const { access_token: token } = await loginRes.json();

  for (const seed of PRODUCT_SEEDS) {
    await ctx.put(`/api/products/${seed.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: seed,
    });
  }

  await ctx.dispose();
}
