import { z } from "zod";
import { isIP } from "node:net";
import "dotenv/config";

const trustedProxy = z.string().refine((value) => {
  const [address, prefix, extra] = value.split("/");
  const family = isIP(address);
  return (
    family !== 0 &&
    extra === undefined &&
    (prefix === undefined ||
      (/^\d+$/.test(prefix) &&
        Number(prefix) > 0 &&
        Number(prefix) <= (family === 4 ? 32 : 128)))
  );
}, "Use explicit trusted proxy IP addresses or CIDRs (not blanket trust).");

const envSchema = z.object({
  TRUSTED_PROXY_CIDRS: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    )
    .pipe(z.array(trustedProxy)),
  PORT: z.string().default("3000"),
  MONGODB_URI: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must contain at least 32 characters"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM_VERIFY: z.string().default("Docvia <verify@docvia.space>"),
  EMAIL_FROM_SECURITY: z.string().default("Docvia <security@docvia.space>"),
  EMAIL_FROM_APPOINTMENTS: z
    .literal("Docvia <appointments@docvia.space>")
    .default("Docvia <appointments@docvia.space>"),
  APPOINTMENT_EMAIL_WORKER_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv() {
  return envSchema.parse(process.env);
}
