# Nunchi Forum 部署文档

本文档介绍 Nunchi Forum 的部署方法，包括 Docker 部署和生产环境配置。

---

## Docker 部署

### 前置要求

- Docker >= 20.10
- Docker Compose >= 2.0

### 1. 快速启动

使用项目提供的 `docker-compose.yml` 一键启动所有服务：

```bash
# 克隆项目
git clone https://github.com/limerencel/nunchi-forum.git
cd nunchi-forum

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

服务启动后访问：
- 前端: http://localhost:3000
- 后端 API: http://localhost:3001
- 数据库: localhost:5432

### 2. Docker Compose 配置

#### 基础配置

```yaml
version: '3.8'

services:
  # 前端服务
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: nunchi-frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:3001
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - nunchi-network

  # 后端服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: nunchi-backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/nunchi_forum
      - JWT_SECRET=${JWT_SECRET}
      - PORT=3001
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - db
    networks:
      - nunchi-network

  # 数据库服务
  db:
    image: postgres:16-alpine
    container_name: nunchi-db
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=nunchi_forum
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/db/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - nunchi-network

volumes:
  postgres_data:

networks:
  nunchi-network:
    driver: bridge
```

#### 生产环境配置

创建 `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: nunchi-frontend
    ports:
      - "80:80"
      - "443:443"
    environment:
      - VITE_API_URL=https://api.yourdomain.com
    restart: unless-stopped
    networks:
      - nunchi-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: nunchi-backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/nunchi_forum
      - JWT_SECRET=${JWT_SECRET}
      - REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET}
      - PORT=3001
      - LOG_LEVEL=info
    restart: unless-stopped
    depends_on:
      - db
    networks:
      - nunchi-network

  db:
    image: postgres:16-alpine
    container_name: nunchi-db
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=nunchi_forum
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - nunchi-network

  # 可选：Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: nunchi-redis
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - nunchi-network

  # 可选：Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: nunchi-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - nunchi-network

volumes:
  postgres_data:
  redis_data:

networks:
  nunchi-network:
    driver: bridge
```

### 3. Dockerfile 示例

#### 后端 Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 复制源代码
COPY . .

# 构建
RUN npm run build

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["npm", "start"]
```

#### 后端生产 Dockerfile

```dockerfile
# backend/Dockerfile.prod
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 生产镜像
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3001

USER node

CMD ["node", "dist/app.js"]
```

### 4. 环境变量配置

创建 `.env` 文件：

```env
# 数据库
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_jwt_secret_key_min_32_chars
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# 可选：外部服务
SENTRY_DSN=
EMAIL_SERVICE_API_KEY=
```

### 5. 常用命令

```bash
# 构建并启动
docker-compose up -d --build

# 仅启动特定服务
docker-compose up -d backend db

# 查看日志
docker-compose logs -f backend

# 重启服务
docker-compose restart backend

# 停止所有服务
docker-compose down

# 停止并删除数据卷（慎用）
docker-compose down -v

# 执行数据库迁移
docker-compose exec backend npm run db:migrate

# 进入容器
docker-compose exec backend sh
```

---

## 生产环境配置

### 1. 服务器准备

#### 系统要求

- **OS**: Ubuntu 22.04 LTS / CentOS 8 / Debian 11
- **CPU**: 2+ cores
- **RAM**: 4GB+
- **Disk**: 20GB+

#### 安全设置

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y fail2ban ufw

# 配置防火墙
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 2. 反向代理配置

#### Nginx 配置

```nginx
# /etc/nginx/sites-available/nunchi-forum
server {
    listen 80;
    server_name yourdomain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # 前端静态文件
    location / {
        root /var/www/nunchi-forum/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/nunchi-forum /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL 证书

使用 Let's Encrypt：

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 4. 数据库备份

#### 自动备份脚本

```bash
#!/bin/bash
# /opt/backup/backup.sh

BACKUP_DIR="/opt/backup/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="nunchi_forum"
DB_USER="postgres"
RETENTION_DAYS=7

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
docker exec nunchi-db pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# 删除旧备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# 可选：上传到云存储
# aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-backup-bucket/
```

添加定时任务：

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 2点备份
0 2 * * * /opt/backup/backup.sh >> /var/log/backup.log 2>&1

### 5. 监控与日志

#### 使用 PM2（非 Docker 部署）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start dist/app.js --name nunchi-backend

# 保存配置
pm2 save
pm2 startup

# 监控
pm2 monit

# 查看日志
pm2 logs nunchi-backend
```

#### Docker 日志管理

```bash
# 配置日志轮转
sudo tee /etc/logrotate.d/nunchi-docker << 'LOGROTATE'
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
LOGROTATE
```

### 6. CI/CD 配置

#### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/nunchi-forum
          git pull origin main
          docker-compose -f docker-compose.prod.yml down
          docker-compose -f docker-compose.prod.yml up -d --build
          docker-compose exec -T backend npm run db:migrate
