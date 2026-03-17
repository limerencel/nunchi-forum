import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { threads, posts, boards, users, Post, NewPost } from '../db/schema.js';
import { eq, desc, asc, and, sql } from 'drizzle-orm';
import { CreatePostBody, UpdatePostBody, JWTPayload } from '../types/index.js';

// 获取帖子回复列表
export async function getPostsByThread(
  request: FastifyRequest<{
    Params: { threadId: string };
    Querystring: { page?: string; limit?: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { threadId } = request.params;
    const page = parseInt(request.query.page || '1');
    const limit = Math.min(parseInt(request.query.limit || '20'), 100);
    const offset = (page - 1) * limit;

    // 检查帖子是否存在
    const thread = await db.select().from(threads).where(
      and(eq(threads.id, threadId), eq(threads.isDeleted, false))
    ).limit(1);

    if (thread.length === 0) {
      return reply.status(404).send({
        success: false,
        error: '帖子不存在'
      });
    }

    // 获取回复列表
    const postsList = await db.select({
      post: posts,
      author: {
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        role: users.role
      }
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(and(
      eq(posts.threadId, threadId),
      eq(posts.isDeleted, false)
    ))
    .orderBy(asc(posts.createdAt))
    .limit(limit)
    .offset(offset);

    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(and(
        eq(posts.threadId, threadId),
        eq(posts.isDeleted, false)
      ));
    const total = totalResult[0]?.count || 0;

    // 格式化返回数据
    const formattedPosts = postsList.map(p => ({
      ...p.post,
      author: p.author
    }));

    return reply.send({
      success: true,
      data: {
        items: formattedPosts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || '获取回复列表失败'
    });
  }
}

// 创建回复
export async function createPost(
  request: FastifyRequest<{
    Params: { threadId: string };
    Body: CreatePostBody;
  }>,
  reply: FastifyReply
) {
  try {
    const { threadId } = request.params;
    const { content, parentId } = request.body;
    const user = request.user as JWTPayload;

    if (!content || content.length < 2) {
      return reply.status(400).send({
        success: false,
        error: '回复内容不能为空，且至少为 2 个字符'
      });
    }

    // 检查帖子是否存在
    const thread = await db.select().from(threads).where(
      and(eq(threads.id, threadId), eq(threads.isDeleted, false))
    ).limit(1);

    if (thread.length === 0) {
      return reply.status(404).send({
        success: false,
        error: '帖子不存在'
      });
    }

    const threadData = thread[0];

    // 检查帖子是否被锁定
    if (threadData.isLocked) {
      return reply.status(403).send({
        success: false,
        error: '帖子已被锁定，无法回复'
      });
    }

    // 如果指定了父回复，检查父回复是否存在
    if (parentId) {
      const parentPost = await db.select().from(posts).where(
        and(
          eq(posts.id, parentId),
          eq(posts.threadId, threadId),
          eq(posts.isDeleted, false)
        )
      ).limit(1);

      if (parentPost.length === 0) {
        return reply.status(404).send({
          success: false,
          error: '父回复不存在'
        });
      }
    }

    // 创建回复
    const newPostResult = await db
      .insert(posts)
      .values({
        threadId,
        authorId: user.userId,
        parentId: parentId || null,
        content,
        likeCount: 0,
        isDeleted: false
      } as NewPost)
      .returning();
    
    const newPost = newPostResult[0];

    // 更新帖子回复数和最后回复信息
    await db
      .update(threads)
      .set({
        replyCount: sql`${threads.replyCount} + 1`,
        lastReplyAt: new Date(),
        lastReplyUserId: user.userId,
        updatedAt: new Date()
      })
      .where(eq(threads.id, threadId));

    // 更新板块回复数
    await db
      .update(boards)
      .set({
        postCount: sql`${boards.postCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(boards.id, threadData.boardId));

    // 返回完整回复信息
    const postWithAuthor = await db.select({
      post: posts,
      author: {
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        role: users.role
      }
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, newPost.id))
    .limit(1);

    return reply.status(201).send({
      success: true,
      data: {
        ...postWithAuthor[0].post,
        author: postWithAuthor[0].author
      },
      message: '回复创建成功'
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || '创建回复失败'
    });
  }
}

// 更新回复
export async function updatePost(
  request: FastifyRequest<{
    Params: { id: string };
    Body: UpdatePostBody;
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const { content } = request.body;
    const user = request.user as JWTPayload;

    if (!content || content.length < 2) {
      return reply.status(400).send({
        success: false,
        error: '回复内容不能为空，且至少为 2 个字符'
      });
    }

    // 检查回复是否存在
    const post = await db.select().from(posts).where(
      and(eq(posts.id, id), eq(posts.isDeleted, false))
    ).limit(1);

    if (post.length === 0) {
      return reply.status(404).send({
        success: false,
        error: '回复不存在'
      });
    }

    const postData = post[0];

    // 检查权限（只有作者或管理员可以更新）
    if (postData.authorId !== user.userId && user.role !== 'admin' && user.role !== 'moderator') {
      return reply.status(403).send({
        success: false,
        error: '没有权限更新此回复'
      });
    }

    // 检查帖子是否被锁定
    const thread = await db.select().from(threads).where(eq(threads.id, postData.threadId)).limit(1);

    if (thread.length > 0 && thread[0].isLocked && user.role !== 'admin' && user.role !== 'moderator') {
      return reply.status(403).send({
        success: false,
        error: '帖子已被锁定，无法更新回复'
      });
    }

    const [updatedPost] = await db
      .update(posts)
      .set({
        content,
        updatedAt: new Date()
      })
      .where(eq(posts.id, id))
      .returning();

    return reply.send({
      success: true,
      data: updatedPost,
      message: '回复更新成功'
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || '更新回复失败'
    });
  }
}

// 删除回复
export async function deletePost(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const user = request.user as JWTPayload;

    // 检查回复是否存在
    const post = await db.select().from(posts).where(
      and(eq(posts.id, id), eq(posts.isDeleted, false))
    ).limit(1);

    if (post.length === 0) {
      return reply.status(404).send({
        success: false,
        error: '回复不存在'
      });
    }

    const postData = post[0];

    // 检查权限（只有作者或管理员可以删除）
    if (postData.authorId !== user.userId && user.role !== 'admin' && user.role !== 'moderator') {
      return reply.status(403).send({
        success: false,
        error: '没有权限删除此回复'
      });
    }

    // 软删除
    await db
      .update(posts)
      .set({
        isDeleted: true,
        updatedAt: new Date()
      })
      .where(eq(posts.id, id));

    // 更新帖子回复数
    await db
      .update(threads)
      .set({
        replyCount: sql`GREATEST(${threads.replyCount} - 1, 0)`,
        updatedAt: new Date()
      })
      .where(eq(threads.id, postData.threadId));

    // 更新板块回复数
    const thread = await db.select().from(threads).where(eq(threads.id, postData.threadId)).limit(1);

    if (thread.length > 0) {
      await db
        .update(boards)
        .set({
          postCount: sql`GREATEST(${boards.postCount} - 1, 0)`,
          updatedAt: new Date()
        })
        .where(eq(boards.id, thread[0].boardId));
    }

    return reply.send({
      success: true,
      message: '回复删除成功'
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || '删除回复失败'
    });
  }
}
