import { Router } from 'express'
import { getProfile, updateProfile } from '../controllers/userController.js'
import { requireAuth,protectCsrf  } from '../middleware/requireAuth.js'
import { avatarUpload } from '../middleware/avatarUpload.js'
import { uploadAvatar } from '../controllers/avatarController.js'
import { changePassword } from '../controllers/changePasswordController.js'
import { verificationRateLimit } from '../middleware/verificationRateLimit.js'
import { requestEmailChange } from '../controllers/emailChangeController.js'
import { deleteAccount } from '../controllers/deleteAccountController.js'

const router = Router()
router.use(requireAuth)
router.get('/me', getProfile)
router.patch('/me', updateProfile)
router.delete('/me', verificationRateLimit(),  protectCsrf, deleteAccount)
router.post('/me/avatar', avatarUpload, uploadAvatar)
router.post('/me/change-password', verificationRateLimit(), protectCsrf, changePassword)
router.post('/me/request-email-change', verificationRateLimit(), protectCsrf, requestEmailChange)
export default router
