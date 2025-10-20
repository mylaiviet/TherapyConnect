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
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Professional cartoon avatar service (free API)
const AVATAR_BASE = "https://api.dicebear.com/7.x/avataaars/svg?seed=";

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
  "Mia", "Lucas", "Harper", "Alexander", "Evelyn", "Benjamin", "Abigail", "Henry", "Charlotte", "Sebastian",
  "Olivia", "Jackson", "Emma", "Aiden", "Sophia", "Mason", "Isabella", "Logan", "Zoe", "Elijah"
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

// Expanded city list with 30% Texas cities
const texasCities = [
  { city: "Houston", state: "TX", zip: "77001" },
  { city: "San Antonio", state: "TX", zip: "78201" },
  { city: "Dallas", state: "TX", zip: "75201" },
  { city: "Austin", state: "TX", zip: "78701" },
  { city: "Fort Worth", state: "TX", zip: "76101" },
  { city: "El Paso", state: "TX", zip: "79901" },
  { city: "Arlington", state: "TX", zip: "76010" },
  { city: "Corpus Christi", state: "TX", zip: "78401" },
  { city: "Plano", state: "TX", zip: "75074" },
  { city: "Laredo", state: "TX", zip: "78040" },
  { city: "Lubbock", state: "TX", zip: "79401" },
  { city: "Garland", state: "TX", zip: "75040" },
  { city: "Irving", state: "TX", zip: "75060" },
  { city: "Amarillo", state: "TX", zip: "79101" },
  { city: "Grand Prairie", state: "TX", zip: "75050" },
  { city: "Brownsville", state: "TX", zip: "78520" },
  { city: "McKinney", state: "TX", zip: "75069" },
  { city: "Frisco", state: "TX", zip: "75034" },
  { city: "Pasadena", state: "TX", zip: "77501" },
  { city: "Mesquite", state: "TX", zip: "75149" },
];

const otherCities = [
  { city: "New York", state: "NY", zip: "10001" },
  { city: "Los Angeles", state: "CA", zip: "90001" },
  { city: "Chicago", state: "IL", zip: "60601" },
  { city: "Phoenix", state: "AZ", zip: "85001" },
  { city: "Philadelphia", state: "PA", zip: "19101" },
  { city: "San Diego", state: "CA", zip: "92101" },
  { city: "San Jose", state: "CA", zip: "95101" },
  { city: "Jacksonville", state: "FL", zip: "32099" },
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
  { city: "Minneapolis", state: "MN", zip: "55401" },
  { city: "Detroit", state: "MI", zip: "48201" },
  { city: "Las Vegas", state: "NV", zip: "89101" },
  { city: "Baltimore", state: "MD", zip: "21201" },
  { city: "Milwaukee", state: "WI", zip: "53201" },
  { city: "Albuquerque", state: "NM", zip: "87101" },
  { city: "Tucson", state: "AZ", zip: "85701" },
  { city: "Fresno", state: "CA", zip: "93650" },
  { city: "Sacramento", state: "CA", zip: "95814" },
  { city: "Kansas City", state: "MO", zip: "64101" },
  { city: "Mesa", state: "AZ", zip: "85201" },
  { city: "Omaha", state: "NE", zip: "68101" },
  { city: "Raleigh", state: "NC", zip: "27601" },
  { city: "Virginia Beach", state: "VA", zip: "23450" },
  { city: "Oakland", state: "CA", zip: "94601" },
  { city: "Tampa", state: "FL", zip: "33601" },
  { city: "New Orleans", state: "LA", zip: "70112" },
  { city: "Cleveland", state: "OH", zip: "44101" },
  { city: "Honolulu", state: "HI", zip: "96801" },
  { city: "St. Louis", state: "MO", zip: "63101" },
  { city: "Pittsburgh", state: "PA", zip: "15201" },
];

const licenseTypes = ["LCSW", "LMFT", "LPC", "LPCC", "PhD", "PsyD", "LMHC", "LCPC", "LICSW"];
const credentials = ["MA, LMFT", "MS, LPC", "PhD", "PsyD", "MSW, LCSW", "MS, LMHC", "MA, LPCC"];

const theoreticalOrientations = [
  "Cognitive Behavioral (CBT)",
  "Psychodynamic",
  "Humanistic",
  "Integrative",
  "Trauma-Focused",
  "Solution-Focused Brief (SFBT)",
  "Dialectical Behavior (DBT)",
  "Attachment-Based",
  "Mindfulness-Based",
  "Person-Centered"
];

const raceEthnicityOptions = [
  "Asian", "Black/African American", "Hispanic/Latino", "Middle Eastern",
  "Native American", "Pacific Islander", "White/Caucasian", "Multiracial"
];

