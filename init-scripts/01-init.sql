-- ============================================
-- Nunchi Forum 数据库初始化脚本
-- ============================================

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 设置时区
SET TIMEZONE = 'UTC';

-- 注释
COMMENT ON DATABASE nunchi_forum IS 'Nunchi Forum 主数据库';
