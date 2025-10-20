import { db } from "../server/db";
import { users, adminUsers } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function createAdmin() {
  const email = "admin@karematch.com";
  const password = "admin123";

  // Check if admin user already exists
  const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  let userId: string;

  if (existingUser) {
    console.log("Admin user already exists");
    userId = existingUser.id;
  } else {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      role: 'admin',
    }).returning();

    userId = newUser.id;
    console.log("Created admin user:", email);
  }

  // Check if admin user entry exists
  const [existingAdminUser] = await db.select().from(adminUsers).where(eq(adminUsers.userId, userId)).limit(1);

  if (!existingAdminUser) {
    await db.insert(adminUsers).values({
      userId,
      role: 'admin',
    });
    console.log("Created admin user entry");
  }

  console.log("\nAdmin credentials:");
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("\nYou can now log in at /login");

  process.exit(0);
}

createAdmin().catch((error) => {
  console.error("Error creating admin:", error);
  process.exit(1);
});
