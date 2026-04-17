import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { Bindings } from '../types';

const auth = new Hono<{ Bindings: Bindings }>();

// 注册
auth.post('/register', async (c) => {
  const { username, password } = await c.req.json();
  if (!username || username.length < 2) return c.json({ error: '用户名长度至少为 2 位' }, 400);

  try {
    const existingUser = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existingUser) return c.json({ error: '用户名已存在' }, 400);

    await c.env.DB.prepare('INSERT INTO users (username, password) VALUES (?, ?)').bind(username, password).run();
    return c.json({ message: '注册成功', username });
  } catch (err: any) {
    return c.json({ error: '服务器内部错误' }, 500);
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