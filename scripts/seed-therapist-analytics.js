/**
 * Seed Therapist Analytics Data
 *
 * Populates therapist profile views, booking analytics, and related metrics
 * with realistic test data for dashboard testing.
 */

import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);

const cities = [
  { city: 'San Francisco', state: 'CA' },
  { city: 'Los Angeles', state: 'CA' },
  { city: 'New York', state: 'NY' },
  { city: 'Brooklyn', state: 'NY' },
  { city: 'Chicago', state: 'IL' },
  { city: 'Austin', state: 'TX' },
  { city: 'Seattle', state: 'WA' },
  { city: 'Boston', state: 'MA' },
  { city: 'Denver', state: 'CO' },
  { city: 'Portland', state: 'OR' },
];

const deviceTypes = ['desktop', 'mobile', 'tablet'];
const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
const referrers = ['search', 'direct', 'social', '/'];

async function seedTherapistAnalytics() {
  console.log('🌱 Seeding therapist analytics data...');

  try {
    // Get all therapists
    const therapists = await sql`
      SELECT id FROM therapists WHERE profile_status = 'approved' LIMIT 20
    `;

    console.log(`Found ${therapists.length} therapists to seed data for`);

    if (therapists.length === 0) {
      console.log('⚠️  No approved therapists found. Seed therapists first.');
      return;
    }

    // Generate profile views for last 30 days
    console.log('Creating therapist profile views...');
    let profileViewCount = 0;

    for (let i = 0; i < 500; i++) {
      const therapist = therapists[Math.floor(Math.random() * therapists.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const viewed_at = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000);

      const city = cities[Math.floor(Math.random() * cities.length)];
      const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
      const browser = browsers[Math.floor(Math.random() * browsers.length)];
      const sessionId = `session_${Date.now()}_${i}`;
      const viewDuration = Math.floor(Math.random() * 300) + 30; // 30-330 seconds
      const clickedBook = Math.random() > 0.7; // 30% click book button
      const referrer = referrers[Math.floor(Math.random() * referrers.length)];

      await sql`
        INSERT INTO therapist_profile_views (
          therapist_id, session_id, viewed_at, view_duration_seconds,
          clicked_book_button, device_type, browser_family, city, state,
          referrer_page
        ) VALUES (
          ${therapist.id}, ${sessionId}, ${viewed_at}, ${viewDuration},
          ${clickedBook}, ${deviceType}, ${browser}, ${city.city}, ${city.state},
          ${referrer}
        )
      `;

      profileViewCount++;
    }

    console.log(`✅ Created ${profileViewCount} profile views`);

    // Generate booking analytics for each therapist
    console.log('Creating booking analytics...');
    let bookingAnalyticsCount = 0;

    for (const therapist of therapists) {
      // Get their user ID
      const therapistUser = await sql`
        SELECT user_id FROM therapists WHERE id = ${therapist.id} LIMIT 1
      `;

      if (therapistUser.length === 0) continue;

      for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
        const periodDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const totalBookings = Math.floor(Math.random() * 5);
        const confirmedBookings = Math.floor(totalBookings * 0.7);
        const cancelledBookings = Math.floor((totalBookings - confirmedBookings) * 0.5);
        const rejectedBookings = totalBookings - confirmedBookings - cancelledBookings;
        const profileViews = totalBookings > 0 ? Math.floor(Math.random() * 20) + totalBookings : Math.floor(Math.random() * 10);
        const conversionRate = profileViews > 0 ? (confirmedBookings / profileViews) * 100 : 0;
        const avgResponseTime = Math.random() * 48; // 0-48 hours

        if (totalBookings > 0 || profileViews > 0) {
          // Check if record already exists
          const existing = await sql`
            SELECT id FROM booking_analytics
            WHERE therapist_id = ${therapistUser[0].user_id} AND period_date = ${periodDate}
            LIMIT 1
          `;

          if (existing.length === 0) {
            await sql`
              INSERT INTO booking_analytics (
                therapist_id, period_date, total_bookings, confirmed_bookings,
                cancelled_bookings, rejected_bookings, profile_views,
                conversion_rate, avg_response_time_hours
              ) VALUES (
                ${therapistUser[0].user_id}, ${periodDate}, ${totalBookings},
                ${confirmedBookings}, ${cancelledBookings}, ${rejectedBookings},
                ${profileViews}, ${conversionRate}, ${avgResponseTime}
              )
            `;
          }

          bookingAnalyticsCount++;
        }
      }
    }

    console.log(`✅ Created ${bookingAnalyticsCount} booking analytics records`);

    // Generate growth metrics
    console.log('Creating growth metrics...');
    let growthMetricsCount = 0;

    for (let monthsAgo = 0; monthsAgo < 6; monthsAgo++) {
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() - monthsAgo);
      periodEnd.setDate(0); // Last day of previous month

      const periodStart = new Date(periodEnd);
      periodStart.setDate(1); // First day of month

      const newSignups = Math.floor(Math.random() * 20) + 5;
      const approvedCount = Math.floor(newSignups * 0.85);
      const rejectedCount = newSignups - approvedCount;
      const avgApprovalTime = Math.random() * 72 + 24; // 24-96 hours

      await sql`
        INSERT INTO therapist_growth_metrics (
          period_start, period_end, period_type, new_signups,
          approved_count, rejected_count, inactive_count, avg_approval_time_hours
        ) VALUES (
          ${periodStart.toISOString().split('T')[0]},
          ${periodEnd.toISOString().split('T')[0]},
          'monthly', ${newSignups}, ${approvedCount}, ${rejectedCount},
          0, ${avgApprovalTime}
        )
      `;

      growthMetricsCount++;
    }

    console.log(`✅ Created ${growthMetricsCount} growth metrics records`);

    // Generate conversion funnel data
    console.log('Creating conversion funnel data...');
    let funnelCount = 0;

    const stages = ['search', 'results_view', 'profile_view', 'booking_request', 'booking_confirmed'];

    for (let i = 0; i < 200; i++) {
      const sessionId = `funnel_session_${Date.now()}_${i}`;
      const daysAgo = Math.floor(Math.random() * 30);
      const city = cities[Math.floor(Math.random() * cities.length)];

      // Each session goes through multiple stages with dropoff
      for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
        // 70% chance to continue to next stage (realistic dropoff)
        if (stageIndex > 0 && Math.random() > 0.7) break;

        const therapist = stages[stageIndex] === 'profile_view' || stages[stageIndex] === 'booking_request' || stages[stageIndex] === 'booking_confirmed'
          ? therapists[Math.floor(Math.random() * therapists.length)].id
          : null;

        const minutesOffset = stageIndex * 5; // Each stage takes ~5 minutes
        const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - minutesOffset * 60 * 1000);

        await sql`
          INSERT INTO search_conversion_funnel (
            session_id, stage, therapist_id, timestamp, city, state
          ) VALUES (
            ${sessionId}, ${stages[stageIndex]}, ${therapist},
            ${timestamp}, ${city.city}, ${city.state}
          )
        `;

        funnelCount++;
      }
    }

    console.log(`✅ Created ${funnelCount} conversion funnel records`);

    console.log('✅ Therapist analytics seeding complete!');
    console.log('\nSummary:');
    console.log(`  - ${profileViewCount} therapist profile views`);
    console.log(`  - ${bookingAnalyticsCount} booking analytics records`);
    console.log(`  - ${growthMetricsCount} growth metrics records`);
    console.log(`  - ${funnelCount} conversion funnel records`);

  } catch (error) {
    console.error('❌ Error seeding therapist analytics:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run if called directly
seedTherapistAnalytics()
  .then(() => {
    console.log('\n🎉 Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  });
