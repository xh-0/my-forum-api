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

  try {
    const { id, key, value, order } = await c.req.json();

    // 如果你在 schema 里设置了 .default(sql`CURRENT_TIMESTAMP`)
    // 那么这里甚至不需要手动传入 createdAt 和 updatedAt

    if (id) {
      // --- 更新逻辑 ---
      await db.update(categories)
        .set({
          key,
          value,
          order: Number(order),
          // 注意：这里要用 schema 里的变量名 updatedAt
          // 如果数据库有默认触发器，这行甚至可以省掉
          updatedAt: new Date().toISOString()
        })
        .where(eq(categories.id, id))
        .run();
      return c.json({ success: true, message: "更新成功" });
    } else {
      // --- 新增逻辑 ---
      await db.insert(categories)
        .values({
          key,
          value,
          order: Number(order),
          // 这里的字段名必须和 schema.ts 里的 export const categories 里的 key 一致
        })
        .run();
      return c.json({ success: true });
    }
  } catch (err: any) {
    // 打印具体报错到终端，这能告诉你到底是哪个字段写错了
    console.error("Admin Category Error:", err.message);
    return c.json({ success: false, error: err.message }, 500);
  }
});

admin.delete('/categories/:id', async (c) => {
  const db = drizzle(c.env.DB);
  await db.delete(categories).where(eq(categories.id, Number(c.req.param('id')))).run();
  return c.json({ success: true });
});

export default admin;