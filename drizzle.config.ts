import { defineConfig } from 'drizzle-kit';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

// Matches `d1_databases[].database_id` in `wrangler.jsonc`
const d1DatabaseId = process.env.D1_DATABASE_ID ?? 'aed3d1c9-96c1-4ef4-b64a-724338e04582';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts', // 刚才定义的 Schema 位置
  out: './drizzle',
  driver: 'd1-http',
  dbCredentials: {
    accountId: requiredEnv('CLOUDFLARE_ACCOUNT_ID'),
    databaseId: d1DatabaseId,
    token: requiredEnv('CF_API_TOKEN'),
  },
});