import { Router } from 'express'
import { login, register, resendVerification, verifyEmail } from '../controllers/authController.js'
import { verificationRateLimit } from '../middleware/verificationRateLimit.js'
import { getMe, logout } from '../controllers/sessionController.js'
import { protectCsrf, requireAuth } from '../middleware/requireAuth.js'

const router = Router()
router.post('/register', register)
router.post('/login', login)
router.get('/me', requireAuth, getMe)
router.post('/logout', protectCsrf, logout)
router.post('/verify-email', verificationRateLimit(), protectCsrf, verifyEmail)
router.post('/resend-verification', verificationRateLimit(), protectCsrf, resendVerification)
export default router
