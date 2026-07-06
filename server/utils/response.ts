import type { Response } from 'express';

interface SuccessResponse {
  code: 0;
  data: unknown;
  message?: string;
}

interface ErrorResponse {
  code: number;
  message: string;
  data?: unknown;
}

export function success(res: Response, data: unknown, message?: string): void {
  const body: SuccessResponse = { code: 0, data };
  if (message) body.message = message;
  res.json(body);
}

export function fail(res: Response, code: number, message: string): void {
  const body: ErrorResponse = { code, message };
  res.status(code >= 100 && code < 600 ? code : 400).json(body);
}

export function paginate(
  res: Response,
  list: unknown[],
  total: number,
  page: number,
  pageSize: number
): void {
  res.json({
    code: 0,
    data: {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
