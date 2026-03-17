import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { JWTPayload } from '../types/index.js';

// 认证插件
const authPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // 验证 JWT 的装饰器
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return reply.status(401).send({
          success: false,
          error: '未提供认证令牌'
        });
      }
      
      const decoded = await request.jwtVerify<JWTPayload>();
      (request as any).user = decoded;
    } catch (err) {
      return reply.status(401).send({
        success: false,
        error: '无效的认证令牌'
      });
    }
  });

  // 验证管理员权限的装饰器
  fastify.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload | undefined;
    
    if (!user) {
      return reply.status(401).send({
        success: false,
        error: '未认证'
      });
    }
    
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return reply.status(403).send({
        success: false,
        error: '需要管理员权限'
      });
    }
  });
};

export default fp(authPlugin, { name: 'auth-plugin' });