const religiousOrientations = [
  "Christian", "Jewish", "Muslim", "Hindu", "Buddhist", "Secular", "Spiritual but not religious", "Atheist/Agnostic"
];

const languages = [
  "English", "Spanish", "Mandarin", "French", "German", "Arabic", "Hindi",
  "Japanese", "Korean", "Portuguese", "Russian", "Italian", "Vietnamese", "Tagalog"
];

// Multi-state license combinations for virtual providers
const multiStateLicenses = [
  ["TX", "CA", "NY"],
  ["TX", "FL", "GA"],
  ["CA", "NY", "IL"],
  ["TX", "CO", "WA"],
  ["FL", "NC", "VA"],
  ["TX", "AZ", "NM"],
];

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

function randomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}

async function seedComprehensiveData() {
  console.log("🌱 Starting comprehensive database seeding...\n");

  try {
    // Clean existing data
    console.log("🧹 Cleaning existing therapist data...");
    await db.delete(therapists);
    await db.delete(users).where(sql`role = 'therapist'`);
    console.log("✅ Existing data cleaned\n");

    const TOTAL_THERAPISTS = 2000;
    const TEXAS_PERCENTAGE = 0.30;
    const TEXAS_COUNT = Math.floor(TOTAL_THERAPISTS * TEXAS_PERCENTAGE);

    console.log(`📊 Creating ${TOTAL_THERAPISTS} therapists:`);
    console.log(`   - ${TEXAS_COUNT} in Texas (30%)`);
    console.log(`   - ${TOTAL_THERAPISTS - TEXAS_COUNT} in other states (70%)\n`);

    let created = 0;
    const batchSize = 50;

    for (let i = 0; i < TOTAL_THERAPISTS; i++) {
      const isTexas = i < TEXAS_COUNT;
      const city = isTexas ? randomChoice(texasCities) : randomChoice(otherCities);

      const firstName = randomChoice(firstNames);
      const lastName = randomChoice(lastNames);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@therapist.com`;
      const fullName = `${firstName} ${lastName}`;

      // Create user account
      const hashedPassword = await bcrypt.hash("password123", 10);
      const [user] = await db.insert(users).values({
        email,
        password: hashedPassword,
        role: "therapist",
      }).returning();

      // Determine if virtual provider with multi-state license (30% chance)
      const isVirtualProvider = randomBool(0.3);
      const hasMultiStateLicense = isVirtualProvider && randomBool(0.7);

      let additionalStatesLicensed: string[] = [];
      if (hasMultiStateLicense) {
        const licenseCombo = randomChoice(multiStateLicenses);
        // Ensure home state is included
        additionalStatesLicensed = licenseCombo.includes(city.state)
          ? licenseCombo
          : [city.state, ...licenseCombo.slice(0, 2)];
      } else {
        additionalStatesLicensed = [city.state];
      }

      // Generate professional cartoon avatar
      const avatarUrl = `${AVATAR_BASE}${encodeURIComponent(fullName)}&backgroundColor=b6e3f4`;

      // Create comprehensive therapist profile
      await db.insert(therapists).values({
        userId: user.id,
        firstName,
        lastName,
        credentials: randomChoice(credentials),
        email,
        phone: `(${randomInt(200, 999)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`,

        // Location
        streetAddress: `${randomInt(100, 9999)} ${randomChoice(["Main", "Oak", "Maple", "Pine", "Cedar", "Elm"])} ${randomChoice(["St", "Ave", "Dr", "Blvd", "Way"])}`,
        city: city.city,
        state: city.state,
        zipCode: city.zip,
        country: "USA",

        // Professional Info
        licenseType: randomChoice(licenseTypes),
        licenseState: city.state,
        licenseNumber: `${city.state}${randomInt(100000, 999999)}`,
        npiNumber: `${randomInt(1000000000, 1999999999)}`,
        yearsInPractice: randomInt(2, 35),

        // Clinical Focus
        topSpecialties: randomChoices(SPECIALTIES, 3, 6),
        issuesTreated: randomChoices(SPECIALTIES, 4, 10),
        sessionTypes: randomChoices(SESSION_TYPES, 1, 3),
        modalities: isVirtualProvider
          ? ["virtual", ...randomChoices(MODALITIES.filter(m => m !== "virtual"), 0, 1)]
          : randomChoices(MODALITIES, 1, 2),
        ageGroups: randomChoices(AGE_GROUPS, 2, 4),
        therapyTypes: randomChoices(THERAPY_TYPES, 2, 5),
        treatmentOrientation: randomChoice(theoreticalOrientations),
        therapeuticApproach: `Using ${randomChoice(theoreticalOrientations)} therapy, I help clients develop insight and practical skills for lasting change.`,

        // Insurance & Fees
        insuranceAccepted: randomChoices(INSURANCE_PROVIDERS, 2, 6),
        individualSessionFee: randomInt(80, 250),
        couplesSessionFee: randomInt(100, 300),
        paymentMethods: randomChoices(PAYMENT_METHODS, 2, 4),

        // Additional Details
        communitiesServed: randomChoices(COMMUNITIES_SERVED, 0, 3),
        languages: ["English", ...randomChoices(languages.filter(l => l !== "English"), 0, 2)],
        acceptingNewClients: randomBool(0.75),

        // Availability
        availableDays: randomChoices(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"], 3, 6),
        availableTimes: randomChoices(["morning", "afternoon", "evening"], 1, 3),
        waitlistStatus: randomBool(0.2),

        // NEW FIELDS - Phase 1: Core Matching
        gender: randomChoice(GENDER_OPTIONS),
        dateOfBirth: `${randomInt(1960, 1995)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
        raceEthnicity: randomChoices(raceEthnicityOptions, 1, 2),
        religiousOrientation: randomChoice(religiousOrientations),
        certifications: randomChoices(CERTIFICATIONS, 1, 4),
        primaryTheoreticalOrientation: randomChoice(theoreticalOrientations),
        yearsSinceGraduation: randomInt(3, 40),
        sessionLengthOptions: randomChoices(SESSION_LENGTHS, 2, 4),
        currentWaitlistWeeks: randomBool(0.6) ? 0 : randomInt(1, 8),

        // NEW FIELDS - Phase 2: Accessibility
        wheelchairAccessible: randomBool(0.4),
        parkingAvailable: randomBool(0.7),
        publicTransitNearby: randomBool(0.6),
        elevatorsAvailable: randomBool(0.5),
        aslCapable: randomBool(0.15),
        closedCaptioningAvailable: randomBool(0.3),
        serviceAnimalFriendly: randomBool(0.8),
        genderNeutralRestrooms: randomBool(0.3),
        virtualPlatforms: isVirtualProvider ? randomChoices(VIRTUAL_PLATFORMS, 1, 3) : [],

        // NEW FIELDS - Phase 3: Financial
        slidingScaleFee: randomBool(0.5),
        slidingScaleMin: randomBool(0.5) ? randomInt(40, 80) : null,
        consultationOffered: randomBool(0.6),
        consultationDuration: randomBool(0.6) ? 15 : randomBool(0.5) ? 30 : null,
        superbillProvided: randomBool(0.7),
        fsaHsaAccepted: randomBool(0.8),
        acceptsCreditCards: randomBool(0.95),
        acceptsChecks: randomBool(0.6),
        onlinePaymentOptions: randomChoices(["PayPal", "Venmo", "Zelle", "Square"], 0, 2),

        // NEW FIELDS - Phase 4: Professional Development
        boardCertifications: randomBool(0.4) ? randomChoices(["ABPP", "NBCCHeroic", "AAMFT Approved Supervisor"], 0, 2) : [],
        clinicalSupervisor: randomBool(0.3),
        acceptsInterns: randomBool(0.25),
        additionalStatesLicensed,
        professionalMemberships: randomChoices(["APA", "NASW", "AAMFT", "ACA", "NBCC"], 1, 3),
        publicationsCount: randomBool(0.2) ? randomInt(1, 15) : 0,
        conferencesPresentedAt: randomBool(0.15) ? randomInt(1, 10) : 0,
        awards: randomBool(0.1) ? ["Best Therapist Award 2023", "Clinical Excellence Recognition"] : [],

        // Profile & Media
        bio: `${fullName} is a dedicated ${randomChoice(credentials)} with ${randomInt(2, 35)} years of experience specializing in ${randomChoices(SPECIALTIES, 1, 3).join(", ")}. Known for a ${randomChoice(["compassionate", "evidence-based", "integrative", "trauma-informed"])} approach to therapy, ${firstName} helps clients navigate life's challenges with ${randomChoice(["warmth and expertise", "evidence-based techniques", "mindfulness and compassion", "innovative therapeutic methods"])}.`,
        photoUrl: avatarUrl,
        videoIntroUrl: null as string | null,
        officePhotos: [] as string[],

        // Status
        profileStatus: "approved" as "approved",
      });

      created++;

      if (created % batchSize === 0) {
        console.log(`   ✓ Created ${created}/${TOTAL_THERAPISTS} therapists...`);
      }
    }

    console.log(`\n✅ Successfully created ${created} therapist profiles!`);
    console.log(`   📸 All profiles have professional cartoon avatars`);
    console.log(`   🌐 ${Math.floor(created * 0.3)} virtual providers with multi-state licenses`);
    console.log(`   🏥 ${TEXAS_COUNT} therapists in Texas`);
    console.log(`   ✨ All new schema fields populated\n`);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

seedComprehensiveData()
  .then(() => {
    console.log("🎉 Comprehensive seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });
