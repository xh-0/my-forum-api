import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt'; // 假设你使用 JWT 校验
import { drizzle } from 'drizzle-orm/d1';
import { posts, comments } from './db/schema';
import { eq } from 'drizzle-orm';
import { sign } from 'hono/jwt';

//  定义 Bindings 类型，确保 c.env.DB 有智能提示
type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

// 定义 JWT payload 类型
interface JWTPayload {
  sub: string; // 用户 ID
  // 可以根据需要添加其他字段，如 username, email 等
}

const app = new Hono<{ Bindings: Bindings }>();

//  开启 CORS，允许前端访问
app.use('/api/*', cors({
  origin: (origin) => {
    // 如果没有 origin (比如直接浏览器打开接口或 Postman)
    if (!origin) return '*';
    // 验证域名后缀
    const isAllowed =
      origin.endsWith('.workers.dev') ||
      origin.endsWith('.pages.dev') ||
      origin === 'http://localhost:5173';

    return isAllowed ? origin : 'http://localhost:5173';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// --- 公开接口 (所有人可访问) ---

app.get('/', (c) => c.text('Forum API is running!')); // 首页

// 获取帖子列表
app.get('/api/posts', async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db.select().from(posts).all();
  return c.json(result);
});

// 获取帖子详情及其评论
app.get('/api/posts/:id', async (c) => {
  const rawId = c.req.param('id');
  const id = parseInt(rawId, 10); // 显式转换十进制整数
  const db = drizzle(c.env.DB);
  const post = await db.select().from(posts).where(eq(posts.id, id)).get();
  if (!post) {
    return c.json({ error: "Post not found in DB", searchedId: id }, 404);
  }
  const postComments = await db.select().from(comments).where(eq(comments.postId, id)).all();
  return c.json({ ...post, comments: postComments });
});

// --- 受保护接口 (需要登录) ---

app.use('/api/protected/*', async (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
    alg: 'HS256'
  });
  return jwtMiddleware(c, next);
});

// 注册接口
app.post('/api/register', async (c) => {
  const { username, password } = await c.req.json();
  // 基础校验
  if (!username || username.length < 2) {
    return c.json({ error: '用户名长度至少为 2 位' }, 400);
  }
  try {
    // 1. 检查用户是否已存在
    // 使用 c.env.DB 匹配你的 Bindings 定义
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(username).first();

    if (existingUser) {
      return c.json({ error: '用户名已存在' }, 400);
    }
    // 2. 插入新用户
    // 提示：实际项目建议对 password 进行 hash 处理（如使用 bcryptjs）
    await c.env.DB.prepare(
      'INSERT INTO users (username, password) VALUES (?, ?)'
    ).bind(username, password).run();

    return c.json({ message: '注册成功', username });
  } catch (err: any) {
    console.error('注册错误:', err.message);
    return c.json({ error: '服务器内部错误，注册失败' }, 500);
  }
});

//  登录接口
app.post('/api/login', async (c) => {
  try {
    const { username } = await c.req.json();
    // 签发 JWT：使用与中间件一致的密钥
    const payload = {
      username,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    };
    // 从 c.env 获取环境变量
    const token = await sign(payload, c.env.JWT_SECRET);
    return c.json({
      token,
      user: { username }
    });
  } catch (err) {
    return c.json({ error: '登录失败' }, 400);
  }
});

// 发布帖子
app.post('/api/protected/posts', async (c) => {
  // 1. 获取 JWT 校验后的载荷（如果你在 sign 时存了 username）
  const payload = c.get('jwtPayload') as { username: string };
  if (!payload) {
    return c.json({ error: '未授权' }, 401);
  }
  const author_id = payload.username

  try {
    const { title, content } = await c.req.json();

    if (!title || !content) {
      return c.json({ error: '标题和内容不能为空' }, 400);
    }

    // 2. 写入 D1 数据库
    // 注意：这里的字段名要和你的 posts 表结构一致
    const result = await c.env.DB.prepare(
      'INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)'
    ).bind(title, content, author_id).run();

    return c.json({ message: '发布成功', id: result.meta.last_row_id });
  } catch (err: any) {
    return c.json({ error: '发布失败: ' + err.message }, 500);
  }
});

// 添加评论
app.post('/api/protected/posts/:id/comments', async (c) => {
  try {
    const postId = Number(c.req.param('id'));
    const payload = c.get('jwtPayload') as any;
    const { content } = await c.req.json();
    const db = drizzle(c.env.DB);

    // 增加一步检查，防止写入空数据
    if (!content) return c.json({ error: "内容不能为空" }, 400);

    await db.insert(comments).values({
      postId,
      content,
      // 这里的 key 必须和 schema.ts 里的变量名一致
      // 值必须和登录 sign 时存入的 key 一致
      authorId: payload.username || payload.sub,
    });

    return c.json({ success: true }, 201);
  } catch (err: any) {
    // 将具体错误打印出来，这样即使没开 wrangler tail，也能在 network 看到一点线索
    console.error("Comment Error:", err.message);
    return c.json({ error: err.message }, 500);
  }
});

export default app;