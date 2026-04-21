// src/middleware/admin.ts
const adminOnly = async (c: any, next: any) => {
  const payload = c.get('jwtPayload') as any;

  // 1. 简单校验：直接从 Token 中读 isAdmin (快)
  if (payload?.isAdmin !== 1) {
    return c.json({ error: '权限不足，仅管理员可访问' }, 403);
  }

  await next();
};