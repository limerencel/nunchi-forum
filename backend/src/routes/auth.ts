import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { register, login, refresh, getMe } from '../controllers/auth.controller.js';

const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // 用户注册
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    return register(request as any, reply);
  });

  // 用户登录
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    return login(request as any, reply);
  });

  // 刷新 token
  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    return refresh(request as any, reply);
  });

  // 获取当前用户信息（需认证）
  fastify.get('/me', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return getMe(request as any, reply);
  });
};

export default authRoutes;
