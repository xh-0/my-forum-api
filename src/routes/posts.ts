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
  const db = drizzle(c.env.DB); // 初始化 drizzle 对象

  try {
    const body = await c.req.json();
    const { title, content, tag } = body;

    // 1. 基础校验
    if (!title || !content) {
      return c.json({ error: '标题和内容不能为空' }, 400);
    }

    // 2. 写入数据库
    /** * 注意：
     * - 我们使用 db.insert(posts).values(...) 而不是手写 SQL
     * - 即使数据库里是 author_id，这里也要写 schema 定义里的变量名 authorId
     * - 如果 schema 里的 createdAt/updatedAt 设置了默认值 sql`CURRENT_TIMESTAMP`，
     * 这里可以完全不传这两个字段。
     */
    const result = await db.insert(posts).values({
      title,
      content,
      tag: tag || 'all',
      authorId: payload.username || payload.sub, // 对应 schema 中的 authorId 变量
      // 如果你的 schema 没写默认值，或者你想手动指定 ISO 字符串：
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).run();

    return c.json({
      success: true,
      message: '发布成功',
      id: result.meta.last_row_id
    });

  } catch (err: any) {
    // 打印具体错误到控制台，方便你调试（比如字段不存在等错误）
    console.error("Post Creation Error:", err.message);
    return c.json({
      error: '发布失败',
      details: err.message
    }, 500);
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