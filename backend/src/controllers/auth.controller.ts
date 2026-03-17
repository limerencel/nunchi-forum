import { FastifyRequest, FastifyReply } from 'fastify';
import { registerUser, loginUser, refreshToken, getCurrentUser } from '../services/auth.service.js';
import { RegisterBody, LoginBody, JWTPayload } from '../types/index.js';

// 注册
export async function register(
  request: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply
) {
  try {
    const { username, email, password } = request.body;

    if (!username || !email || !password) {
      return reply.status(400).send({
        success: false,
        error: '用户名、邮箱和密码不能为空'
      });
    }

    if (username.length < 3 || username.length > 32) {
      return reply.status(400).send({
        success: false,
        error: '用户名长度必须在 3-32 个字符之间'
      });
    }

    if (password.length < 6) {
      return reply.status(400).send({
        success: false,
        error: '密码长度至少为 6 个字符'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return reply.status(400).send({
        success: false,
        error: '邮箱格式不正确'
      });
    }

    const result = await registerUser(username, email, password, request.server);

    return reply.status(201).send({
      success: true,
      data: result,
      message: '注册成功'
    });
  } catch (error: any) {
    return reply.status(400).send({
      success: false,
      error: error.message || '注册失败'
    });
  }
}

// 登录
export async function login(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply
) {
  try {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.status(400).send({
        success: false,
        error: '用户名和密码不能为空'
      });
    }

    const result = await loginUser(username, password, request.server);

    return reply.send({
      success: true,
      data: result,
      message: '登录成功'
    });
  } catch (error: any) {
    return reply.status(401).send({
      success: false,
      error: error.message || '登录失败'
    });
  }
}

// 刷新 token
export async function refresh(
  request: FastifyRequest<{ Body: { refreshToken: string } }>,
  reply: FastifyReply
) {
  try {
    const { refreshToken: token } = request.body;

    if (!token) {
      return reply.status(400).send({
        success: false,
        error: '刷新令牌不能为空'
      });
    }

    const tokens = await refreshToken(token, request.server);

    return reply.send({
      success: true,
      data: tokens,
      message: '令牌刷新成功'
    });
  } catch (error: any) {
    return reply.status(401).send({
      success: false,
      error: error.message || '令牌刷新失败'
    });
  }
}

// 获取当前用户信息
export async function getMe(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const user = request.user as JWTPayload;
    const userInfo = await getCurrentUser(user.userId);

    return reply.send({
      success: true,
      data: userInfo
    });
  } catch (error: any) {
    return reply.status(400).send({
      success: false,
      error: error.message || '获取用户信息失败'
    });
  }
}
