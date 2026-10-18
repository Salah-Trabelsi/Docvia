import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import { validateEnv } from '../config/env.js'
import { Doctor } from '../models/Doctor.js'
import { seedDoctorsData } from './seedDoctorsData.js'

const env = validateEnv()

async function main() {
  await connectDB()

  const ops = seedDoctorsData.map((doctor) => ({
    updateOne: {
      filter: { slug: doctor.slug },
      update: { $set: doctor },
      upsert: true,
    },
  }))

const result = await Doctor.bulkWrite(ops)

console.log({
  matched: result.matchedCount,
  modified: result.modifiedCount,
  upserted: result.upsertedCount,
})
  await mongoose.connection.close()
  console.log(`Seeded ${seedDoctorsData.length} doctors`)
}

main().catch(async (err) => {
  console.error(err)
  await mongoose.connection.close().catch(() => undefined)
  process.exit(1)
})
