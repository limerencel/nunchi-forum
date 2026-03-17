import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import 'dotenv/config';

// Import routes
import authRoutes from './routes/auth.js';
import boardRoutes from './routes/boards.js';
import threadRoutes from './routes/threads.js';
import postRoutes from './routes/posts.js';

// Import plugins
import authPlugin from './plugins/auth.js';

// Load environment variables
const PORT = parseInt(process.env.PORT || '3000');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const app = Fastify({
  logger: true
});

// Register plugins
await app.register(cors, {
  origin: CORS_ORIGIN,
  credentials: true
});

await app.register(jwt, {
  secret: JWT_SECRET
});

// Register auth plugin (adds authenticate and requireAdmin decorators)
await app.register(authPlugin);

// Health check route
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register API routes
await app.register(authRoutes, { prefix: '/api/v1/auth' });
await app.register(boardRoutes, { prefix: '/api/v1/boards' });
await app.register(threadRoutes, { prefix: '/api/v1' });
await app.register(postRoutes, { prefix: '/api/v1' });

// 404 handler
app.setNotFoundHandler((request, reply) => {
  reply.status(404).send({
    success: false,
    error: '接口不存在'
  });
});

// Error handler
app.setErrorHandler((error: any, request, reply) => {
  app.log.error(error);
  
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: '请求参数验证失败',
      details: error.message
    });
  }
  
  reply.status(error.statusCode || 500).send({
    success: false,
    error: error.message || '服务器内部错误'
  });
});

// Start server
const start = async () => {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`Server running on port ${PORT}`);
  } catch (err: any) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
