import dotenv from "dotenv";
dotenv.config();

import { db } from "../server/db";
import { users, therapists } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function createTestAccounts() {
  console.log("Creating test accounts for credentialing testing...\n");

  try {
    // Check for existing admin
    const existingAdmin = await db.select().from(users).where(eq(users.role, "admin")).limit(1);

    let adminUser;
    if (existingAdmin.length > 0) {
      adminUser = existingAdmin[0];
      console.log("✅ Admin account already exists:");
      console.log(`   Username: ${adminUser.username}`);
      console.log(`   Email: ${adminUser.email}`);
    } else {
      // Create admin account
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const [admin] = await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        email: "admin@therapyconnect.com",
        role: "admin"
      }).returning();
      adminUser = admin;
      console.log("✅ Created admin account:");
      console.log(`   Username: admin`);
      console.log(`   Password: admin123`);
      console.log(`   Email: admin@therapyconnect.com`);
    }

    // Check for existing therapist test account
    const existingTherapist = await db.select()
      .from(users)
      .where(eq(users.username, "test.therapist"))
      .limit(1);

    let therapistUser;
    if (existingTherapist.length > 0) {
      therapistUser = existingTherapist[0];
      console.log("\n✅ Test therapist account already exists:");
      console.log(`   Username: ${therapistUser.username}`);
      console.log(`   Email: ${therapistUser.email}`);
    } else {
      // Create test therapist account
      const hashedPassword = await bcrypt.hash("therapist123", 10);
      const [therapist] = await db.insert(users).values({
        username: "test.therapist",
        password: hashedPassword,
        email: "test.therapist@example.com",
        role: "therapist"
      }).returning();
      therapistUser = therapist;

      // Create therapist profile
      await db.insert(therapists).values({
        userId: therapistUser.id,
        fullName: "Dr. Test Therapist",
        credentials: "PhD, LCSW",
        specialty: "Clinical Psychology",
        bio: "Test therapist account for credentialing testing",
        profileStatus: "pending",
        credentialingStatus: "not_started"
      });

      console.log("\n✅ Created test therapist account:");
      console.log(`   Username: test.therapist`);
      console.log(`   Password: therapist123`);
      console.log(`   Email: test.therapist@example.com`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("TEST ACCOUNTS READY!");
    console.log("=".repeat(60));
    console.log("\n📋 Login Information:");
    console.log("\n1. Admin Portal: http://localhost:5000/admin/credentialing");
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Password: ${existingAdmin.length > 0 ? '(use your existing password)' : 'admin123'}`);

    console.log("\n2. Provider Portal: http://localhost:5000/provider-credentialing");
    console.log(`   Username: ${therapistUser.username}`);
    console.log(`   Password: ${existingTherapist.length > 0 ? '(use your existing password)' : 'therapist123'}`);

    console.log("\n" + "=".repeat(60));

  } catch (error) {
    console.error("❌ Error creating test accounts:", error);
    throw error;
  }
}

createTestAccounts()
  .then(() => {
    console.log("\n✅ Test accounts setup complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Failed to create test accounts:", error);
    process.exit(1);
  });
