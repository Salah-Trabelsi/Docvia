import 'dotenv/config'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function main() {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM_VERIFY!,
    to: 'trabelsii33salah@gmail.com',
    subject: 'Docvia - Email Test',
    text: 'Hello! Your Docvia email service is working correctly.',
  })

  if (error) {
    console.error('Email failed:', error)
    process.exitCode = 1
    return
  }

  console.log('Email submitted:', data?.id)
}

main().catch(console.error)