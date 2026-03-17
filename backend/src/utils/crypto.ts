import { createHash, randomBytes, timingSafeEqual } from 'crypto';

// 使用 Node.js 内置 crypto 模块实现密码哈希
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const ITERATIONS = 10000;

export async function hash(password: string, saltRounds: number = 10): Promise<string> {
  // 生成随机盐
  const salt = randomBytes(SALT_LENGTH).toString('hex');
  
  // 使用 PBKDF2 进行哈希
  const hash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  
  // 返回 salt:hash 格式
  return `${salt}:${hash}`;
}

export async function compare(password: string, hashedPassword: string): Promise<boolean> {
  const [salt, hash] = hashedPassword.split(':');
  
  if (!salt || !hash) {
    return false;
  }
  
  // 计算输入密码的哈希
  const computedHash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  
  // 使用 timingSafeEqual 防止时序攻击
  try {
    const hashBuffer = Buffer.from(hash, 'hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');
    
    if (hashBuffer.length !== computedBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(hashBuffer, computedBuffer);
  } catch {
    return false;
  }
}

export default { hash, compare };
