import { isObject } from 'lodash';

export * from './ip.util';
export const isDev = process.env.NODE_ENV == 'development';

export const md5 = (text: string) =>
  require('crypto').createHash('md5').update(text).digest('hex');
export function getAvatar(mail: string) {
  if (!mail) {
    return '';
  }
  return `https://sdn.geekzu.org/avatar/${md5(mail)}?d=retro`;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function hasChinese(str: string) {
  return escape(str).indexOf('%u') < 0 ? false : true;
}

export const escapeShell = function (cmd: string) {
  return '"' + cmd.replace(/(["\s'$`\\])/g, '\\$1') + '"';
};

export function arrDifference(a1: string[], a2: string[]) {
  const a = [],
    diff = [];

  for (let i = 0; i < a1.length; i++) {
    a[a1[i]] = true;
  }

  for (let i = 0; i < a2.length; i++) {
    if (a[a2[i]]) {
      delete a[a2[i]];
    } else {
      a[a2[i]] = true;
    }
  }

  for (const k in a) {
    diff.push(k);
  }

  return diff;
}

export function deleteKeys<T extends KV>(
  target: T,
  keys: (keyof T)[],
): Partial<T>;
export function deleteKeys<T extends KV>(
  target: T,
  keys: readonly (keyof T)[],
): Partial<T>;
export function deleteKeys<T extends KV>(
  target: T,
  ...keys: string[]
): Partial<T>;
export function deleteKeys<T extends KV>(
  target: T,
  ...keys: any[]
): Partial<T> {
  if (!isObject(target)) {
    throw new TypeError('target must be Object, got ' + target);
  }

  if (Array.isArray(keys[0])) {
    for (const key of keys[0]) {
      Reflect.deleteProperty(target, key);
    }
  } else {
    for (const key of keys) {
      Reflect.deleteProperty(target, key);
    }
  }

  return target;
}
