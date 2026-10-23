import type { IDoctor } from "../models/Doctor.js";

// Fictional portfolio profiles. Existing portraits are temporary placeholders:
// the first nine use female-presenting portraits, the last six male-presenting.
// No gender field is stored. City-centre coordinates are illustrative locations.
const cities: Record<string, [number, number]> = {
  "Baden-Baden": [8.2398, 48.7606],
  Rastatt: [8.2044, 48.8572],
  Offenburg: [7.9448, 48.4735],
  Bühl: [8.1356, 48.6967],
  Ettlingen: [8.4044, 48.9409],
  Karlsruhe: [8.4037, 49.0069],
};

interface FictionalProfile {
  slug: string;
  firstName: string;
  lastName: string;
  specialty: string;
  city: string;
  price: number;
  experience: number;
  languages: string[];
  portrait: string;
  duration: number;
  description: string;
}

const profiles: FictionalProfile[] = [
  {
    slug: "anna-weber",
    firstName: "Anna",
    lastName: "Weber",
    specialty: "Dermatology",
    city: "Baden-Baden",
    price: 65,
    experience: 9,
    languages: ["German", "English"],
    portrait: "Dr-Olivia-martinez.png",
    duration: 30,
    description:
      "Provides skin examinations and practical support for acne, eczema and sensitive skin. She explains treatment options clearly and develops manageable daily care routines with her patients.",
  },
  {
    slug: "sophie-schneider",
    firstName: "Sophie",
    lastName: "Schneider",
    specialty: "Neurology",
    city: "Rastatt",
    price: 85,
    experience: 14,
    languages: ["German", "English", "French"],
    portrait: "Dr-Laura-schmidt.png",
    duration: 45,
    description:
      "Focuses on headache assessment, migraine management and peripheral nerve symptoms. She takes time to understand symptom patterns and discusses follow-up care in accessible language.",
  },
  {
    slug: "emma-hoffmann",
    firstName: "Emma",
    lastName: "Hoffmann",
    specialty: "General Medicine",
    city: "Baden-Baden",
    price: 45,
    experience: 6,
    languages: ["German", "English"],
    portrait: "Dr-Sarah-ahmed.png",
    duration: 30,
    description:
      "Offers routine check-ups, preventive health advice and assessment of everyday health concerns. Her approach emphasizes continuity of care and realistic steps toward healthier habits.",
  },
  {
    slug: "laura-mueller",
    firstName: "Laura",
    lastName: "Müller",
    specialty: "Gynecology",
    city: "Offenburg",
    price: 80,
    experience: 12,
    languages: ["German", "English"],
    portrait: "Dr-Laura-schmidt.png",
    duration: 30,
    description:
      "Supports patients with preventive examinations, menstrual concerns and reproductive health questions. She creates a respectful setting for shared decisions and individualized care.",
  },
  {
    slug: "marie-laurent",
    firstName: "Marie",
    lastName: "Laurent",
    specialty: "Dermatology",
    city: "Rastatt",
    price: 55,
    experience: 10,
    languages: ["German", "French", "English"],
    portrait: "Dr-Olivia-martinez.png",
    duration: 30,
    description:
      "Provides care for inflammatory skin conditions, acne and sun-related skin concerns. She combines careful examinations with clear explanations of prevention and ongoing skin care.",
  },
  {
    slug: "sarah-bauer",
    firstName: "Sarah",
    lastName: "Bauer",
    specialty: "General Medicine",
    city: "Bühl",
    price: 50,
    experience: 8,
    languages: ["German", "English"],
    portrait: "Dr-Sarah-ahmed.png",
    duration: 30,
    description:
      "Provides general medical consultations, preventive check-ups and support for long-term health conditions. She values a thorough patient history and practical plans tailored to daily life.",
  },
  {
    slug: "julia-neumann",
    firstName: "Julia",
    lastName: "Neumann",
    specialty: "Orthopedics",
    city: "Baden-Baden",
    price: 75,
    experience: 16,
    languages: ["German", "English", "Italian"],
    portrait: "Dr-Laura-schmidt.png",
    duration: 30,
    description:
      "Assesses joint discomfort, back pain and movement limitations. She discusses conservative treatment options and rehabilitation goals to support mobility and a sustainable return to activity.",
  },
  {
    slug: "clara-meier",
    firstName: "Clara",
    lastName: "Meier",
    specialty: "ENT",
    city: "Rastatt",
    price: 60,
    experience: 11,
    languages: ["German", "English"],
    portrait: "Dr-Olivia-martinez.png",
    duration: 30,
    description:
      "Evaluates ear, nose and throat concerns, including sinus symptoms, hearing difficulties and voice changes. She explains examination findings and helps patients understand their next steps.",
  },
  {
    slug: "lena-schmidt",
    firstName: "Lena",
    lastName: "Schmidt",
    specialty: "Pediatrics",
    city: "Ettlingen",
    price: 65,
    experience: 7,
    languages: ["German", "English", "Spanish"],
    portrait: "Dr-Sarah-ahmed.png",
    duration: 30,
    description:
      "Offers child health assessments, developmental check-ups and guidance for common childhood illnesses. She takes a calm, family-centered approach and welcomes questions from children and caregivers.",
  },
  {
    slug: "lukas-fischer",
    firstName: "Lukas",
    lastName: "Fischer",
    specialty: "Cardiology",
    city: "Karlsruhe",
    price: 90,
    experience: 15,
    languages: ["German", "English"],
    portrait: "Dr-Ethan-roberts.png",
    duration: 45,
    description:
      "Focuses on cardiovascular risk assessment, blood pressure management and heart health follow-up. He works with patients to understand their results and plan achievable preventive changes.",
  },
  {
    slug: "jonas-becker",
    firstName: "Jonas",
    lastName: "Becker",
    specialty: "Orthopedics",
    city: "Bühl",
    price: 70,
    experience: 10,
    languages: ["German", "English"],
    portrait: "Dr-Michael-braun.png",
    duration: 30,
    description:
      "Supports patients with sports-related injuries, joint pain and reduced mobility. His consultations emphasize careful assessment, rehabilitation planning and prevention of recurring problems.",
  },
  {
    slug: "felix-wagner",
    firstName: "Felix",
    lastName: "Wagner",
    specialty: "Dermatology",
    city: "Karlsruhe",
    price: 75,
    experience: 8,
    languages: ["German", "English", "French"],
    portrait: "Dr-Daniel-wilson.png",
    duration: 30,
    description:
      "Provides skin screening and consultations for acne, eczema and scalp concerns. He explains skin care choices and agrees on follow-up plans that reflect each patient's needs.",
  },
  {
    slug: "daniel-richter",
    firstName: "Daniel",
    lastName: "Richter",
    specialty: "Cardiology",
    city: "Offenburg",
    price: 95,
    experience: 19,
    languages: ["German", "English"],
    portrait: "Dr-Ethan-roberts.png",
    duration: 45,
    description:
      "Assesses heart-related symptoms and supports long-term cardiovascular care. He emphasizes clear explanations, preventive strategies and coordination with patients' primary care clinicians.",
  },
  {
    slug: "thomas-berger",
    firstName: "Thomas",
    lastName: "Berger",
    specialty: "ENT",
    city: "Karlsruhe",
    price: 65,
    experience: 13,
    languages: ["German", "English"],
    portrait: "Dr-Michael-braun.png",
    duration: 30,
    description:
      "Provides assessment of hearing concerns, recurrent sinus symptoms and throat discomfort. He discusses practical treatment options and helps patients make informed decisions about follow-up care.",
  },
  {
    slug: "karim-haddad",
    firstName: "Karim",
    lastName: "Haddad",
    specialty: "Neurology",
    city: "Karlsruhe",
    price: 90,
    experience: 12,
    languages: ["German", "English", "Arabic"],
    portrait: "Dr-Daniel-wilson.png",
    duration: 45,
    description:
      "Evaluates headaches, sensory symptoms and other neurological concerns. He listens carefully to each patient's history and explains assessment findings and management options step by step.",
  },
];

