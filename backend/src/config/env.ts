import { z } from 'zod'
import "dotenv/config";

const envSchema = z.object({
  PORT: z.string().default('3000'),
  MONGODB_URI: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM_VERIFY: z.string().default('Docvia <verify@docvia.space>'),
  EMAIL_FROM_SECURITY: z.string().default('Docvia <security@docvia.space>'),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv() {
  return envSchema.parse(process.env)
}
