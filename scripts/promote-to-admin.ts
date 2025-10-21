import dotenv from "dotenv";
dotenv.config();

import { db } from "../server/db";
import { users, adminUsers } from "@shared/schema";
import { eq } from "drizzle-orm";

async function promoteToAdmin() {
  // Get email from command line argument or use default
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Please provide an email address");
    console.log("Usage: npm run promote-admin <email>");
    console.log("Example: npm run promote-admin user@example.com");
    process.exit(1);
  }

  try {
    // Find the user
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.email}`);

    // Update user role to admin
    await db.update(users).set({ role: 'admin' }).where(eq(users.id, user.id));
    console.log(`✓ Updated user role to 'admin'`);

    // Check if admin user entry already exists
    const [existingAdminUser] = await db.select().from(adminUsers).where(eq(adminUsers.userId, user.id)).limit(1);

    if (existingAdminUser) {
      console.log(`✓ Admin user entry already exists`);
    } else {
      // Create admin user entry
      await db.insert(adminUsers).values({
        userId: user.id,
        role: 'admin',
      });
      console.log(`✓ Created admin user entry`);
    }

    console.log("\n✅ SUCCESS!");
    console.log(`${email} has been promoted to admin`);
    console.log("\nNext steps:");
    console.log("1. Log out if currently logged in");
    console.log("2. Log back in with your credentials");
    console.log("3. You should now see the 'Admin' dropdown in the navigation");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error promoting user to admin:", error);
    process.exit(1);
  }
}

promoteToAdmin();
