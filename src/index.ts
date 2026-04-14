import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt'; // 假设你使用 JWT 校验
import { drizzle } from 'drizzle-orm/d1';
import { posts, comments } from './db/schema';
import { eq } from 'drizzle-orm';
// import { Bindings } from 'hono/types';

//  定义 Bindings 类型，确保 c.env.DB 有智能提示
type Bindings = {
  DB: D1Database;
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
  const id = Number(c.req.param('id'));
  const db = drizzle(c.env.DB);
  const post = await db.select().from(posts).where(eq(posts.id, id)).get();
  const postComments = await db.select().from(comments).where(eq(comments.postId, id)).all();
  return c.json({ ...post, comments: postComments });
});

// --- 受保护接口 (需要登录) ---

// 注册 JWT 中间件，仅拦截 /api/protected/* 开头的路径
app.use('/api/protected/*', jwt({
  secret: 'YOUR_JWT_SECRET',
  alg: 'HS256'
}));

// 发布帖子
app.post('/api/protected/posts', async (c) => {
  const payload = c.get('jwtPayload') as JWTPayload;
  const body = await c.req.json();
  const db = drizzle(c.env.DB);

  await db.insert(posts).values({
    title: body.title,
    content: body.content,
    authorId: payload.sub, // 用户 ID
  });
  return c.json({ success: true }, 201);
});

// 添加评论
app.post('/api/protected/posts/:id/comments', async (c: any) => {
  const postId = Number(c.req.param('id'));
  const payload = c.get('jwtPayload') as JWTPayload;
  const { content } = await c.req.json();
  const db = drizzle(c.env.DB);

  await db.insert(comments).values({
    postId,
    content,
    authorId: payload.sub,
  });
  return c.json({ success: true }, 201);
});

export default app;