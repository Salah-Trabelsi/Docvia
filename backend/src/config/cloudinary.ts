import { v2 as cloudinary } from 'cloudinary'
import { z } from 'zod'
import 'dotenv/config'

export function getCloudinary() {
  const env = z.object({
    CLOUDINARY_CLOUD_NAME: z.string().trim().min(1),
    CLOUDINARY_API_KEY: z.string().trim().min(1),
    CLOUDINARY_API_SECRET: z.string().trim().min(1),
  }).parse(process.env)
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  })
  return cloudinary
}
