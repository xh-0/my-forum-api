# 文档说明

## 功能指令

本地连接线上数据库
- npx wrangler dev --remote
连接本地数据库
- npx wrangler dev --local

发版
- npx wrangler deploy
启动
- npm run dev

将线上数据导出为 SQL 文件
- npx wrangler d1 export forum-db --remote --output=dump.sql
将数据导入到本地库
- npx wrangler d1 execute forum-db --local --file=dump.sql
