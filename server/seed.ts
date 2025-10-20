import "dotenv/config";
import { db } from "./db";
import { users, therapists, therapistAvailability, therapistBookingSettings } from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const firstNames = [
  "Sarah", "Michael", "Jessica", "David", "Emily", "Christopher", "Ashley", "Matthew", "Amanda", "Joshua",
  "Jennifer", "Daniel", "Lisa", "Andrew", "Michelle", "James", "Maria", "Robert", "Laura", "William",
  "Rachel", "Joseph", "Nicole", "Ryan", "Elizabeth", "Brian", "Stephanie", "Kevin", "Rebecca", "Thomas",
  "Angela", "Eric", "Catherine", "Jason", "Melissa", "Jonathan", "Christine", "Mark", "Amy", "Steven",
  "Kimberly", "Timothy", "Anna", "Anthony", "Samantha", "Carlos", "Maya", "Ahmed", "Priya", "Li",
  "Yuki", "Hassan", "Fatima", "Chen", "Sofia", "Omar", "Aisha", "Diego", "Carmen", "Juan",
  "Isabella", "Mohammed", "Zara", "Wei", "Leila", "Raj", "Nadia", "Marcus", "Aaliyah", "Jamal",
  "Lucia", "Andre", "Gabriela", "Kwame", "Amara", "Hiroshi", "Sakura", "Ivan", "Natasha", "Pierre",
  "Camille", "Jorge", "Valentina", "Ali", "Yasmin", "Liam", "Sienna", "Noah", "Ava", "Ethan",
  "Mia", "Lucas", "Harper", "Alexander", "Evelyn", "Benjamin", "Abigail", "Henry", "Charlotte", "Sebastian"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
  "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes",
  "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper",
  "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
  "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes",
  "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross", "Foster", "Jimenez"
];

const cities = [
  { city: "New York", state: "NY", zip: "10001" },
  { city: "Los Angeles", state: "CA", zip: "90001" },
  { city: "Chicago", state: "IL", zip: "60601" },
  { city: "Houston", state: "TX", zip: "77001" },
  { city: "Phoenix", state: "AZ", zip: "85001" },
  { city: "Philadelphia", state: "PA", zip: "19101" },
  { city: "San Antonio", state: "TX", zip: "78201" },
  { city: "San Diego", state: "CA", zip: "92101" },
  { city: "Dallas", state: "TX", zip: "75201" },
  { city: "San Jose", state: "CA", zip: "95101" },
  { city: "Austin", state: "TX", zip: "73301" },
  { city: "Jacksonville", state: "FL", zip: "32099" },
  { city: "Fort Worth", state: "TX", zip: "76101" },
  { city: "Columbus", state: "OH", zip: "43085" },
  { city: "Indianapolis", state: "IN", zip: "46201" },
  { city: "Charlotte", state: "NC", zip: "28201" },
  { city: "San Francisco", state: "CA", zip: "94101" },
  { city: "Seattle", state: "WA", zip: "98101" },
  { city: "Denver", state: "CO", zip: "80201" },
  { city: "Boston", state: "MA", zip: "02101" },
  { city: "Portland", state: "OR", zip: "97201" },
  { city: "Miami", state: "FL", zip: "33101" },
  { city: "Atlanta", state: "GA", zip: "30301" },
  { city: "Nashville", state: "TN", zip: "37201" },
  { city: "Minneapolis", state: "MN", zip: "55401" }
];

const licenseTypes = ["LCSW", "LMFT", "LPC", "LPCC", "PhD", "PsyD", "LMHC", "LCPC"];
const credentials = ["MA", "MS", "PhD", "PsyD", "MSW", "LCSW", "LMFT", "LPC"];

const specialties = [
  "Anxiety", "Depression", "Trauma", "PTSD", "OCD", "ADHD",
  "Bipolar Disorder", "Eating Disorders", "Substance Abuse",
  "Grief", "Life Transitions", "Relationship Issues", "Self-Esteem",
  "Stress Management", "Anger Management", "Chronic Pain", "Sleep Disorders"
];

const therapyTypes = [
  "CBT", "DBT", "Psychodynamic", "EMDR", "IFS", "ACT",
  "Psychoanalysis", "Humanistic", "Narrative Therapy",
  "Solution-Focused", "Family Systems", "Gestalt"
];

const communities = [
  "LGBTQ+ Allied", "BIPOC", "Veterans", "First Responders",
  "Healthcare Workers", "Students", "Immigrants", "Disabled Community"
];

const sessionTypes = ["individual", "couples", "family", "group"];
const modalities = ["in-person", "telehealth", "phone"];
const ageGroups = ["children", "teens", "adults", "seniors"];

const insuranceProviders = [
  "Aetna", "Anthem", "Blue Cross Blue Shield", "Cigna", "Humana",
  "Kaiser Permanente", "Medicare", "Medicaid", "UnitedHealthcare"
];

