import type { Request, Response, NextFunction } from 'express'

// Per-process IP limit; the account-level cooldown is enforced in MongoDB.
export function verificationRateLimit() {
  const requests = new Map<string, { count: number; resetAt: number }>()
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now()
    for (const [key, value] of requests) {
      if (value.resetAt <= now) requests.delete(key)
    }
    const key = req.ip ?? req.socket.remoteAddress ?? 'unknown'
    const entry = requests.get(key)
    if ((!entry && requests.size >= 10_000) || (entry && entry.count >= 10)) {
      res.set('Retry-After', String(Math.max(1, Math.ceil(((entry?.resetAt ?? now + 60_000) - now) / 1000))))
      res.status(429).json({ message: 'Too many requests. Please try again later.' })
      return
    }
    requests.set(key, { count: (entry?.count ?? 0) + 1, resetAt: entry?.resetAt ?? now + 15 * 60_000 })
    res.set('Cache-Control', 'no-store')
    next()
  }
}
