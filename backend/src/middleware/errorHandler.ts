import { Request, Response, NextFunction } from 'express'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if ('type' in err && err.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'Invalid JSON request body.' })
    return
  }
  console.error(err)
  res.status(500).json({ message: 'Internal server error' })
}
