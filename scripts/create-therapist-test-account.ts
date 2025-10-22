/**
 * Create Therapist Test Account
 * Creates a test therapist account for testing the credentialing portal
 */

import { db } from "../server/db";
import { users, therapists } from "../shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const TEST_EMAIL = "therapist@test.com";
const TEST_PASSWORD = "password123";

async function createTestAccount() {
  console.log("=".repeat(80));
  console.log("Creating Therapist Test Account");
  console.log("=".repeat(80));
  console.log("");

  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, TEST_EMAIL))
      .limit(1);

    let userId: string;

    if (existingUser.length > 0) {
      console.log(`✅ User already exists: ${TEST_EMAIL}`);
      userId = existingUser[0].id;

      // Update password
      const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId));
      console.log("✅ Password updated");
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
      const [newUser] = await db
        .insert(users)
        .values({
          email: TEST_EMAIL,
          password: hashedPassword,
          role: "therapist",
        })
        .returning();

      userId = newUser.id;
      console.log(`✅ Created new user: ${TEST_EMAIL}`);
    }

    // Check if therapist profile exists
    const existingTherapist = await db
      .select()
      .from(therapists)
      .where(eq(therapists.userId, userId))
      .limit(1);

    if (existingTherapist.length > 0) {
      console.log(`✅ Therapist profile already exists`);
      console.log(`   ID: ${existingTherapist[0].id}`);
    } else {
      // Create therapist profile
      const [newTherapist] = await db
        .insert(therapists)
        .values({
          userId,
          firstName: "Test",
          lastName: "Therapist",
          email: TEST_EMAIL,
          phone: "(555) 123-4567",
          city: "Los Angeles",
          state: "CA",
          zipCode: "90001",
          licenseNumber: "PSY123456",
          licenseState: "CA",
          yearsExperience: 5,
          specialties: JSON.stringify(["anxiety", "depression"]),
          approachTypes: JSON.stringify(["cbt", "psychodynamic"]),
          acceptedInsurance: JSON.stringify(["Aetna", "Blue Cross"]),
          bio: "Test therapist for credentialing portal testing",
          hourlyRate: 150,
          availableForNewClients: true,
          profileStatus: "pending",
          credentialingStatus: "not_started",
        })
        .returning();

      console.log(`✅ Created therapist profile`);
      console.log(`   ID: ${newTherapist.id}`);
    }

    console.log("");
    console.log("=".repeat(80));
    console.log("Test Account Ready!");
    console.log("=".repeat(80));
    console.log("");
    console.log("Login Credentials:");
    console.log(`  Email:    ${TEST_EMAIL}`);
    console.log(`  Password: ${TEST_PASSWORD}`);
    console.log("");
    console.log("Next Steps:");
    console.log("1. Go to http://localhost:5000");
    console.log("2. Click 'Sign In'");
    console.log("3. Log in with the credentials above");
    console.log("4. Navigate to Provider Credentialing");
    console.log("5. Try uploading a document");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating test account:", error);
    process.exit(1);
  }
}

createTestAccount();
