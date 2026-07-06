import crypto from 'crypto';

const BASE62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const TOKEN_LENGTH = 16;
const API_TOKEN_LENGTH = 32;

function generateRandomString(length: number): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += BASE62[bytes[i]! % 62];
  }
  return result;
}

export function genDeveloperId(): string {
  return 'dev_' + generateRandomString(TOKEN_LENGTH);
}

export function genAppKey(): string {
  return 'app_' + generateRandomString(TOKEN_LENGTH);
}

export function genPlacementId(): string {
  return 'pl_' + generateRandomString(TOKEN_LENGTH);
}

export function genApiAccessToken(): string {
  return 'api_' + generateRandomString(API_TOKEN_LENGTH);
}
