import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { Bindings } from '../types';

const auth = new Hono<{ Bindings: Bindings }>();

// 注册
// src/routes/auth.ts
import { drizzle } from 'drizzle-orm/d1';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

auth.post('/register', async (c) => {
  const db = drizzle(c.env.DB);
  try {
    const { username, password } = await c.req.json();

    // 插入数据
    // 注意：即使数据库是 user_id，这里也写变量名 username/password
    await db.insert(users).values({
      username,
      password,
    }).run();

    return c.json({ success: true, message: '注册成功' });
  } catch (err: any) {
    // 如果报错，这里会打印出具体的 SQL 错误，比如 "no such table: users"
    console.error("DEBUG:", err.message);
    return c.json({ error: '注册失败', details: err.message }, 500);
  }
});

// 登录
auth.post('/login', async (c) => {
  try {
    const { username } = await c.req.json();
    const payload = {
      username,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    };
    const token = await sign(payload, c.env.JWT_SECRET);
    return c.json({ token, user: { username } });
  } catch (err) {
    return c.json({ error: '登录失败' }, 400);
  }
});

export default auth;