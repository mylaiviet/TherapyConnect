import dotenv from "dotenv";
dotenv.config();

import { db } from "../server/db";
import { users, therapists } from "@shared/schema";
import { eq } from "drizzle-orm";

async function fixTestAccounts() {
  console.log("\n🔧 Fixing Test Accounts...\n");

  const testEmails = [
    "test.therapist1@example.com",
    "test.therapist2@example.com",
    "test.therapist3@example.com",
  ];

  const therapistData = [
    {
      email: "test.therapist1@example.com",
      firstName: "Sarah",
      lastName: "Johnson",
      credentials: "PhD, LCSW",
      specialty: "Clinical Psychology",
      npiNumber: "1234567893",
    },
    {
      email: "test.therapist2@example.com",
      firstName: "Michael",
      lastName: "Chen",
      credentials: "PsyD, LPC",
      specialty: "Family Therapy",
      npiNumber: "9876543210",
    },
    {
      email: "test.therapist3@example.com",
      firstName: "Emily",
      lastName: "Rodriguez",
      credentials: "MD, Psychiatrist",
      specialty: "Child and Adolescent Psychiatry",
      npiNumber: "5555555555",
    },
  ];

  for (let i = 0; i < testEmails.length; i++) {
    const email = testEmails[i];
    const data = therapistData[i];

    console.log(`Checking ${email}...`);

    // Get user
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      console.log(`❌ User not found: ${email}\n`);
      continue;
    }

    // Check if therapist profile exists
    const [existingTherapist] = await db.select().from(therapists).where(eq(therapists.userId, user.id)).limit(1);

    if (existingTherapist) {
      console.log(`ℹ️  Therapist profile already exists for ${email}`);
      console.log(`   ID: ${existingTherapist.id}\n`);
      continue;
    }

    // Create therapist profile
    const [newTherapist] = await db.insert(therapists).values({
      userId: user.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: email,
      credentials: data.credentials,
      city: "San Francisco",
      state: "CA",
      zipCode: "94102",
      licenseNumber: `CA${Math.floor(Math.random() * 100000)}`,
      licenseState: "CA",
      npiNumber: data.npiNumber,
      bio: `Experienced ${data.specialty} specialist committed to providing compassionate, evidence-based care.`,
      profileStatus: 'pending',
      credentialingStatus: 'in_progress',
    }).returning();

    console.log(`✅ Created therapist profile for ${data.firstName} ${data.lastName}`);
    console.log(`   Therapist ID: ${newTherapist.id}`);
    console.log(`   User ID: ${user.id}\n`);
  }

  console.log("✅ Test accounts fixed!\n");
}

fixTestAccounts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
