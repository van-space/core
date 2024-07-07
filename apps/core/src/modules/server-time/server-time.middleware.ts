import type { IncomingMessage, ServerResponse } from 'node:http'

export async function trackResponseTimeMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: Function,
) {
  const requestTimeFromHeader = Number(req.headers['x-request-time'])
  const now = !Number.isNaN(requestTimeFromHeader)
    ? requestTimeFromHeader
    : Date.now()

  res.setHeader('Content-Type', 'application/json')
  // cors
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Max-Age', '86400')
  await next()

  res.write(
    JSON.stringify({
      t2: now,
      t3: Date.now(),
    }),
  )

  res.end()
}
