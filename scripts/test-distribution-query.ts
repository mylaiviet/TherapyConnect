/**
 * Test the therapist distribution query directly
 */

import { db } from '../server/db';
import { therapists } from '../shared/schema';
import { eq, and, count, sql } from 'drizzle-orm';

async function testQuery() {
  console.log('🔍 Testing therapist distribution query...\n');

  try {
    // Test 1: Count total therapists
    const totalCount = await db
      .select({ count: count() })
      .from(therapists)
      .where(eq(therapists.profileStatus, 'approved'));

    console.log('1. Total approved therapists:', totalCount[0].count);

    // Test 2: Run the actual distribution query
    const conditions = [
      eq(therapists.profileStatus, "approved")
    ];

    const result = await db
      .select({
        state: therapists.state,
        city: therapists.city,
        totalTherapists: count(therapists.id),
        activeTherapists: sql<number>`COUNT(CASE WHEN ${therapists.acceptingNewClients} = true THEN 1 END)`,
        acceptingNewClients: sql<number>`COUNT(CASE WHEN ${therapists.acceptingNewClients} = true THEN 1 END)`,
      })
      .from(therapists)
      .where(and(...conditions))
      .groupBy(therapists.state, therapists.city);

    console.log('\n2. Distribution query results:');
    console.log(`   Total groups: ${result.length}`);
    console.log('   First 5 results:', result.slice(0, 5));
    console.log('   Total sum:', result.reduce((sum, r) => sum + Number(r.totalTherapists), 0));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }

  process.exit(0);
}

testQuery().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
