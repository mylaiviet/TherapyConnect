/**
 * Check Credentialing Status
 * Diagnostic script to check the current credentialing state in the database
 */

import { db } from '../server/db';
import { therapists, credentialingTimeline, credentialingVerifications } from '../shared/schema';
import { eq } from 'drizzle-orm';

const TEST_EMAIL = 'therapist@test.com';

async function checkStatus() {
  console.log('='.repeat(80));
  console.log('Credentialing Status Diagnostic');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Get therapist by email
    const users = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, TEST_EMAIL),
    });

    if (!users) {
      console.log('❌ User not found:', TEST_EMAIL);
      process.exit(1);
    }

    console.log('✅ User found:', users.email);
    console.log('   User ID:', users.id);
    console.log('');

    // Get therapist profile
    const therapist = await db.query.therapists.findFirst({
      where: (therapists, { eq }) => eq(therapists.userId, users.id),
    });

    if (!therapist) {
      console.log('❌ Therapist profile not found');
      process.exit(1);
    }

    console.log('✅ Therapist profile found');
    console.log('   Therapist ID:', therapist.id);
    console.log('   Name:', therapist.firstName, therapist.lastName);
    console.log('   NPI Number:', therapist.npiNumber || 'Not set');
    console.log('   Credentialing Status:', therapist.credentialingStatus || 'not_started');
    console.log('   Profile Status:', therapist.profileStatus || 'pending');
    console.log('   Credentialing Started:', therapist.credentialingStartedAt || 'Not started');
    console.log('   Last Update:', therapist.lastCredentialingUpdate || 'Never');
    console.log('');

    // Get credentialing timeline
    const timeline = await db
      .select()
      .from(credentialingTimeline)
      .where(eq(credentialingTimeline.therapistId, therapist.id));

    console.log('Credentialing Timeline:');
    if (timeline.length === 0) {
      console.log('   ⚠️  No timeline entries found (credentialing not initialized)');
    } else {
      console.log(`   Found ${timeline.length} phase(s)`);
      timeline.forEach((phase) => {
        const icon = phase.status === 'completed' ? '✅' : phase.status === 'failed' ? '❌' : '⏳';
        console.log(`   ${icon} ${phase.phase}: ${phase.status}`);
        if (phase.completedAt) {
          console.log(`      Completed: ${phase.completedAt.toISOString()}`);
        }
        if (phase.notes) {
          console.log(`      Notes: ${phase.notes}`);
        }
      });
    }
    console.log('');

    // Get verifications
    const verifications = await db
      .select()
      .from(credentialingVerifications)
      .where(eq(credentialingVerifications.therapistId, therapist.id));

    console.log('Verification Records:');
    if (verifications.length === 0) {
      console.log('   ⚠️  No verification records found');
    } else {
      console.log(`   Found ${verifications.length} verification(s)`);
      verifications.forEach((v) => {
        const icon = v.status === 'verified' ? '✅' : '⏳';
        console.log(`   ${icon} ${v.verificationType}: ${v.status}`);
        console.log(`      Source: ${v.verificationSource || 'N/A'}`);
        console.log(`      Date: ${v.verificationDate?.toISOString() || 'Not verified'}`);
        if (v.notes) {
          console.log(`      Notes: ${v.notes}`);
        }
      });
    }
    console.log('');

    // Summary
    console.log('='.repeat(80));
    console.log('Summary');
    console.log('='.repeat(80));

    const completedPhases = timeline.filter(t => t.status === 'completed').length;
    const totalPhases = timeline.length;
    const progress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

    console.log(`Progress: ${completedPhases}/${totalPhases} phases (${progress}%)`);
    console.log(`Overall Status: ${therapist.credentialingStatus || 'not_started'}`);
    console.log(`NPI: ${therapist.npiNumber ? '✅ Set' : '❌ Not set'}`);
    console.log(`Timeline: ${timeline.length > 0 ? '✅ Initialized' : '❌ Not initialized'}`);
    console.log(`Verifications: ${verifications.length} record(s)`);
    console.log('');

    if (timeline.length === 0) {
      console.log('⚠️  ACTION REQUIRED: Credentialing timeline not initialized');
      console.log('   The credentialing workflow needs to be initialized.');
      console.log('   This should happen automatically when saving NPI.');
    }

    if (!therapist.npiNumber) {
      console.log('⚠️  ACTION REQUIRED: NPI not saved to profile');
      console.log('   Go to NPI Verification tab and click "Save to Profile"');
    }

    console.log('');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkStatus();
