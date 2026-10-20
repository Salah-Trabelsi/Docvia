import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { validateEnv } from "../config/env.js";
import { Doctor } from "../models/Doctor.js";
import { seedDoctorsData } from "./seedDoctorsData.js";

validateEnv();

async function main() {
  await connectDB();

  const availabilityOnly = process.argv.includes("--availability-only");
  if (availabilityOnly) {
    const count = await Doctor.countDocuments({
      slug: { $in: seedDoctorsData.map((doctor) => doctor.slug) },
    });
    if (count !== seedDoctorsData.length)
      throw new Error(
        "Expected all six existing doctors; no records were updated.",
      );
  }
  const ops = seedDoctorsData.map(({ workingHours, timeZone, ...profile }) => ({
    updateOne: {
      filter: { slug: profile.slug },
      update: {
        $set: { workingHours, timeZone },
        ...(!availabilityOnly ? { $setOnInsert: profile } : {}),
      },
      upsert: !availabilityOnly,
    },
  }));

  const result = await Doctor.bulkWrite(ops);

  console.log({
    matched: result.matchedCount,
    modified: result.modifiedCount,
    upserted: result.upsertedCount,
  });
  await mongoose.connection.close();
  console.log(`Seeded ${seedDoctorsData.length} doctors`);
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.connection.close().catch(() => undefined);
  process.exit(1);
});
