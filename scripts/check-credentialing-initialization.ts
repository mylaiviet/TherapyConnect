/**
 * Check Credentialing Initialization Status
 * Diagnoses why credentialing shows "Not Started" despite NPI verification
 */

import { db } from '../server/db';
import { therapists, credentialingTimeline, credentialingVerifications } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function checkCredentialingStatus() {
  console.log('='.repeat(80));
  console.log('CREDENTIALING INITIALIZATION CHECK');
  console.log('='.repeat(80));
  console.log('');

  // Get a therapist with NPI
  const allTherapists = await db.select().from(therapists).limit(10);
  const therapistWithNPI = allTherapists.find(t => t.npiNumber);

  if (!therapistWithNPI) {
    console.log('❌ No therapist found with NPI number');
    return;
  }

  console.log('📋 Therapist Info:');
  console.log('   ID:', therapistWithNPI.id);
  console.log('   Name:', therapistWithNPI.firstName, therapistWithNPI.lastName);
  console.log('   NPI:', therapistWithNPI.npiNumber);
  console.log('   Credentialing Status:', therapistWithNPI.credentialingStatus || 'NULL');
  console.log('   Credentialing Started At:', therapistWithNPI.credentialingStartedAt || 'NULL');
  console.log('');

  // Check timeline entries
  const timeline = await db
    .select()
    .from(credentialingTimeline)
    .where(eq(credentialingTimeline.therapistId, therapistWithNPI.id));

  console.log('📅 Timeline Entries:', timeline.length);
  if (timeline.length === 0) {
    console.log('   ❌ NO TIMELINE ENTRIES - Credentialing NOT initialized!');
  } else {
    console.log('   ✅ Timeline exists');
    timeline.forEach(t => {
      console.log(`   - ${t.phase}: ${t.status}`);
    });
  }
  console.log('');

  // Check verifications
  const verifications = await db
    .select()
    .from(credentialingVerifications)
    .where(eq(credentialingVerifications.therapistId, therapistWithNPI.id));

  console.log('✓ Verifications:', verifications.length);
  if (verifications.length === 0) {
    console.log('   ❌ NO VERIFICATIONS FOUND');
  } else {
    verifications.forEach(v => {
      console.log(`   - ${v.verificationType}: ${v.status} (${v.verificationDate})`);
    });
  }
  console.log('');

  // Diagnosis
  console.log('='.repeat(80));
  console.log('DIAGNOSIS');
  console.log('='.repeat(80));

  const hasNPI = !!therapistWithNPI.npiNumber;
  const hasCredentialingStatus = !!therapistWithNPI.credentialingStatus && therapistWithNPI.credentialingStatus !== 'not_started';
  const hasTimeline = timeline.length > 0;
  const hasVerifications = verifications.length > 0;

  console.log('');
  console.log('Status Checks:');
  console.log(`   ${hasNPI ? '✅' : '❌'} Has NPI Number`);
  console.log(`   ${hasCredentialingStatus ? '✅' : '❌'} Has Credentialing Status (not "not_started")`);
  console.log(`   ${hasTimeline ? '✅' : '❌'} Has Timeline Entries`);
  console.log(`   ${hasVerifications ? '✅' : '❌'} Has Verification Records`);
  console.log('');

  if (hasNPI && hasVerifications && !hasTimeline) {
    console.log('🔍 ROOT CAUSE IDENTIFIED:');
    console.log('   - NPI is verified ✓');
    console.log('   - Verification record exists ✓');
    console.log('   - BUT: Timeline NOT initialized ✗');
    console.log('   - Status shows "Not Started" ✗');
    console.log('');
    console.log('💡 SOLUTION:');
    console.log('   The initializeCredentialing() function was NOT called after NPI save.');
    console.log('   This should happen in /api/therapist/credentialing/save-npi endpoint.');
    console.log('');
    console.log('🔧 TO FIX:');
    console.log('   1. Check server logs when NPI was saved');
    console.log('   2. Verify initializeCredentialing() is being called');
    console.log('   3. Check for errors in the save-npi endpoint');
    console.log('   4. May need to manually initialize credentialing');
  } else if (!hasNPI) {
    console.log('❌ No NPI found - verification not complete');
  } else if (hasTimeline) {
    console.log('✅ Credentialing is properly initialized');
  }

  console.log('');
  console.log('='.repeat(80));
}

checkCredentialingStatus()
  .then(() => {
    console.log('Check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Check failed:', error);
    process.exit(1);
  });
