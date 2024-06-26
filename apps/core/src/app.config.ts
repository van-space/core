import type { AxiosRequestConfig } from 'axios';
import yargs from 'yargs';
const argv = yargs.argv as any;
console.log(argv);

export const API_VERSION = 2;
export const CROSS_DOMAIN = {
  allowedOrigins: [
    'innei.ren',
    'shizuri.net',
    'localhost:9528',
    'localhost:2323',
    '127.0.0.1',
    'mbp.cc',
    'local.innei.test',
    '22333322.xyz',
  ],
  allowedReferer: 'innei.ren',
};

export const MONGO_DB = {
  collectionName: (argv.collection_name as string) || 'mx-space',
  get uri() {
    return `mongodb://${argv.db_host || '127.0.0.1'}:${
      argv.db_port || '27017'
    }/${process.env.TEST ? 'mx-space_unitest' : this.collectionName}`;
  },
};

export const REDIS = {
  host: argv.redis_host || 'localhost',
  port: argv.redis_port || 6379,
  password: (argv.redis_password || null) as string,
  ttl: null,
  httpCacheTTL: 5,
  max: 5,
  disableApiCache:
    (isDev || argv.disableCache) && !process.env['ENABLE_CACHE_DEBUG'],
};

export const AXIOS_CONFIG: AxiosRequestConfig = {
  timeout: 10000,
};

export const SECURITY = {
  jwtSecret: argv.jwtSecret || 'asjhczxiucipoiopiqm2376',
  jwtExpire: '7d',
  // 跳过登陆鉴权
  skipAuth: argv.skipAuth ?? false,
  get secret() {
    return this.jwtSecret;
  },
  // 必须 16 位
  salt: argv.salt || 'axczswrasxzfqxsa',
};
