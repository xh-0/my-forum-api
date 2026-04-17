import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { drizzle } from 'drizzle-orm/d1';
import { posts, comments } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { Bindings } from '../types';

const postApp = new Hono<{ Bindings: Bindings }>();

// --- 公开部分 ---

// 列表
postApp.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const tag = c.req.query('tag');
  let query = db.select().from(posts);
  if (tag && tag !== 'all') query = query.where(eq(posts.tag, tag)) as any;
  const result = await query.orderBy(desc(posts.createdAt)).all();
  return c.json(result);
});

// 详情
postApp.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const db = drizzle(c.env.DB);
  const post = await db.select().from(posts).where(eq(posts.id, id)).get();
  if (!post) return c.json({ error: "Post not found" }, 404);
  const postComments = await db.select().from(comments).where(eq(comments.postId, id)).all();
  return c.json({ ...post, comments: postComments });
});

// --- 受保护部分 ---
// 针对特定方法开启 JWT 校验
const authMiddleware = (c: any, next: any) => {
  return jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' })(c, next);
};

// 发布帖子
postApp.post('/', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as any;
  const { title, content, tag } = await c.req.json();
  if (!title || !content) return c.json({ error: '内容不能为空' }, 400);

  try {
    const result = await c.env.DB.prepare(
      'INSERT INTO posts (title, content, author_id, tag, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(title, content, payload.username, tag || 'all', new Date().toISOString(), new Date().toISOString()).run();
    return c.json({ message: '发布成功', id: result.meta.last_row_id });
  } catch (err: any) {
    return c.json({ error: '发布失败' }, 500);
  }
});

// 评论
postApp.post('/:id/comments', authMiddleware, async (c) => {
  const postId = Number(c.req.param('id'));
  const payload = c.get('jwtPayload') as any;
  const { content } = await c.req.json();
  if (!content) return c.json({ error: "内容不能为空" }, 400);

  const db = drizzle(c.env.DB);
  await db.insert(comments).values({
    postId,
    content,
    authorId: payload.username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return c.json({ success: true }, 201);
});

export default postApp;