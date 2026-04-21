import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Bindings } from './types';
import auth from './routes/auth';
import postApp from './routes/posts';
import admin from './routes/admin';
import user from './routes/user';

const app = new Hono<{ Bindings: Bindings }>();

// 全局中间件
app.use('*', cors({
  origin: (origin) => {
    if (!origin || origin.endsWith('.workers.dev') || origin.endsWith('.pages.dev') || origin === 'http://localhost:5173') {
      return origin || '*';
    }
    return 'http://localhost:5173';
  },
  credentials: true,
}));

// 路由挂载 - 核心：不要让前缀重叠
// 挂载后，登录地址就是 /api/auth/login
app.route('/api/auth', auth);

// 帖子地址就是 /api/posts 和 /api/posts/:id
app.route('/api/posts', postApp);

// 管理地址就是 /api/admin/categories
app.route('/api/admin', admin);
// 用户地址就是 /api/user/posts
app.route('/api/user', user);

// 首页
app.get('/', (c) => c.text('DUSK2 Forum API V1'));

export default app;