/**
 * Seed ZIP Code Database
 * Populates the zip_codes table with US ZIP code data
 */

import "dotenv/config";
import zipcodes from 'zipcodes';
import { db } from './db';
import { zipCodes } from '@shared/schema';

async function seedZipCodes() {
  console.log('Starting ZIP code seeding...');

  try {
    // Get all ZIP codes from the zipcodes package
    const allZips = zipcodes.codes;

    console.log(`Found ${Object.keys(allZips).length} ZIP codes to import`);

    // Convert to array of objects for batch insert
    const zipData = Object.keys(allZips).map((zip) => {
      const data = zipcodes.lookup(zip);

      if (!data) return null;

      // Validate state code length (must be exactly 2 characters)
      if (!data.state || data.state.length !== 2) {
        console.warn(`Skipping ZIP ${zip}: invalid state code "${data.state}"`);
        return null;
      }

      return {
        zip: zip.padStart(5, '0'), // Ensure 5 digits
        city: data.city || 'Unknown',
        state: data.state.toUpperCase().substring(0, 2), // Ensure uppercase and max 2 chars
        latitude: data.latitude ? data.latitude.toString() : null,
        longitude: data.longitude ? data.longitude.toString() : null,
        county: data.county || null,
        timezone: null, // zipcodes package doesn't include timezone
      };
    }).filter(Boolean); // Remove nulls

    console.log(`Prepared ${zipData.length} ZIP codes for insertion`);

    // Insert in batches of 1000 to avoid query size limits
    const batchSize = 1000;
    let inserted = 0;

    for (let i = 0; i < zipData.length; i += batchSize) {
      const batch = zipData.slice(i, i + batchSize);

      await db.insert(zipCodes)
        .values(batch as any)
        .onConflictDoNothing(); // Skip duplicates

      inserted += batch.length;
      console.log(`Inserted ${inserted} / ${zipData.length} ZIP codes`);
    }

    console.log('✅ ZIP code seeding completed successfully!');
    console.log(`Total ZIP codes inserted: ${inserted}`);

  } catch (error) {
    console.error('❌ Error seeding ZIP codes:', error);
    throw error;
  }
}

// Run the seed function
seedZipCodes()
  .then(() => {
    console.log('Seeding complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
