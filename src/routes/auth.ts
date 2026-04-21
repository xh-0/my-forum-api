import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { Bindings } from '../types';
import { jwt } from 'hono/jwt';

const auth = new Hono<{ Bindings: Bindings }>();

// 注册
// src/routes/auth.ts
import { drizzle } from 'drizzle-orm/d1';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const authMiddleware = (c: any, next: any) => {
  return jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' })(c, next);
};

// /api/me
auth.get('/me', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  // 获取中间件解析出来的用户信息
  const payload = c.get('jwtPayload') as any;
  console.log("JWT Payload:", payload); // 关键调试点

  try {
    // 根据解析出来的 username 查询数据库
    const user = await db
      .select({
        id: users.id,
        username: users.username,
        // 注意：千万不要返回 password 字段！
      })
      .from(users)
      .where(eq(users.username, payload.username))
      .get();

    if (!user) {
      return c.json({ error: '用户不存在' }, 404);
    }

    return c.json({ user });
  } catch (err: any) {
    console.error("Fetch User Error:", err.message);
    return c.json({ error: '获取用户信息失败' }, 500);
  }
});

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
    // 返回用户的所有信息
    return c.json({ token, user: { username } });
  } catch (err) {
    return c.json({ error: '登录失败' }, 400);
  }
});

export default auth;