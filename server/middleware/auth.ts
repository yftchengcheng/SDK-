import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';

export const JWT_SECRET = process.env.JWT_SECRET || 'ad-sdk-aggregation-secret-key-2024';
const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  developerId: string;
  email: string;
}

export interface AuthRequest extends Request {
  developerId: string;
  email: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export interface DeveloperContext {
  developerId: string;
  email: string;
  accessType: number;
}

/**
 * 解析请求方所属开发者上下文（每次回源 DB，保证 accessType 实时）。
 * 失败时 accessType 默认 1 (SDK)。
 */
export async function getDeveloperContext(req: Request): Promise<DeveloperContext> {
  const authReq = req as AuthRequest;
  const { data } = await db
    .from('developer')
    .select('access_type')
    .eq('developer_id', authReq.developerId)
    .maybeSingle();
  return {
    developerId: authReq.developerId,
    email: authReq.email,
    accessType: (data?.access_type as number | undefined) ?? 1,
  };
}

/** 同步版（向后兼容）：从请求对象上取，只含 JWT 字段。accessType 不再由此提供。 */
export function getDeveloper(req: Request): { developerId: string; email: string } {
  const authReq = req as AuthRequest;
  return { developerId: authReq.developerId, email: authReq.email };
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ code: 401, message: '未登录或Token已过期' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const payload = verifyToken(token);
    (req as AuthRequest).developerId = payload.developerId;
    (req as AuthRequest).email = payload.email;
    next();
  } catch {
    res.status(401).json({ code: 401, message: 'Token无效或已过期' });
  }
}
