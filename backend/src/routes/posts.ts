import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import {
  getPostsByThread,
  createPost,
  updatePost,
  deletePost
} from '../controllers/post.controller.js';

const postRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // 获取帖子回复列表
  fastify.get('/threads/:threadId/posts', async (request: FastifyRequest, reply: FastifyReply) => {
    return getPostsByThread(request as any, reply);
  });

  // 创建回复（需认证）
  fastify.post('/threads/:threadId/posts', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return createPost(request as any, reply);
  });

  // 更新回复（需认证）
  fastify.put('/posts/:id', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return updatePost(request as any, reply);
  });

  // 删除回复（需认证）
  fastify.delete('/posts/:id', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return deletePost(request as any, reply);
  });
};

export default postRoutes;
