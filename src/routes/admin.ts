import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { categories } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { Bindings } from '../types';

const admin = new Hono<{ Bindings: Bindings }>();

// 获取分类 (公开或准公开)
admin.get('/categories', async (c) => {
  const db = drizzle(c.env.DB);
  return c.json(await db.select().from(categories).orderBy(asc(categories.order)).all());
});

// 管理分类 (建议加 admin 权限校验)
admin.post('/categories', async (c) => {
  const db = drizzle(c.env.DB);
  const { id, key, value, order } = await c.req.json();
  const now = new Date().toISOString();

  if (id) {
    await db.update(categories).set({ key, value, order: Number(order), updatedAt: now }).where(eq(categories.id, id)).run();
    return c.json({ success: true, message: "更新成功" });
  } else {
    await db.insert(categories).values({ key, value, order: Number(order), createdAt: now, updatedAt: now }).run();
    return c.json({ success: true });
  }
});

admin.delete('/categories/:id', async (c) => {
  const db = drizzle(c.env.DB);
  await db.delete(categories).where(eq(categories.id, Number(c.req.param('id')))).run();
  return c.json({ success: true });
});

export default admin;