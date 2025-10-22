import dotenv from "dotenv";
dotenv.config();

import { db } from "../server/db";
import { therapists, users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function checkTherapists() {
  console.log("\n📊 Checking Therapists Database...\n");

  try {
    // Get all users
    const allUsers = await db.select().from(users);
    console.log(`Total users: ${allUsers.length}`);

    allUsers.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email} - Role: ${user.role} - ID: ${user.id}`);
    });

    console.log();

    // Get all therapists
    const allTherapists = await db.select().from(therapists);
    console.log(`Total therapist profiles: ${allTherapists.length}\n`);

    if (allTherapists.length > 0) {
      allTherapists.forEach((t, i) => {
        console.log(`${i + 1}. ${t.firstName} ${t.lastName}`);
        console.log(`   Email: ${t.email}`);
        console.log(`   User ID: ${t.userId}`);
        console.log(`   Therapist ID: ${t.id}`);
        console.log(`   Status: ${t.credentialingStatus || 'N/A'}`);
        console.log();
      });
    } else {
      console.log("❌ No therapist profiles found!");
      console.log("This is why the endpoints are failing.\n");
    }

    // Check for therapist users without profiles
    const therapistUsers = allUsers.filter(u => u.role === 'therapist');
    const therapistUserIds = allTherapists.map(t => t.userId);
    const missingProfiles = therapistUsers.filter(u => !therapistUserIds.includes(u.id));

    if (missingProfiles.length > 0) {
      console.log(`⚠️  Found ${missingProfiles.length} therapist user(s) WITHOUT profiles:`);
      missingProfiles.forEach(u => {
        console.log(`   - ${u.email} (${u.id})`);
      });
      console.log("\nNeed to create therapist profiles for these users.\n");
    }

  } catch (error) {
    console.error("Error:", error);
  }

  process.exit(0);
}

checkTherapists();
