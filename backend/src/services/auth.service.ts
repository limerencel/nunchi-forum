import { db } from '../db/index.js';
import { users, User, NewUser } from '../db/schema.js';
import { eq, or } from 'drizzle-orm';
import bcrypt from '../utils/crypto.js';
import { FastifyInstance } from 'fastify';
import { JWTPayload } from '../types/index.js';

// 用户注册
export async function registerUser(
  username: string,
  email: string,
  password: string,
  fastify: FastifyInstance
): Promise<{ user: Omit<User, 'passwordHash'>; tokens: { accessToken: string; refreshToken: string } }> {
  // 检查用户名或邮箱是否已存在
  const existingUser = await db.select().from(users).where(
    or(eq(users.username, username), eq(users.email, email))
  ).limit(1);

  if (existingUser.length > 0) {
    throw new Error('用户名或邮箱已存在');
  }

  // 加密密码
  const passwordHash = await bcrypt.hash(password, 10);

  // 创建用户
  const [newUser] = await db
    .insert(users)
    .values({
      username,
      email,
      passwordHash,
      status: 'active'
    } as NewUser)
    .returning();

  // 生成令牌
  const payload: JWTPayload = {
    userId: newUser.id,
    username: newUser.username,
    role: newUser.role
  };

  const accessToken = fastify.jwt.sign(payload, { expiresIn: '15m' });
  const refreshToken = fastify.jwt.sign(payload, { expiresIn: '7d' });

  // 排除 passwordHash 返回
  const { passwordHash: _, ...userWithoutPassword } = newUser;

  return {
    user: userWithoutPassword as User,
    tokens: { accessToken, refreshToken }
  };
}

// 用户登录
export async function loginUser(
  username: string,
  password: string,
  fastify: FastifyInstance
): Promise<{ user: Omit<User, 'passwordHash'>; tokens: { accessToken: string; refreshToken: string } }> {
  // 查找用户
  const userResult = await db.select().from(users).where(eq(users.username, username)).limit(1);
  
  if (userResult.length === 0) {
    throw new Error('用户名或密码错误');
  }
  
  const user = userResult[0];

  // 验证密码
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error('用户名或密码错误');
  }

  // 检查用户状态
  if (user.status === 'banned') {
    throw new Error('账户已被封禁');
  }

  // 更新最后登录时间
  await db
    .update(users)
    .set({ lastLogin: new Date() })
    .where(eq(users.id, user.id));

  // 生成令牌
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role
  };

  const accessToken = fastify.jwt.sign(payload, { expiresIn: '15m' });
  const refreshToken = fastify.jwt.sign(payload, { expiresIn: '7d' });

  // 排除 passwordHash 返回
  const { passwordHash: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword as User,
    tokens: { accessToken, refreshToken }
  };
}

// 刷新令牌
export async function refreshToken(
  token: string,
  fastify: FastifyInstance
): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const decoded = fastify.jwt.verify<JWTPayload>(token);
    
    // 验证用户是否仍然存在
    const userResult = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    
    if (userResult.length === 0) {
      throw new Error('用户不存在');
    }
    
    const user = userResult[0];

    if (user.status === 'banned') {
      throw new Error('用户已被封禁');
    }

    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    const accessToken = fastify.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = fastify.jwt.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new Error('无效的刷新令牌');
  }
}

// 获取当前用户信息
export async function getCurrentUser(userId: string): Promise<Omit<User, 'passwordHash'>> {
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (userResult.length === 0) {
    throw new Error('用户不存在');
  }
  
  const user = userResult[0];

  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}
