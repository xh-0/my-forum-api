import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 用户表
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),

  // --- 新增字段 ---
  nickname: text('nickname'), // 昵称
  avatarUrl: text('avatar_url'), // 头像地址
  bio: text('bio'), // 个人简介
  email: text('email').unique(), // 邮箱
  isAdmin: integer('is_admin').default(0), // 权限等级 0: false, 1: true
  status: integer('status').default(0),    // 用户状态 0: 正常, 1: 封禁, 2: 注销
  lastLogin: text('last_login'), // 最后登录时间
  postCount: integer('post_count').default(0), // 帖子计数
  commentCount: integer('comment_count').default(0), // 评论计数
  reputation: integer('reputation').default(0), // 积分/威望

  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// 帖子表
export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  tag: text('tag').notNull().default('all'),
  authorId: text('author_id').notNull(),
  // 建议使用 sql 表达式让数据库层处理默认时间，也可以继续用 JS 字符串
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// 评论表
export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').notNull().references(() => posts.id),
  content: text('content').notNull(),
  authorId: text('author_id').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// 标签字典表
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  order: integer('order').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});