import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard
} from '../controllers/board.controller.js';

const boardRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // 获取板块列表
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return getBoards(request as any, reply);
  });

  // 获取板块详情
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    return getBoard(request as any, reply);
  });

  // 创建板块（需认证）
  fastify.post('/', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return createBoard(request as any, reply);
  });

  // 更新板块（需认证）
  fastify.put('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return updateBoard(request as any, reply);
  });

  // 删除板块（需认证）
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    return deleteBoard(request as any, reply);
  });
};

export default boardRoutes;
