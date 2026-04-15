import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 帖子表
export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: text('author_id').notNull(), // 对应登录用户的 ID
  createdAt: text('created_at',),
});

// 评论表
export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').references(() => posts.id),
  content: text('content').notNull(),
  authorId: text('author_id').notNull(),
  createdAt: text('created_at',),
});
