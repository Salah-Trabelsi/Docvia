import express from 'express'
import cors from 'cors'
import { validateEnv } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import healthRoutes from './routes/healthRoutes.js'
import doctorRoutes from './routes/doctorRoutes.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'

export const env = validateEnv()

const app = express()
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
app.use(express.json())
app.use('/api', healthRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use(errorHandler)

export default app
