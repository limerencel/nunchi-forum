import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

// 数据库连接配置
let poolConfig: any;

if (process.env.DATABASE_URL) {
  // 使用 DATABASE_URL（Docker 环境）
  // 解析 DATABASE_URL 并强制使用 IPv4
  const url = new URL(process.env.DATABASE_URL);
  poolConfig = {
    host: '172.22.0.2', // 数据库容器的 IP
    port: parseInt(url.port || '5432'),
    database: url.pathname.slice(1),
    user: url.username,
    password: url.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    // 禁用 IPv6
    family: 4,
  };
} else {
  // 使用分开的环境变量（本地开发）
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'nunchi_forum',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    family: 4,
  };
}

// 数据库连接池配置
const pool = new Pool(poolConfig);

// 创建 Drizzle 实例
export const db = drizzle(pool, { schema });

// 导出 schema 供使用
export * from './schema.js';

// 导出连接池供直接使用
export { pool };

// 健康检查函数
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// 优雅关闭连接
export async function closeDatabase(): Promise<void> {
  await pool.end();
}