const languages = ["English", "Spanish", "Mandarin", "French", "German", "Arabic", "Hindi", "Japanese", "Korean", "Portuguese"];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomChoices<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateTherapists() {
  console.log("🌱 Starting to seed database with 100 therapist profiles...");

  // Clear existing data (in reverse order due to foreign keys)
  console.log("🧹 Clearing existing data...");
  await db.delete(therapistAvailability);
  await db.delete(therapistBookingSettings);
  await db.delete(therapists);
  await db.delete(users).where(sql`role = 'therapist'`);
  console.log("✅ Existing therapist data cleared\n");

  const therapistData = [];
  const userData = [];

  for (let i = 0; i < 100; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i];
    const location = randomChoice(cities);
    const licenseType = randomChoice(licenseTypes);
    const credential = randomChoice(credentials);

    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@therapy.test`;
    const username = `therapist${i + 1}`;
    const password = `Test123!`; // Same password for all test accounts

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user account
    const [user] = await db.insert(users).values({
      email,
      password: hashedPassword,
      role: 'therapist'
    }).returning();

    // Create therapist profile
    const therapist = {
      userId: user.id,
      firstName,
      lastName,
      credentials: credential,
      email,
      phone: `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
      city: location.city,
      state: location.state,
      zipCode: location.zip,
      country: 'USA',

      // Licensing
      licenseType,
      licenseNumber: `${location.state}${randomInt(100000, 999999)}`,
      licenseState: location.state,
      npiNumber: `${randomInt(1000000000, 9999999999)}`,
      yearsInPractice: randomInt(1, 30),
      graduateSchool: randomChoice([
        "Columbia University", "NYU", "UCLA", "Stanford University",
        "University of Michigan", "Boston University", "Northwestern University",
        "University of Chicago", "University of Pennsylvania", "Yale University"
      ]),
      graduationYear: randomInt(1990, 2022),

      // Practice details
      bio: `I am a ${licenseType} with ${randomInt(1, 30)} years of experience helping clients navigate life's challenges. My approach is warm, collaborative, and evidence-based. I believe in creating a safe space where clients can explore their thoughts and feelings without judgment.`,
      therapeuticApproach: randomChoice([
        "Client-centered and integrative",
        "Evidence-based and solution-focused",
        "Holistic and mindfulness-based",
        "Trauma-informed and compassionate"
      ]),
      sessionTypes: randomChoices(sessionTypes, 1, 3),
      modalities: randomChoices(modalities, 1, 3),
      acceptingNewClients: Math.random() > 0.3,

      // Specializations
      topSpecialties: randomChoices(specialties, 2, 5),
      issuesTreated: randomChoices(specialties, 3, 8),
      communitiesServed: randomChoices(communities, 1, 4),
      ageGroups: randomChoices(ageGroups, 1, 3),
      therapyTypes: randomChoices(therapyTypes, 1, 4),
      treatmentOrientation: randomChoice(therapyTypes),

      // Languages
      languagesSpoken: Math.random() > 0.7
        ? randomChoices(languages, 1, 3)
        : ["English"],

      // Fees & Insurance
      individualSessionFee: randomChoice([100, 125, 150, 175, 200, 225, 250]),
      couplesSessionFee: randomChoice([150, 175, 200, 225, 250, 275, 300]),
      offersSlidingScale: Math.random() > 0.6,
      slidingScaleMin: Math.random() > 0.6 ? randomChoice([50, 60, 75, 80, 90]) : null,
      insuranceAccepted: Math.random() > 0.4
        ? randomChoices(insuranceProviders, 2, 6)
        : [],
      paymentMethods: ["credit card", "HSA", "FSA"],

      // Availability
      availableDays: randomChoices(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"], 3, 6),
      availableTimes: randomChoices(["morning", "afternoon", "evening"], 1, 3),
      waitlistStatus: Math.random() > 0.8,

      // Status
      profileStatus: Math.random() > 0.9 ? 'pending' : 'approved',
    };

    await db.insert(therapists).values(therapist);

    // Create M-F 9-5 availability for each therapist
    const availabilitySlots = [];
    for (let day = 1; day <= 5; day++) { // Monday (1) to Friday (5)
      availabilitySlots.push({
        therapistId: user.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        slotDuration: 60,
        isActive: true,
      });
    }
    await db.insert(therapistAvailability).values(availabilitySlots);

    // Create default booking settings
    await db.insert(therapistBookingSettings).values({
      therapistId: user.id,
      bookingMode: "instant", // Instant confirmation by default
      bufferTime: 0,
      advanceBookingDays: 30,
      minNoticeHours: 24,
      allowCancellation: true,
      cancellationHours: 24,
      emailNotifications: true,
    });

    userData.push({
      username,
      email,
      password: 'Test123!',
      name: `${firstName} ${lastName}`,
      credentials: `${credential}, ${licenseType}`,
      location: `${location.city}, ${location.state}`
    });

    if ((i + 1) % 10 === 0) {
      console.log(`✅ Created ${i + 1}/100 therapist profiles with M-F 9-5 availability...`);
    }
  }

  console.log("\n🎉 Successfully created 100 therapist profiles!");
  console.log("📅 All therapists have M-F 9AM-5PM availability with 60-minute sessions");
  console.log("⚙️  All therapists have instant booking enabled");
  console.log("\n📋 Login Credentials Summary:");
  console.log("━".repeat(80));
  console.log("All therapist accounts use the same password: Test123!");
  console.log("━".repeat(80));
  console.log("\nSample login credentials:\n");

  userData.slice(0, 10).forEach((user, idx) => {
    console.log(`${idx + 1}. ${user.name} (${user.credentials})`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Location: ${user.location}`);
    console.log("");
  });

  console.log("... and 90 more therapists!");
  console.log("\n💾 Saving credentials list to file...");

  // Save all credentials to a file
  const fs = await import('fs/promises');
  await fs.writeFile(
    'therapist-credentials.txt',
    `KareMatch - Test Therapist Credentials
${"=".repeat(80)}

All accounts use password: Test123!

${"=".repeat(80)}

${userData.map((user, idx) =>
  `${idx + 1}. ${user.name} (${user.credentials})
   Email: ${user.email}
   Username: ${user.username}
   Location: ${user.location}
   Password: Test123!
`).join("\n")}
`,
    'utf-8'
  );

  console.log("✅ Credentials saved to therapist-credentials.txt");
}

generateTherapists()
  .then(() => {
    console.log("\n✨ Database seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  });
