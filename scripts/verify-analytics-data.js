/**
 * Verify Analytics Data
 * Check that all analytics tables have been populated
 */

import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);

async function verifyData() {
  console.log('🔍 Verifying analytics data...\n');

  try {
    // Check therapist view counts
    const therapistViews = await sql`
      SELECT
        COUNT(*) as total_therapists,
        AVG(profile_views)::int as avg_views,
        MAX(profile_views) as max_views,
        MIN(profile_views) as min_views
      FROM therapists
      WHERE profile_status = 'approved'
    `;
    console.log('✅ Therapist View Counts:', therapistViews[0]);

    // Check profile view records
    const profileViews = await sql`
      SELECT COUNT(*) as count
      FROM therapist_profile_views
    `;
    console.log('✅ Profile View Records:', profileViews[0].count);

    // Check booking analytics
    const bookingAnalytics = await sql`
      SELECT COUNT(*) as count
      FROM booking_analytics
    `;
    console.log('✅ Booking Analytics Records:', bookingAnalytics[0].count);

    // Check growth metrics
    const growthMetrics = await sql`
      SELECT COUNT(*) as count
      FROM therapist_growth_metrics
    `;
    console.log('✅ Growth Metrics Records:', growthMetrics[0].count);

    // Check distribution data (what the dashboard queries)
    const distribution = await sql`
      SELECT
        state,
        city,
        COUNT(*) as total_therapists,
        COUNT(CASE WHEN accepting_new_clients = true THEN 1 END) as active_therapists
      FROM therapists
      WHERE profile_status = 'approved'
      GROUP BY state, city
      ORDER BY total_therapists DESC
      LIMIT 10
    `;
    console.log('\n📊 Top 10 Cities by Therapist Count:');
    distribution.forEach(row => {
      console.log(`  ${row.city}, ${row.state}: ${row.total_therapists} therapists (${row.active_therapists} active)`);
    });

    // Check therapy types breakdown
    const therapyTypes = await sql`
      SELECT
        jsonb_array_elements_text(therapy_types) as therapy_type,
        COUNT(*) as count
      FROM therapists
      WHERE profile_status = 'approved'
      AND therapy_types IS NOT NULL
      GROUP BY therapy_type
      ORDER BY count DESC
      LIMIT 5
    `;
    console.log('\n💼 Top 5 Therapy Types:');
    therapyTypes.forEach(row => {
      console.log(`  ${row.therapy_type}: ${row.count} therapists`);
    });

    console.log('\n✅ All analytics data verified successfully!');

  } catch (error) {
    console.error('❌ Error verifying data:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

verifyData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });
