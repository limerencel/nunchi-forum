import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { boards, threads, posts, users, Thread, NewThread } from '../db/schema.js';
import { eq, desc, asc, and, sql } from 'drizzle-orm';
import { CreateThreadBody, UpdateThreadBody, JWTPayload } from '../types/index.js';

// 获取板块下的帖子列表
export async function getThreadsByBoard(
  request: FastifyRequest<{
    Params: { boardId: string };
    Querystring: { page?: string; limit?: string; sort?: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { boardId } = request.params;
    const page = parseInt(request.query.page || '1');
    const limit = Math.min(parseInt(request.query.limit || '20'), 100);
    const sort = request.query.sort || 'latest';
    const offset = (page - 1) * limit;

    // 检查板块是否存在
    const board = await db.select().from(boards).where(eq(boards.id, boardId)).limit(1);

    if (board.length === 0) {
      return reply.status(404).send({
        success: false,
        error: '板块不存在'
      });
    }

    // 构建基础查询条件
    const whereCondition = and(
      eq(threads.boardId, boardId),
      eq(threads.isDeleted, false)
    );

    // 获取帖子列表（简化查询，避免复杂关联）
    let threadsList;
    if (sort === 'popular') {
      threadsList = await db.select({
        thread: threads,
        author: {
          id: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl
        }
      })
      .from(threads)
      .leftJoin(users, eq(threads.authorId, users.id))
      .where(whereCondition)
      .orderBy(desc(threads.viewCount), desc(threads.createdAt))
      .limit(limit)
      .offset(offset);
    } else if (sort === 'oldest') {
      threadsList = await db.select({
        thread: threads,
        author: {
          id: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl
        }
      })
      .from(threads)
      .leftJoin(users, eq(threads.authorId, users.id))
      .where(whereCondition)
      .orderBy(asc(threads.createdAt))
      .limit(limit)
      .offset(offset);
    } else {
      // latest
      threadsList = await db.select({
        thread: threads,
        author: {
          id: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl
        }
      })
      .from(threads)
      .leftJoin(users, eq(threads.authorId, users.id))
      .where(whereCondition)
      .orderBy(desc(threads.isPinned), desc(threads.lastReplyAt || threads.createdAt))
      .limit(limit)
      .offset(offset);
    }

    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(threads)
      .where(whereCondition);
    const total = totalResult[0]?.count || 0;

    // 格式化返回数据
    const formattedThreads = threadsList.map(t => ({
      ...t.thread,
      author: t.author
    }));

    return reply.send({
      success: true,
      data: {
        items: formattedThreads,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || '获取帖子列表失败'
    });
  }
}

// 获取帖子详情
export async function getThread(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;

    const threadResult = await db.select({
      thread: threads,
      author: {
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        bio: users.bio
      },
      board: {
        id: boards.id,
        name: boards.name,
        slug: boards.slug
      }
    })
    .from(threads)
    .leftJoin(users, eq(threads.authorId, users.id))
    .leftJoin(boards, eq(threads.boardId, boards.id))
    .where(and(
      eq(threads.id, id),
      eq(threads.isDeleted, false)
    ))
    .limit(1);

    if (threadResult.length === 0) {
      return reply.status(404).send({
        success: false,
        error: '帖子不存在'
      });
    }

    const { thread, author, board } = threadResult[0];

    // 增加浏览量
    await db
      .update(threads)
      .set({ viewCount: sql`${threads.viewCount} + 1` })
      .where(eq(threads.id, id));

    return reply.send({
      success: true,
      data: {
        ...thread,
        author,
        board
      }
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || '获取帖子详情失败'
    });
  }
}

// 创建帖子
export async function createThread(
  request: FastifyRequest<{
    Params: { boardId: string };
    Body: CreateThreadBody;
  }>,
  reply: FastifyReply
) {
  try {
    const { boardId } = request.params;
    const { title, content } = request.body;
    const user = request.user as JWTPayload;

    if (!title || !content) {
      return reply.status(400).send({
        success: false,
        error: '标题和内容不能为空'
      });
    }

    if (title.length < 5 || title.length > 200) {
      return reply.status(400).send({
        success: false,
        error: '标题长度必须在 5-200 个字符之间'
      });
    }

    if (content.length < 10) {
      return reply.status(400).send({
        success: false,
        error: '内容长度至少为 10 个字符'
      });
    }

    // 检查板块是否存在
    const board = await db.select().from(boards).where(eq(boards.id, boardId)).limit(1);

    if (board.length === 0) {
      return reply.status(404).send({
        success: false,
        error: '板块不存在'
      });
    }

    // 创建帖子
    const [newThread] = await db
      .insert(threads)
      .values({
        boardId,
        authorId: user.userId,
        title,
        content,
        replyCount: 0,
        viewCount: 0,
        likeCount: 0,
        bookmarkCount: 0,
        isPinned: false,
        isLocked: false,
        isDeleted: false
      } as NewThread)
      .returning();

    // 更新板块帖子数
    await db
      .update(boards)
      .set({
        threadCount: sql`${boards.threadCount} + 1`,
        postCount: sql`${boards.postCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(boards.id, boardId));

    return reply.status(201).send({
      success: true,
      data: newThread,
      message: '帖子创建成功'
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || '创建帖子失败'
    });
  }
}

// 更新帖子
export async function updateThread(
  request: FastifyRequest<{
    Params: { id: string };
    Body: UpdateThreadBody;
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const { title, content } = request.body;
    const user = request.user as JWTPayload;

    // 检查帖子是否存在
    const thread = await db.select().from(threads).where(
      and(eq(threads.id, id), eq(threads.isDeleted, false))
    ).limit(1);

    if (thread.length === 0) {
      return reply.status(404).send({
        success: false,
        error: '帖子不存在'
      });
    }

    const threadData = thread[0];

    // 检查权限（只有作者或管理员可以更新）
    if (threadData.authorId !== user.userId && user.role !== 'admin' && user.role !== 'moderator') {
      return reply.status(403).send({
        success: false,
        error: '没有权限更新此帖子'
      });
    }

    // 检查帖子是否被锁定
    if (threadData.isLocked && user.role !== 'admin' && user.role !== 'moderator') {
      return reply.status(403).send({
        success: false,
        error: '帖子已被锁定，无法更新'
      });
    }

    // 验证输入
    if (title && (title.length < 5 || title.length > 200)) {
      return reply.status(400).send({
        success: false,
        error: '标题长度必须在 5-200 个字符之间'
      });
    }

    if (content && content.length < 10) {
      return reply.status(400).send({
        success: false,
        error: '内容长度至少为 10 个字符'
      });    }

    const [updatedThread] = await db
      .update(threads)
      .set({
        ...(title && { title }),
        ...(content && { content }),
        updatedAt: new Date()
      })
      .where(eq(threads.id, id))
      .returning();

    return reply.send({
      success: true,
      data: updatedThread,
      message: '帖子更新成功'
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || '更新帖子失败'
    });
  }
}

// 删除帖子
export async function deleteThread(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const user = request.user as JWTPayload;

    // 检查帖子是否存在
    const thread = await db.select().from(threads).where(
      and(eq(threads.id, id), eq(threads.isDeleted, false))
    ).limit(1);

    if (thread.length === 0) {
      return reply.status(404).send({
        success: false,
        error: '帖子不存在'
      });
    }

    const threadData = thread[0];

    // 检查权限（只有作者或管理员可以删除）
    if (threadData.authorId !== user.userId && user.role !== 'admin' && user.role !== 'moderator') {
      return reply.status(403).send({
        success: false,
        error: '没有权限删除此帖子'
      });
    }

    // 软删除
    await db
      .update(threads)
      .set({
        isDeleted: true,
        updatedAt: new Date()
      })
      .where(eq(threads.id, id));

    // 更新板块帖子数和回复数
    await db
      .update(boards)
      .set({
        threadCount: sql`GREATEST(${boards.threadCount} - 1, 0)`,
        postCount: sql`GREATEST(${boards.postCount} - ${threadData.replyCount + 1}, 0)`,
        updatedAt: new Date()
      })
      .where(eq(boards.id, threadData.boardId));

    return reply.send({
      success: true,
      message: '帖子删除成功'
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || '删除帖子失败'
    });
  }
}

// 置顶帖子
export async function pinThread(
  request: FastifyRequest<{ Params: { id: string }; Body: { isPinned?: boolean } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const { isPinned = true } = request.body || {};

    // 检查帖子是否存在
    const thread = await db.select().from(threads).where(
      and(eq(threads.id, id), eq(threads.isDeleted, false))
    ).limit(1);

    if (thread.length === 0) {
      return reply.status(404).send({
        success: false,
        error: '帖子不存在'
      });
    }

    const [updatedThread] = await db
      .update(threads)
      .set({
        isPinned,
        updatedAt: new Date()
      })
      .where(eq(threads.id, id))
      .returning();

    return reply.send({
      success: true,
      data: updatedThread,
      message: isPinned ? '帖子置顶成功' : '帖子取消置顶成功'
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || '置顶操作失败'
    });
  }
}

// 锁定帖子
export async function lockThread(
  request: FastifyRequest<{ Params: { id: string }; Body: { isLocked?: boolean } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const { isLocked = true } = request.body || {};

    // 检查帖子是否存在
    const thread = await db.select().from(threads).where(
      and(eq(threads.id, id), eq(threads.isDeleted, false))
    ).limit(1);

    if (thread.length === 0) {
      return reply.status(404).send({
        success: false,
        error: '帖子不存在'
      });
    }

    const [updatedThread] = await db
      .update(threads)
      .set({
        isLocked,
        updatedAt: new Date()
      })
      .where(eq(threads.id, id))
      .returning();

    return reply.send({
      success: true,
      data: updatedThread,
      message: isLocked ? '帖子锁定成功' : '帖子解锁成功'
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || '锁定操作失败'
    });
  }
}
