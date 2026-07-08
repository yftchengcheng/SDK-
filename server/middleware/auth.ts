import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, setSessionDeveloperId } from '../db';

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
  // 优先从 HttpOnly Cookie 读取 token（生产环境更安全，防 XSS）；
  // 其次回退到 Authorization: Bearer 头（兼容 SDK 直连 / 旧客户端）。
  const cookieToken: string | undefined = (req as Request & { cookies?: Record<string, string> }).cookies?.auth_token;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const token = cookieToken || bearerToken;

  if (!token) {
    res.status(401).json({ code: 401, message: '未登录或Token已过期' });
    return;
  }

  try {
    const payload = verifyToken(token);
    (req as AuthRequest).developerId = payload.developerId;
    (req as AuthRequest).email = payload.email;
    // 异步触发 RLS 上下文注入（不阻塞 next，fire-and-forget）
    void setSessionDeveloperId(payload.developerId);
    next();
  } catch {
    res.status(401).json({ code: 401, message: 'Token无效或已过期' });
  }
}

/** Cookie 配置：HttpOnly + SameSite=Strict；仅生产环境启用 Secure（HTTPS） */
export function setAuthCookie(res: Response, token: string): void {
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.COZE_PROJECT_ENV === 'PROD',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie('auth_token', { path: '/' });
}
