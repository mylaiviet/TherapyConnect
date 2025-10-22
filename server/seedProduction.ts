import "dotenv/config";
import { db } from "./db";
import { users, therapists } from "@shared/schema";
import {
  SPECIALTIES,
  MODALITIES,
  SESSION_TYPES,
  AGE_GROUPS,
  INSURANCE_PROVIDERS,
  COMMUNITIES_SERVED,
  GENDER_OPTIONS,
  CERTIFICATIONS,
  SESSION_LENGTHS,
  VIRTUAL_PLATFORMS,
  THERAPY_TYPES,
  PAYMENT_METHODS,
} from "@shared/schema";
import bcrypt from "bcryptjs";

const AVATAR_BASE = "https://api.dicebear.com/7.x/avataaars/svg?seed=";

// Helper functions
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomChoices = <T>(arr: T[], min: number, max: number): T[] => {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomBool = (probability: number = 0.5) => Math.random() < probability;

const credentials = ["PhD", "PsyD", "LCSW", "LPC", "LMFT", "MD"];
const licenseTypes = ["Professional Counselor", "Clinical Social Worker", "Marriage & Family Therapist", "Psychologist", "Psychiatrist"];
const theoreticalOrientations = ["Cognitive Behavioral", "Psychodynamic", "Humanistic", "Integrative", "Solution-Focused"];
const languages = ["English", "Spanish", "Mandarin", "French", "Arabic", "Hindi", "Portuguese", "Russian"];
const raceEthnicityOptions = ["White/Caucasian", "Black/African American", "Hispanic/Latino", "Asian", "Middle Eastern", "Native American", "Pacific Islander", "Multiracial"];
const religiousOrientations = ["Christian", "Jewish", "Muslim", "Hindu", "Buddhist", "Secular", "Spiritual but not religious"];

// Sample names for 50 therapists
const firstNames = [
  "Sarah", "Michael", "Jessica", "David", "Emily", "Christopher", "Ashley", "Matthew", "Amanda", "Joshua",
  "Jennifer", "Daniel", "Lisa", "Andrew", "Michelle", "James", "Maria", "Robert", "Laura", "William",
  "Rachel", "Joseph", "Nicole", "Ryan", "Elizabeth", "Brian", "Stephanie", "Kevin", "Rebecca", "Thomas",
  "Angela", "Eric", "Catherine", "Jason", "Melissa", "Jonathan", "Christine", "Mark", "Amy", "Steven",
  "Kimberly", "Timothy", "Anna", "Anthony", "Samantha", "Carlos", "Maya", "Ahmed", "Priya", "Li"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"
];

// Key cities for testing
const cities = [
  { city: "Austin", state: "TX", zip: "78701" },
  { city: "Houston", state: "TX", zip: "77001" },
  { city: "Dallas", state: "TX", zip: "75201" },
  { city: "San Antonio", state: "TX", zip: "78201" },
  { city: "New York", state: "NY", zip: "10001" },
  { city: "Los Angeles", state: "CA", zip: "90001" },
  { city: "Chicago", state: "IL", zip: "60601" },
  { city: "Seattle", state: "WA", zip: "98101" },
  { city: "Miami", state: "FL", zip: "33101" },
  { city: "Boston", state: "MA", zip: "02101" },
];

async function seedProductionData() {
  try {
    console.log("\n🌱 Starting PRODUCTION database seeding...\n");

    // Check if data already exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("⚠️  Database already contains data. Skipping seed to avoid duplicates.");
      console.log("   Run 'npm run db:push' with '--force' flag to reset database first.");
      return;
    }

    // ============================================
    // STEP 1: Create Test Accounts
    // ============================================
    console.log("👤 Creating test accounts...\n");

    // Test Therapist Account
    const therapistPassword = await bcrypt.hash("password123", 10);
    const [testTherapistUser] = await db.insert(users).values({
      email: "therapist@test.com",
      password: therapistPassword,
      role: "therapist",
    }).returning();

    await db.insert(therapists).values({
      userId: testTherapistUser.id,
      firstName: "Test",
      lastName: "Therapist",
      credentials: "PhD",
      email: "therapist@test.com",
      phone: "(555) 123-4567",
      streetAddress: "123 Test Street",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      country: "USA",
      licenseType: "Psychologist",
      licenseState: "TX",
      licenseNumber: "TX123456",
      npiNumber: "1234567890",
      yearsInPractice: 10,
      topSpecialties: ["Anxiety", "Depression", "Trauma"],
      issuesTreated: ["Anxiety", "Depression", "Trauma", "Stress"],
      sessionTypes: ["Individual", "Couples"],
      modalities: ["in-person", "virtual"],
      ageGroups: ["Adults", "Seniors"],
      therapyTypes: ["CBT", "Psychodynamic"],
      treatmentOrientation: "Cognitive Behavioral",
      therapeuticApproach: "I use evidence-based CBT techniques to help clients develop practical coping skills.",
      insuranceAccepted: ["Blue Cross Blue Shield", "Aetna", "United Healthcare"],
      individualSessionFee: 150,
      couplesSessionFee: 200,
      paymentMethods: ["Insurance", "Credit Card", "Cash"],
      communitiesServed: ["LGBTQ+"],
      languages: ["English"],
      acceptingNewClients: true,
      availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      availableTimes: ["morning", "afternoon"],
      gender: "Non-Binary",
      dateOfBirth: "1985-06-15",
      raceEthnicity: ["White/Caucasian"],
      religiousOrientation: "Secular",
      certifications: ["Board Certified"],
      primaryTheoreticalOrientation: "Cognitive Behavioral",
      yearsSinceGraduation: 15,
      sessionLengthOptions: ["45 minutes", "60 minutes"],
      currentWaitlistWeeks: 0,
      wheelchairAccessible: true,
      parkingAvailable: true,
      publicTransitNearby: true,
      aslCapable: false,
      serviceAnimalFriendly: true,
      virtualPlatforms: ["Zoom", "Google Meet"],
      slidingScaleFee: true,
      slidingScaleMin: 75,
      consultationOffered: true,
      consultationDuration: 15,
      superbillProvided: true,
      fsaHsaAccepted: true,
      acceptsCreditCards: true,
      additionalStatesLicensed: ["TX", "CA"],
      professionalMemberships: ["APA", "NASW"],
      bio: "Test Therapist is a dedicated mental health professional with 10 years of experience. Specializing in anxiety, depression, and trauma using evidence-based cognitive behavioral therapy.",
      photoUrl: `${AVATAR_BASE}${encodeURIComponent("Test Therapist")}&backgroundColor=b6e3f4`,
      profileStatus: "approved",
    });

    console.log("   ✅ Test therapist created: therapist@test.com / password123");

    // Test Admin Account
    const adminPassword = await bcrypt.hash("admin123", 10);
    const [testAdminUser] = await db.insert(users).values({
      email: "admin@test.com",
      password: adminPassword,
      role: "admin",
    }).returning();

    await db.insert(therapists).values({
      userId: testAdminUser.id,
      firstName: "Admin",
      lastName: "User",
      credentials: "MD",
      email: "admin@test.com",
      phone: "(555) 999-9999",
      streetAddress: "999 Admin Ave",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      country: "USA",
      licenseType: "Psychiatrist",
      licenseState: "TX",
      licenseNumber: "TX999999",
      npiNumber: "9999999999",
      yearsInPractice: 20,
      topSpecialties: ["Administration"],
      issuesTreated: ["General"],
      sessionTypes: ["Individual"],
      modalities: ["in-person"],
      ageGroups: ["Adults"],
      therapyTypes: ["Psychodynamic"],
      insuranceAccepted: [],
      individualSessionFee: 200,
      languages: ["English"],
      acceptingNewClients: false,
      profileStatus: "approved",
    });

    console.log("   ✅ Test admin created: admin@test.com / admin123\n");

    // ============================================
    // STEP 2: Create 50 Sample Therapists
    // ============================================
    console.log("👥 Creating 50 sample therapist profiles...\n");

    let created = 0;
    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[i];
      const lastName = lastNames[i];
      const city = cities[i % cities.length];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@therapist.com`;
      const fullName = `${firstName} ${lastName}`;

      const password = await bcrypt.hash("password123", 10);
      const [user] = await db.insert(users).values({
        email,
        password,
        role: "therapist",
      }).returning();

      const isVirtualProvider = randomBool(0.4);

      await db.insert(therapists).values({
        userId: user.id,
        firstName,
        lastName,
        credentials: randomChoice(credentials),
        email,
        phone: `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`,
        streetAddress: `${randomInt(100, 9999)} ${randomChoice(["Main", "Oak", "Maple", "Pine"])} St`,
        city: city.city,
        state: city.state,
        zipCode: city.zip,
        country: "USA",
        licenseType: randomChoice(licenseTypes),
        licenseState: city.state,
        licenseNumber: `${city.state}${randomInt(100000, 999999)}`,
        npiNumber: `${randomInt(1000000000, 1999999999)}`,
        yearsInPractice: randomInt(2, 30),
        topSpecialties: randomChoices(SPECIALTIES, 3, 5),
        issuesTreated: randomChoices(SPECIALTIES, 4, 8),
        sessionTypes: randomChoices(SESSION_TYPES, 1, 2),
        modalities: isVirtualProvider ? ["virtual", ...randomChoices(MODALITIES.filter(m => m !== "virtual"), 0, 1)] : randomChoices(MODALITIES, 1, 2),
        ageGroups: randomChoices(AGE_GROUPS, 2, 3),
        therapyTypes: randomChoices(THERAPY_TYPES, 2, 4),
        treatmentOrientation: randomChoice(theoreticalOrientations),
        therapeuticApproach: `Using ${randomChoice(theoreticalOrientations)} therapy to help clients achieve their goals.`,
        insuranceAccepted: randomChoices(INSURANCE_PROVIDERS, 2, 5),
        individualSessionFee: randomInt(100, 200),
        couplesSessionFee: randomInt(120, 250),
        paymentMethods: randomChoices(PAYMENT_METHODS, 2, 3),
        communitiesServed: randomChoices(COMMUNITIES_SERVED, 0, 2),
        languages: ["English", ...randomChoices(languages.filter(l => l !== "English"), 0, 1)],
        acceptingNewClients: randomBool(0.75),
        availableDays: randomChoices(["monday", "tuesday", "wednesday", "thursday", "friday"], 3, 5),
        availableTimes: randomChoices(["morning", "afternoon", "evening"], 1, 2),
        gender: randomChoice(GENDER_OPTIONS),
        dateOfBirth: `${randomInt(1960, 1990)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
        raceEthnicity: randomChoices(raceEthnicityOptions, 1, 2),
        religiousOrientation: randomChoice(religiousOrientations),
        certifications: randomChoices(CERTIFICATIONS, 1, 3),
        primaryTheoreticalOrientation: randomChoice(theoreticalOrientations),
        yearsSinceGraduation: randomInt(3, 35),
        sessionLengthOptions: randomChoices(SESSION_LENGTHS, 2, 3),
        currentWaitlistWeeks: randomBool(0.7) ? 0 : randomInt(1, 4),
        wheelchairAccessible: randomBool(0.5),
        parkingAvailable: randomBool(0.7),
        publicTransitNearby: randomBool(0.6),
        aslCapable: randomBool(0.15),
        serviceAnimalFriendly: randomBool(0.8),
        virtualPlatforms: isVirtualProvider ? randomChoices(VIRTUAL_PLATFORMS, 1, 2) : [],
        slidingScaleFee: randomBool(0.5),
        slidingScaleMin: randomBool(0.5) ? randomInt(50, 100) : null,
        consultationOffered: randomBool(0.6),
        consultationDuration: randomBool(0.6) ? 15 : null,
        superbillProvided: randomBool(0.7),
        fsaHsaAccepted: randomBool(0.8),
        acceptsCreditCards: randomBool(0.9),
        additionalStatesLicensed: [city.state],
        professionalMemberships: randomChoices(["APA", "NASW", "AAMFT", "ACA"], 1, 2),
        bio: `${fullName} is a ${randomChoice(credentials)} with ${randomInt(2, 30)} years of experience specializing in ${randomChoices(SPECIALTIES, 2, 3).join(", ")}.`,
        photoUrl: `${AVATAR_BASE}${encodeURIComponent(fullName)}&backgroundColor=b6e3f4`,
        profileStatus: "approved",
      });

      created++;
      if (created % 10 === 0) {
        console.log(`   ✓ Created ${created}/50 therapists...`);
      }
    }

    console.log(`\n✅ Successfully seeded production database!`);
    console.log(`   👤 2 test accounts (therapist + admin)`);
    console.log(`   👥 50 sample therapist profiles`);
    console.log(`   📸 All profiles have professional avatars\n`);

    console.log("🔑 Test Credentials:");
    console.log("   Therapist: therapist@test.com / password123");
    console.log("   Admin: admin@test.com / admin123");
    console.log("   Sample: sarah.smith@therapist.com / password123\n");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

seedProductionData()
  .then(() => {
    console.log("🎉 Production seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });
