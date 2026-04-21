import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { users } from '../db/schema';
import { Bindings } from '../types';
import { eq } from 'drizzle-orm';

const user = new Hono<{ Bindings: Bindings }>();

import { jwt } from 'hono/jwt';

const authMiddleware = (c: any, next: any) => {
  return jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' })(c, next);
};

// 获取个人资料
// 获取当前登录用户的个人详情
user.get('/me', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const payload = c.get('jwtPayload') as any; // 从 JWT 中获取 username

  try {
    // 1. 查询数据库，明确排除 password 字段
    const user = await db
      .select({
        id: users.id,
        username: users.username,
        nickname: users.nickname,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        email: users.email,
        isAdmin: users.isAdmin,
        status: users.status,
        lastLogin: users.lastLogin,
        postCount: users.postCount,
        commentCount: users.commentCount,
        reputation: users.reputation,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.username, payload.username))
      .get();

    if (!user) {
      return c.json({ error: '用户不存在' }, 404);
    }

    // 2. 返回用户所有详情信息
    return c.json({ user });

  } catch (err: any) {
    console.error("Fetch Me Error:", err.message);
    return c.json({ error: '获取用户信息失败' }, 500);
  }
});

// 修改个人资料
user.patch('/profile', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const payload = c.get('jwtPayload') as any;
  const body = await c.req.json();

  // 1. 定义允许修改的字段白名单，防止用户通过前端注入恶意修改权限
  const { nickname, bio } = body;

  // 2. 构建更新对象（只包含有值的字段）
  const updateData: any = {
    updatedAt: new Date().toISOString()
  };
  if (nickname !== undefined) updateData.nickname = nickname;
  if (bio !== undefined) updateData.bio = bio;

  try {
    // 3. 执行更新
    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.username, payload.username)) // 使用 JWT 中的用户名进行精准定位
      .run();

    if (result.success) {
      return c.json({ success: true, message: '个人资料已更新' });
    } else {
      return c.json({ error: '更新失败，请重试' }, 500);
    }
  } catch (err: any) {
    return c.json({ error: '数据库更新错误', details: err.message }, 500);
  }
});

export default user;