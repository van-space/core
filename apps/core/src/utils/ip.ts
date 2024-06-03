// @ts-expect-error
import { FastifyRequest } from 'fastify';
import { IncomingMessage } from 'http';

export const getIp = (request: FastifyRequest | IncomingMessage) => {
  const _ = request as any;

  let ip: string =
    _.headers['x-forwarded-for'] ||
    _.ip ||
    _.raw.connection.remoteAddress ||
    _.raw.socket.remoteAddress ||
    undefined;
  if (ip && ip.split(',').length > 0) {
    ip = ip.split(',')[0];
  }
  return ip;
};
