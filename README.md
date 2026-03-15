# Nunchi Forum

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)](https://www.postgresql.org/)

一个现代简约的论坛系统，为技术社区和产品团队打造。

## 功能特性

### 核心功能

- **用户系统**
  - 用户注册/登录（JWT 认证）
  - 个人资料管理
  - 用户等级与声望系统
  - 头像上传

- **论坛结构**
  - 板块（Forum）管理
  - 主题（Thread）发布与编辑
  - 回复（Reply）功能，支持嵌套回复
  - 标签（Tag）系统

- **互动功能**
  - 点赞/踩
  - 收藏主题
  - @提及用户
  - 实时通知中心

- **内容管理**
  - Markdown 编辑器
  - 代码高亮
  - 图片上传
  - 全站搜索

- **治理功能**
  - 举报系统
  - 内容审核
  - 用户禁言
  - 版主管理工具

### 技术亮点

- 响应式设计，支持移动端
- 暗黑/亮色主题切换
- RESTful API 设计
- 完整的类型支持
- Docker 容器化部署

## 技术栈

### 后端
- **Runtime**: Node.js 20+
- **Framework**: Fastify 5
- **Language**: TypeScript 5
- **Database**: PostgreSQL 16
- **ORM**: Drizzle ORM
- **Authentication**: JWT (@fastify/jwt)
- **Validation**: JSON Schema
- **Logging**: Pino

### 前端（计划中）
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand / React Query

### 部署
- **Container**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Docker & Docker Compose（可选）

### 使用 Docker 部署（推荐）

```bash
# 克隆项目
git clone https://github.com/limerencel/nunchi-forum.git
cd nunchi-forum

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置必要的环境变量

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

访问：
- 前端: http://localhost:3000
- 后端 API: http://localhost:3001
- API 文档: http://localhost:3001/docs

### 本地开发

```bash
# 克隆项目
git clone https://github.com/limerencel/nunchi-forum.git
cd nunchi-forum

# 安装后端依赖
cd backend
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 初始化数据库
npm run db:migrate

# 启动开发服务器
npm run dev
```

后端服务将在 http://localhost:3001 运行。

更多开发细节请参考 [开发指南](docs/DEVELOPMENT.md)。

## 项目结构

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
│   ├── db/              # 数据库迁移和种子
│   ├── tests/           # 测试文件
│   └── package.json
├── docs/                 # 项目文档
│   ├── API.md           # API 文档
│   ├── DEVELOPMENT.md   # 开发指南
│   └── DEPLOYMENT.md    # 部署文档
├── docker-compose.yml    # Docker 配置
└── README.md
```

## 文档

- [API 文档](docs/API.md) - RESTful API 接口说明
- [开发指南](docs/DEVELOPMENT.md) - 环境搭建、开发流程、测试方法
- [部署文档](docs/DEPLOYMENT.md) - Docker 部署和生产环境配置
- [产品需求文档](docs/PRD.md) - 产品功能和版本规划

## 贡献指南

我们欢迎所有形式的贡献！

### 贡献流程

1. **Fork** 项目仓库
2. **创建分支** (`git checkout -b feature/amazing-feature`)
3. **提交更改** (`git commit -m 'feat: add amazing feature'`)
4. **推送分支** (`git push origin feature/amazing-feature`)
5. **创建 Pull Request**

### 提交规范

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

### 开发要求

- 代码需通过 ESLint 检查
- 提交前运行测试 (`npm test`)
- 保持代码覆盖率 >= 80%
- 更新相关文档

### 报告问题

如果你发现了 bug 或有新功能建议，请通过 [GitHub Issues](https://github.com/limerencel/nunchi-forum/issues) 提交。

提交问题时请包含：
- 问题描述
- 复现步骤
- 期望行为
- 实际行为
- 环境信息（Node.js 版本、操作系统等）

## 开发团队

| 角色 | 负责人 |
|------|--------|
| 项目经理 | Ace |
| 产品经理 | 产品经理 Agent |
| 前端工程师 | 前端工程师 Agent |
| 后端工程师 | 后端工程师 Agent |
| DevOps 工程师 | DevOps 工程师 Agent |
| QA 测试工程师 | QA 测试工程师 Agent |

## 路线图

### V1.0 MVP
- [x] 用户注册/登录
- [x] 板块/主题/回复 CRUD
- [x] 基础互动（点赞、收藏）
- [x] 通知系统

### V1.1
- [ ] 富文本编辑器
- [ ] 图片上传
- [ ] 搜索功能
- [ ] 管理后台

### V2.0
- [ ] 标签系统
- [ ] 用户等级
- [ ] 主题推荐
- [ ] 实时通知

## 许可证

本项目采用 [MIT 许可证](LICENSE) 开源。

## 致谢

感谢所有贡献者和支持这个项目的朋友们！

---

<p align="center">
  Made with ❤️ by the Nunchi Forum Team
</p>
