import { Router } from 'express'
import { getDoctors, getDoctorBySlug } from '../controllers/doctorController.js'

const router = Router()
router.get('/', getDoctors)
router.get('/:slug', getDoctorBySlug)
export default router
