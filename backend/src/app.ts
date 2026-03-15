import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import 'dotenv/config';

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

// Health check route
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`Server running on port ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
