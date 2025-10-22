/**
 * Manual Credentialing Initialization Fix
 * Initializes credentialing for therapists who have NPI but status shows "Not Started"
 */

import { db } from '../server/db';
import { therapists, credentialingTimeline } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { initializeCredentialing, completeCredentialingPhase } from '../server/services/credentialingService';

async function fixCredentialingInit() {
  console.log('='.repeat(80));
  console.log('MANUAL CREDENTIALING INITIALIZATION FIX');
  console.log('='.repeat(80));
  console.log('');

  // Find therapists with NPI but not initialized
  const allTherapists = await db.select().from(therapists);

  const needsInit = allTherapists.filter(t =>
    t.npiNumber && (!t.credentialingStatus || t.credentialingStatus === 'not_started')
  );

  console.log(`Found ${needsInit.length} therapist(s) needing credentialing initialization`);
  console.log('');

  for (const therapist of needsInit) {
    console.log(`Processing: ${therapist.firstName} ${therapist.lastName} (${therapist.id})`);
    console.log(`   NPI: ${therapist.npiNumber}`);
    console.log(`   Current Status: ${therapist.credentialingStatus || 'NULL'}`);

    try {
      // Check if timeline already exists
      const existing = await db
        .select()
        .from(credentialingTimeline)
        .where(eq(credentialingTimeline.therapistId, therapist.id))
        .limit(1);

      if (existing.length > 0) {
        console.log('   ⚠️  Timeline already exists - skipping');
        console.log('');
        continue;
      }

      // Initialize credentialing
      console.log('   🔧 Initializing credentialing...');
      await initializeCredentialing(therapist.id);
      console.log('   ✅ Credentialing initialized');

      // Mark NPI phase as complete (since they already have verified NPI)
      console.log('   🔧 Marking NPI verification phase as complete...');
      await completeCredentialingPhase(
        therapist.id,
        'npi_verification',
        `NPI ${therapist.npiNumber} verified - retroactively marked complete`
      );
      console.log('   ✅ NPI phase marked complete');

      // Update therapist status
      console.log('   🔧 Updating credentialing status...');
      await db
        .update(therapists)
        .set({
          credentialingStatus: 'in_progress',
          lastCredentialingUpdate: new Date(),
        })
        .where(eq(therapists.id, therapist.id));
      console.log('   ✅ Status updated to "in_progress"');
      console.log('');

    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      console.log('');
    }
  }

  console.log('='.repeat(80));
  console.log('FIX COMPLETE');
  console.log('='.repeat(80));
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh the Credentialing Portal page');
  console.log('2. Check "Status & Progress" tab');
  console.log('3. Should now show "In Progress" with NPI Verification completed');
  console.log('');
}

fixCredentialingInit()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
