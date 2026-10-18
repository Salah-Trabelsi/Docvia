import type { Request, Response } from 'express'
import { User } from '../models/User.js'

export async function getMe(_req: Request, res: Response) {
  try {
    const user = await User.findById(res.locals.userId)
      .select('_id firstName lastName email role isActive')
    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Session account is unavailable.' })
      return
    }

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    })
  } catch {
    res.status(500).json({ message: 'Unable to retrieve account. Please try again later.' })
  }
}

export function logout(_req: Request, res: Response) {
  // Match login's cookie attributes; clearCookie supplies an expired date.
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
  res.set('Cache-Control', 'no-store')
  res.status(200).json({ message: 'Signed out.' })
}
