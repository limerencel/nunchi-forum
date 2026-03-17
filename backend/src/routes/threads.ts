import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import {
  getThreadsByBoard,
  getThread,
  createThread,
  updateThread,
  deleteThread,
  pinThread,
  lockThread
} from '../controllers/thread.controller.js';

const threadRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // 获取板块下的帖子列表
  fastify.get('/boards/:boardId/threads', async (request: FastifyRequest, reply: FastifyReply) => {
    return getThreadsByBoard(request as any, reply);
  });

  // 获取帖子详情
  fastify.get('/threads/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    return getThread(request as any, reply);
  });

  // 创建帖子（需认证）
  fastify.post('/boards/:boardId/threads', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return createThread(request as any, reply);
  });

  // 更新帖子（需认证）
  fastify.put('/threads/:id', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return updateThread(request as any, reply);
  });

  // 删除帖子（需认证）
  fastify.delete('/threads/:id', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return deleteThread(request as any, reply);
  });

  // 置顶帖子（管理员）
  fastify.post('/threads/:id/pin', {
    onRequest: [fastify.authenticate, fastify.requireAdmin]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return pinThread(request as any, reply);
  });

  // 锁定帖子（管理员）
  fastify.post('/threads/:id/lock', {
    onRequest: [fastify.authenticate, fastify.requireAdmin]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return lockThread(request as any, reply);
  });
};

export default threadRoutes;
