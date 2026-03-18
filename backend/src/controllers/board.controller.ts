import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { boards, threads, Board, NewBoard } from '../db/schema.js';
import { eq, desc, asc, sql } from 'drizzle-orm';
import { CreateBoardBody, UpdateBoardBody, JWTPayload } from '../types/index.js';

// 获取板块列表
export async function getBoards(
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>,
  reply: FastifyReply
) {
  try {
    const page = parseInt(request.query.page || '1');
    const limit = Math.min(parseInt(request.query.limit || '20'), 100);
    const offset = (page - 1) * limit;

    const boardsList = await db.select().from(boards)
      .orderBy(asc(boards.sortOrder), desc(boards.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(boards);
    const total = totalResult[0]?.count || 0;

    return reply.send({
      success: true,
      forums: boardsList,
      pagination: {
        items: boardsList,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || '获取板块列表失败'
    });
  }
}

// 获取板块详情
export async function getBoard(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;

    const boardResult = await db.select().from(boards).where(eq(boards.id, id)).limit(1);
    
    if (boardResult.length === 0) {
      return reply.status(404).send({
        success: false,
        error: '板块不存在'
      });
    }

    return reply.send({
      success: true,
      forum: boardResult[0]
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || '获取板块详情失败'
    });
  }
}

// 创建板块
export async function createBoard(
  request: FastifyRequest<{ Body: CreateBoardBody }>,
  reply: FastifyReply
) {
  try {
    const { name, slug, description, sortOrder } = request.body;

    if (!name || !slug) {
      return reply.status(400).send({
        success: false,
        error: '板块名称和标识不能为空'
      });
    }

    if (slug.length < 2 || !/^[a-z0-9-]+$/.test(slug)) {
      return reply.status(400).send({
        success: false,
        error: '板块标识只能包含小写字母、数字和连字符，且至少2个字符'
      });
    }

    // 检查 slug 是否已存在
    const existingBoard = await db.select().from(boards).where(eq(boards.slug, slug)).limit(1);

    if (existingBoard.length > 0) {
      return reply.status(409).send({
        success: false,
        error: '板块标识已存在'
      });
    }

    const [newBoard] = await db
      .insert(boards)
      .values({
        name,
        slug,
        description,
        sortOrder: sortOrder || 0
      } as NewBoard)
      .returning();

    return reply.status(201).send({
      success: true,
      forum: newBoard,
      message: '板块创建成功'
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || '创建板块失败'
    });
  }
}

// 更新板块
export async function updateBoard(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateBoardBody }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const { name, slug, description, sortOrder } = request.body;

    // 检查板块是否存在
    const existingBoard = await db.select().from(boards).where(eq(boards.id, id)).limit(1);

    if (existingBoard.length === 0) {
      return reply.status(404).send({
        success: false,
        error: '板块不存在'
      });
    }

    // 如果更新 slug，检查是否与其他板块冲突
    if (slug && slug !== existingBoard[0].slug) {
      if (slug.length < 2 || !/^[a-z0-9-]+$/.test(slug)) {
        return reply.status(400).send({
          success: false,
          error: '板块标识只能包含小写字母、数字和连字符，且至少2个字符'
        });
      }

      const slugExists = await db.select().from(boards).where(eq(boards.slug, slug)).limit(1);

      if (slugExists.length > 0) {
        return reply.status(409).send({
          success: false,
          error: '板块标识已存在'
        });
      }
    }

    const [updatedBoard] = await db
      .update(boards)
      .set({
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(sortOrder !== undefined && { sortOrder }),
        updatedAt: new Date()
      })
      .where(eq(boards.id, id))
      .returning();

    return reply.send({
      success: true,
      forum: updatedBoard,
      message: '板块更新成功'
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || '更新板块失败'
    });
  }
}

// 删除板块
export async function deleteBoard(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;

    // 检查板块是否存在
    const board = await db.select().from(boards).where(eq(boards.id, id)).limit(1);

    if (board.length === 0) {
      return reply.status(404).send({
        success: false,
        error: '板块不存在'
      });
    }

    // 删除板块（级联删除相关帖子和回复）
    await db.delete(boards).where(eq(boards.id, id));

    return reply.send({
      success: true,
      message: '板块删除成功'
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || '删除板块失败'
    });
  }
}
