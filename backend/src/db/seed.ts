import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  users,
  boards,
  threads,
  posts,
  userRoleEnum,
  userStatusEnum,
} from './schema.js';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'nunchi_forum',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const db = drizzle(pool);

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // 创建初始板块
    console.log('Creating boards...');
    const [generalBoard] = await db
      .insert(boards)
      .values({
        name: '综合讨论',
        slug: 'general',
        description: '一般性话题讨论区',
        sortOrder: 1,
      })
      .returning();

    const [techBoard] = await db
      .insert(boards)
      .values({
        name: '技术交流',
        slug: 'tech',
        description: '技术分享与讨论',
        sortOrder: 2,
      })
      .returning();

    const [helpBoard] = await db
      .insert(boards)
      .values({
        name: '求助问答',
        slug: 'help',
        description: '问题求助与解答',
        sortOrder: 3,
      })
      .returning();

    console.log('✅ Boards created');

    // 创建示例用户
    console.log('Creating users...');
    const [adminUser] = await db
      .insert(users)
      .values({
        username: 'admin',
        email: 'admin@nunchi-forum.com',
        passwordHash: '$2b$10$YourHashedPasswordHere', // 需要替换为实际哈希值
        role: 'admin',
        status: 'active',
        bio: '论坛管理员',
      })
      .returning();

    const [demoUser] = await db
      .insert(users)
      .values({
        username: 'demo_user',
        email: 'demo@example.com',
        passwordHash: '$2b$10$YourHashedPasswordHere',
        role: 'user',
        status: 'active',
        bio: '示例用户',
      })
      .returning();

    console.log('✅ Users created');

    // 创建示例主题
    console.log('Creating threads...');
    const [welcomeThread] = await db
      .insert(threads)
      .values({
        boardId: generalBoard.id,
        authorId: adminUser.id,
        title: '欢迎来到 Nunchi Forum！',
        content: '这是 Nunchi Forum 的官方欢迎帖。\n\n在这里你可以：\n- 参与技术讨论\n- 分享你的经验\n- 寻求帮助\n\n请遵守社区规范，友善交流！',
        viewCount: 100,
        replyCount: 2,
      })
      .returning();

    const [techThread] = await db
      .insert(threads)
      .values({
        boardId: techBoard.id,
        authorId: demoUser.id,
        title: '如何学习 TypeScript？',
        content: '大家好，我想学习 TypeScript，有什么好的学习资源推荐吗？',
        viewCount: 50,
        replyCount: 1,
      })
      .returning();

    console.log('✅ Threads created');

    // 创建示例回复
    console.log('Creating posts...');
    await db.insert(posts).values([
      {
        threadId: welcomeThread.id,
        authorId: demoUser.id,
        content: '感谢创建这个论坛！期待在这里和大家交流。',
      },
      {
        threadId: welcomeThread.id,
        authorId: adminUser.id,
        content: '欢迎！有任何问题都可以在这里提问。',
        parentId: null,
      },
      {
        threadId: techThread.id,
        authorId: adminUser.id,
        content: '推荐从官方文档开始：https://www.typescriptlang.org/docs/\n\n另外，实践是最好的学习方式！',
      },
    ]);

    console.log('✅ Posts created');

    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