export const additionalDoctorsData: (IDoctor & { slug: string })[] =
  profiles.map((profile, index) => ({
    slug: profile.slug,
    firstName: profile.firstName,
    lastName: profile.lastName,
    specialty: profile.specialty,
    description: `Fictional demonstration profile. ${profile.description}`,
    imageUrl: `/images/doctors/Dr-${profile.slug}.png`,
    languages: profile.languages,
    consultationTypes: ["In-person"],
    pricePerHour: profile.price,
    currency: "EUR",
    yearsOfExperience: profile.experience,
    // Do not invent reviews or patient outcome statistics.
    ratingAverage: 0,
    ratingCount: 0,
    recoveredPatients: 0,
    inCarePatients: 0,
    clinic: {
      name: `Fictional ${profile.lastName} Practice`,
      streetAddress: "Illustrative city-centre location; not a real practice",
      city: profile.city,
      country: "Germany",
    },
    location: { type: "Point", coordinates: cities[profile.city] },
    // Every new doctor works Monday-Friday, with a one-hour lunch break.
    // The existing Saturday exception remains exclusive to Ethan and Laura Schmidt.
    workingHours: [1, 2, 3, 4, 5].flatMap((dayOfWeek) => [
      {
        dayOfWeek,
        startTime: index % 2 === 0 ? "09:00" : "08:30",
        endTime: index % 2 === 0 ? "12:00" : "11:30",
      },
      {
        dayOfWeek,
        startTime: index % 2 === 0 ? "13:00" : "12:30",
        endTime: index % 2 === 0 ? "16:00" : "15:30",
      },
    ]),
    timeZone: "Europe/Berlin",
    dateExceptions: [],
    consultationDurationMinutes: profile.duration,
    acceptingNewPatients: true,
    isActive: true,
  }));
