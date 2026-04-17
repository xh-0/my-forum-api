import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 帖子表
export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: text('author_id').notNull(), // 对应登录用户的 ID
  tag: text('tag').notNull(),
  createdAt: text('created_at',),
  updatedAt: text('updatedAt').default(new Date().toISOString()),
});

// 评论表
export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').references(() => posts.id),
  content: text('content').notNull(),
  authorId: text('author_id').notNull(),
  createdAt: text('created_at',),
  updatedAt: text('updatedAt').default(new Date().toISOString()),
});

// 标签字典表
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),   // 存储在 posts 表中的值，如 'tech'
  value: text('value').notNull(),        // 显示在页面上的名称，如 '技术'
  order: integer('order').default(0),    // 排序权重，数值越大越靠前
  createdAt: text('createdAt').default(new Date().toISOString()),
  updatedAt: text('updatedAt').default(new Date().toISOString()),
});