# Nunchi Forum 开发指南

本文档介绍 Nunchi Forum 的开发环境搭建、本地开发流程和测试方法。

---

## 环境搭建

### 前置要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 或 **pnpm** >= 8.0.0
- **PostgreSQL**: >= 14
- **Git**

### 1. 克隆项目

```bash
git clone https://github.com/limerencel/nunchi-forum.git
cd nunchi-forum
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖（如有前端目录）
cd ../frontend
npm install
```

### 3. 配置环境变量

#### 后端环境变量

创建 `backend/.env` 文件：

```env
# 服务器配置
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# 数据库配置
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nunchi_forum

# JWT 配置
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS 配置
CORS_ORIGIN=http://localhost:3000

# 日志级别
LOG_LEVEL=debug
```

### 4. 初始化数据库

```bash
# 创建数据库
createdb nunchi_forum

# 运行数据库迁移（如使用 Drizzle ORM）
npm run db:migrate

# 或运行初始化 SQL 脚本
psql -U postgres -d nunchi_forum -f backend/db/init.sql
```

### 5. 启动开发服务器

```bash
# 启动后端开发服务器
cd backend
npm run dev

# 后端服务将在 http://localhost:3001 运行
```

---

## 本地开发流程

### 项目结构

```
nunchi-forum/
├── backend/              # Fastify 后端
│   ├── src/
│   │   ├── app.ts       # 应用入口
│   │   ├── routes/      # API 路由
│   │   ├── services/    # 业务逻辑
│   │   ├── models/      # 数据模型
│   │   ├── middleware/  # 中间件
│   │   └── utils/       # 工具函数
│   ├── db/              # 数据库相关
│   ├── tests/           # 测试文件
│   └── package.json
├── frontend/            # React 前端（待开发）
├── docs/                # 项目文档
├── docker-compose.yml   # Docker 配置
└── README.md
```

### 开发工作流

#### 1. 创建功能分支

```bash
git checkout -b feature/your-feature-name
```

#### 2. 开发新功能

- 在 `backend/src/routes/` 添加新路由
- 在 `backend/src/services/` 实现业务逻辑
- 在 `backend/src/models/` 定义数据模型

#### 3. 代码规范

项目使用以下工具保证代码质量：

- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查

```bash
# 运行代码检查
npm run lint

# 自动修复代码问题
npm run lint:fix

# 格式化代码
npm run format

# 类型检查
npm run type-check
```

#### 4. 提交代码

```bash
# 添加修改的文件
git add .

# 提交（使用规范的提交信息）
git commit -m "feat: add user authentication API"
```

**提交信息规范**:
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

#### 5. 推送并创建 PR

```bash
git push origin feature/your-feature-name
```

然后在 GitHub 上创建 Pull Request。

---

## 测试方法

### 测试框架

- **Vitest**: 单元测试
- **Supertest**: HTTP 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行特定测试文件
npm test -- src/services/user.test.ts

# 监视模式运行测试
npm run test:watch
```

### 测试结构

```
backend/
├── src/
│   └── services/
│       └── user.service.ts
└── tests/
    ├── unit/
    │   └── services/
    │       └── user.service.test.ts
    ├── integration/
    │   └── routes/
    │       └── auth.routes.test.ts
    └── setup.ts
```

### 编写测试示例

#### 单元测试

```typescript
// tests/unit/services/user.service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { UserService } from '../../../src/services/user.service';

describe('UserService', () => {
  it('should create a new user', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    const result = await UserService.create(userData);

    expect(result).toHaveProperty('id');
    expect(result.username).toBe(userData.username);
    expect(result.email).toBe(userData.email);
  });

  it('should throw error for duplicate email', async () => {
    const userData = {
      username: 'testuser2',
      email: 'existing@example.com',
      password: 'password123'
    };

    await expect(UserService.create(userData))
      .rejects
      .toThrow('Email already exists');
  });
});
```

#### API 集成测试

```typescript
// tests/integration/routes/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../../src/app';

describe('Auth Routes', () => {
  let app;

  beforeAll(async () => {
    app = await buildApp();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await supertest(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should return 400 for invalid data', async () => {
      const response = await supertest(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'ab',
          email: 'invalid-email',
          password: '123'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await supertest(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'new@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await supertest(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'new@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });
});
```

### 测试数据库

使用独立的测试数据库：

```env
# .env.test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nunchi_forum_test
```

在测试配置中自动清理数据：

```typescript
// tests/setup.ts
import { db } from '../src/db';

afterEach(async () => {
  // 清理测试数据
  await db.query('TRUNCATE TABLE users, forums, threads, replies CASCADE');
});

afterAll(async () => {
  await db.end();
});
```

### 代码覆盖率目标

- 语句覆盖率: >= 80%
- 分支覆盖率: >= 70%
- 函数覆盖率: >= 80%
- 行覆盖率: >= 80%

---

## 调试技巧

### 使用 VS Code 调试

创建 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

### 日志调试

使用内置的 logger:

```typescript
import { FastifyInstance } from 'fastify';

export async function someHandler(app: FastifyInstance) {
  app.log.info('Processing request');
  app.log.debug('Debug data:', { userId: '123' });
  app.log.error('Error occurred:', error);
}
```

### API 测试工具

推荐使用以下工具测试 API:

- **Postman**: 图形化 API 测试工具
- **HTTPie**: 命令行 HTTP 客户端
- **curl**: 内置命令行工具

示例:

```bash
# 使用 HTTPie 测试登录
http POST :3001/api/v1/auth/login \
  email=test@example.com \
  password=password123

# 使用 curl 测试
 curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 常见问题

### 1. 数据库连接失败

**问题**: 无法连接到 PostgreSQL

**解决方案**:
```bash
# 检查 PostgreSQL 服务状态
sudo systemctl status postgresql

# 启动 PostgreSQL
sudo systemctl start postgresql

# 检查数据库是否存在
psql -U postgres -l

# 创建数据库
createdb -U postgres nunchi_forum
```

### 2. 端口被占用

**问题**: 端口 3001 已被占用

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :3001

# 或修改 .env 中的 PORT
PORT=3002
```

### 3. 模块导入错误

**问题**: TypeScript 模块导入失败

**解决方案**:
```bash
# 重新安装依赖
rm -rf node_modules package-lock
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重新构建
npm run build
```

### 4. JWT 验证失败

**问题**: API 返回 401 Unauthorized

**解决方案**:
- 检查请求头中的 Authorization 格式: `Bearer <token>`
- 确认 JWT_SECRET 环境变量正确设置
- 检查令牌是否过期

---

## 开发资源

### 官方文档

- [Fastify 文档](https://www.fastify.io/docs/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)

### 推荐工具

- **数据库管理**: pgAdmin, DBeaver
- **API 测试**: Postman, Insomnia
- **代码编辑**: VS Code + TypeScript 插件
- **版本控制**: Git + GitHub Desktop

---

## 贡献指南

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

请确保:
- 代码通过所有测试
- 代码符合项目规范
- 更新相关文档
- 提交信息遵循规范
