import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { validateEnv } from "../config/env.js";
import { Doctor } from "../models/Doctor.js";
import { seedDoctorsData } from "./seedDoctorsData.js";
import { additionalDoctorsData } from "./additionalDoctorsData.js";

async function main() {
  const availabilityOnly = process.argv.includes("--availability-only");
  const dryRun = process.argv.includes("--dry-run");
  // Keep the explicit legacy schedule-maintenance mode scoped to its six doctors.
  const doctors = availabilityOnly
    ? seedDoctorsData
    : [...seedDoctorsData, ...additionalDoctorsData];
  if (new Set(doctors.map((doctor) => doctor.slug)).size !== doctors.length)
    throw new Error("Duplicate doctor slugs in seed data.");

  // Validate locally before any connection or write, including in dry-run mode.
  for (const doctor of doctors) await new Doctor(doctor).validate();
  if (dryRun) {
    console.table(
      doctors.map((doctor) => ({
        slug: doctor.slug,
        specialty: doctor.specialty,
        city: doctor.clinic?.city,
        priceEUR: doctor.pricePerHour,
        action: availabilityOnly ? "Update availability" : "Insert if missing",
      })),
    );
    console.log(
      "Dry run: local validation only; no database connection or writes. Existing records are not inspected.",
    );
    return;
  }

  validateEnv();
  await connectDB();
  if (availabilityOnly) {
    const count = await Doctor.countDocuments({
      slug: { $in: seedDoctorsData.map((doctor) => doctor.slug) },
    });
    if (count !== seedDoctorsData.length)
      throw new Error(
        "Expected all six existing doctors; no records were updated.",
      );
  }
  const now = new Date();
  const ops = doctors.map((doctor) => ({
    updateOne: {
      filter: { slug: doctor.slug },
      update: availabilityOnly
        ? {
            $set: {
              workingHours: doctor.workingHours,
              timeZone: doctor.timeZone,
            },
          }
        : { $setOnInsert: { ...doctor, createdAt: now, updatedAt: now } },
      upsert: !availabilityOnly,
      // Mongoose must not update updatedAt on already-existing profiles.
      timestamps: availabilityOnly,
    },
  }));

  const result = await Doctor.bulkWrite(ops);

  console.log({
    matched: result.matchedCount,
    modified: result.modifiedCount,
    upserted: result.upsertedCount,
  });
  await mongoose.connection.close();
  console.log(`Processed ${doctors.length} doctor seed profiles`);
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.connection.close().catch(() => undefined);
  process.exit(1);
});
