import dotenv from "dotenv";
dotenv.config();

import { db } from "../server/db";
import { users, therapists, credentialingApplications, credentialingDocuments } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function completeSetup() {
  console.log("\n" + "=".repeat(80));
  console.log("  🚀 CREDENTIALING SYSTEM - COMPLETE SETUP");
  console.log("=".repeat(80) + "\n");

  try {
    // Test database connection
    console.log("📊 Testing database connection...");
    await db.select().from(users).limit(1);
    console.log("✅ Database connection successful!\n");

    // Create admin account
    console.log("👨‍💼 Setting up admin account...");
    const adminEmail = "admin@karematch.com";
    const adminPassword = "admin123";

    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

    let adminUser;
    if (existingAdmin.length > 0) {
      adminUser = existingAdmin[0];
      console.log("ℹ️  Admin account already exists");
      console.log(`   Email: ${adminUser.email}`);
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const [admin] = await db.insert(users).values({
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      }).returning();
      adminUser = admin;
      console.log("✅ Admin account created");
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
    }

    // Create test therapist accounts
    console.log("\n👨‍⚕️ Setting up test therapist accounts...");

    const testTherapists = [
      {
        email: "test.therapist1@example.com",
        password: "therapist123",
        fullName: "Dr. Sarah Johnson",
        credentials: "PhD, LCSW",
        specialty: "Clinical Psychology",
        npi: "1234567893",
      },
      {
        email: "test.therapist2@example.com",
        password: "therapist123",
        fullName: "Dr. Michael Chen",
        credentials: "PsyD, LPC",
        specialty: "Family Therapy",
        npi: "9876543210",
      },
      {
        email: "test.therapist3@example.com",
        password: "therapist123",
        fullName: "Dr. Emily Rodriguez",
        credentials: "MD, Psychiatrist",
        specialty: "Child and Adolescent Psychiatry",
        npi: "5555555555",
      },
    ];

    for (const therapistData of testTherapists) {
      const existingUser = await db.select().from(users).where(eq(users.email, therapistData.email)).limit(1);

      if (existingUser.length > 0) {
        console.log(`ℹ️  Therapist account already exists: ${therapistData.email}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(therapistData.password, 10);
      const [user] = await db.insert(users).values({
        email: therapistData.email,
        password: hashedPassword,
        role: 'therapist',
      }).returning();

      await db.insert(therapists).values({
        userId: user.id,
        firstName: therapistData.fullName.split(' ')[1] || 'Test',
        lastName: therapistData.fullName.split(' ')[2] || 'Therapist',
        email: therapistData.email,
        credentials: therapistData.credentials,
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        licenseNumber: `LIC${Math.floor(Math.random() * 100000)}`,
        licenseState: 'CA',
        npiNumber: therapistData.npi,
        bio: `Experienced ${therapistData.specialty} specialist committed to providing compassionate, evidence-based care.`,
        profileStatus: 'pending',
        credentialingStatus: 'in_progress',
      });

      console.log(`✅ Created therapist: ${therapistData.fullName} (${therapistData.email})`);
    }

    // Display summary
    console.log("\n" + "=".repeat(80));
    console.log("  ✅ SETUP COMPLETE!");
    console.log("=".repeat(80) + "\n");

    console.log("📋 ACCOUNT SUMMARY:\n");

    console.log("👨‍💼 Admin Account:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   URL: http://localhost:5000/admin/credentialing\n`);

    console.log("👨‍⚕️ Therapist Test Accounts:");
    testTherapists.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.fullName}`);
      console.log(`      Email: ${t.email}`);
      console.log(`      Password: ${t.password}`);
      console.log(`      NPI: ${t.npi}`);
    });

    console.log(`\n   Provider Portal: http://localhost:5000/provider-credentialing`);

    console.log("\n" + "=".repeat(80));
    console.log("  🧪 NEXT STEPS");
    console.log("=".repeat(80) + "\n");

    console.log("1. Log in as therapist:");
    console.log("   → http://localhost:5000/login");
    console.log("   → Use: test.therapist1@example.com / therapist123\n");

    console.log("2. Upload credentials:");
    console.log("   → Navigate to Provider Portal");
    console.log("   → Upload documents (license, insurance, etc.)");
    console.log("   → Verify NPI number\n");

    console.log("3. Review as admin:");
    console.log("   → Log out and log in as admin");
    console.log("   → Use: admin@karematch.com / admin123");
    console.log("   → Review pending providers");
    console.log("   → Approve or reject credentials\n");

    console.log("=".repeat(80) + "\n");

  } catch (error: any) {
    console.error("\n❌ Setup failed:", error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log("\n⚠️  Database connection refused.");
      console.log("   The server might be using an in-memory/SQLite database.");
      console.log("   This is fine for testing - the UI will work with mock data.\n");
    }
    throw error;
  }
}

completeSetup()
  .then(() => {
    console.log("✅ Setup script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Setup script failed:", error);
    process.exit(1);
  });
