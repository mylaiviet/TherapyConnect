import dotenv from "dotenv";
dotenv.config();

import { db } from "../server/db";
import { users, adminUsers } from "@shared/schema";
import { eq } from "drizzle-orm";

async function fixAdmin() {
  try {
    console.log("🔍 Looking for admin@karematch.com...");

    // Find the admin user
    const [user] = await db.select().from(users).where(eq(users.email, "admin@karematch.com")).limit(1);

    if (!user) {
      console.error("❌ User admin@karematch.com not found");
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.email} (ID: ${user.id}, Role: ${user.role})`);

    // Update user role to admin if not already
    if (user.role !== 'admin') {
      await db.update(users).set({ role: 'admin' }).where(eq(users.id, user.id));
      console.log(`✓ Updated user role to 'admin'`);
    } else {
      console.log(`✓ User already has 'admin' role`);
    }

    // Check if admin user entry exists
    const [existingAdminUser] = await db.select().from(adminUsers).where(eq(adminUsers.userId, user.id)).limit(1);

    if (existingAdminUser) {
      console.log(`✓ Admin user entry already exists (ID: ${existingAdminUser.id})`);
    } else {
      // Create admin user entry
      const [newAdminUser] = await db.insert(adminUsers).values({
        userId: user.id,
        role: 'admin',
      }).returning();
      console.log(`✓ Created admin user entry (ID: ${newAdminUser.id})`);
    }

    console.log("\n✅ SUCCESS!");
    console.log("Admin account is now properly configured.");
    console.log("\n🔄 Next steps:");
    console.log("1. Click 'Logout' in the header");
    console.log("2. Log back in with: admin@karematch.com / admin123");
    console.log("3. You should now see the 'Admin' dropdown!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing admin:", error);
    process.exit(1);
  }
}

fixAdmin();
