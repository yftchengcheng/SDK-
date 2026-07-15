/**
 * 内存缓存（基于 node-cache）
 * 用途：聚合 API 5 分钟缓存、验证码 token 等
 */
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 300, // 5 分钟
  checkperiod: 60,
  useClones: false,
});

export default cache;
