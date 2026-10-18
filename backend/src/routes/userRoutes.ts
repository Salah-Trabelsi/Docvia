import { Router } from 'express'
import { getProfile, updateProfile } from '../controllers/userController.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { avatarUpload } from '../middleware/avatarUpload.js'
import { uploadAvatar } from '../controllers/avatarController.js'

const router = Router()
router.use(requireAuth)
router.get('/me', getProfile)
router.patch('/me', updateProfile)
router.post('/me/avatar', avatarUpload, uploadAvatar)
export default router
