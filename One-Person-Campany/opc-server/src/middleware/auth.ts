import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { fail } from '../utils/response.js';

export type JwtPayload = {
  userId: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}

export function signToken(userId: bigint) {
  return jwt.sign({ userId: userId.toString() }, getJwtSecret(), {
    expiresIn: '7d',
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json(fail(40101, '未登录'));
    return;
  }

  try {
    const payload = jwt.verify(
      header.slice(7),
      getJwtSecret(),
    ) as JwtPayload;
    req.auth = payload;
    next();
  } catch {
    res.status(401).json(fail(40101, '登录已失效，请重新登录'));
  }
}

export function getAuthUserId(req: Request): bigint {
  if (!req.auth?.userId) {
    throw new Error('Missing auth');
  }
  return BigInt(req.auth.userId);
}

/** 公开接口：有合法 token 则写入 req.auth，否则匿名继续 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(
      header.slice(7),
      getJwtSecret(),
    ) as JwtPayload;
    req.auth = payload;
  } catch {
    // 无效 token 按未登录处理
  }
  next();
}
