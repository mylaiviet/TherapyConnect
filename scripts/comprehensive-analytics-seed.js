/**
 * Comprehensive Analytics Seed
 *
 * Uses existing therapist data to create realistic analytics for dashboards
 */

import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);

async function seedComprehensiveAnalytics() {
  console.log('🌱 Creating comprehensive analytics data from existing therapists...\n');

  try {
    // Step 1: Get all approved therapists with their actual data
    const therapists = await sql`
      SELECT id, user_id, city, state, created_at, profile_views,
             therapy_types, top_specialties, individual_session_fee
      FROM therapists
      WHERE profile_status = 'approved'
      ORDER BY created_at DESC
    `;

    console.log(`✅ Found ${therapists.length} approved therapists\n`);

    // Step 2: Update therapist profile_views to have realistic numbers
    console.log('📊 Updating therapist profile views...');
    let viewsUpdated = 0;

    for (const therapist of therapists) {
      // Generate realistic view counts (more views for older profiles)
      const daysActive = Math.floor((Date.now() - new Date(therapist.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const baseViews = Math.floor(Math.random() * 50) + 10;
      const timeMultiplier = Math.max(1, Math.floor(daysActive / 7)); // More views over time
      const totalViews = baseViews * timeMultiplier;

      await sql`
        UPDATE therapists
        SET profile_views = ${totalViews}
        WHERE id = ${therapist.id}
      `;

      viewsUpdated++;
      if (viewsUpdated % 100 === 0) {
        console.log(`  Updated ${viewsUpdated} therapists...`);
      }
    }

    console.log(`✅ Updated ${viewsUpdated} therapist view counts\n`);

    // Step 3: Create therapist profile view records for engagement tracking
    console.log('👁️  Creating detailed profile view records...');
    let profileViewRecords = 0;

    // Sample 50 therapists to create detailed view logs
    const sampledTherapists = therapists.slice(0, Math.min(50, therapists.length));

    for (const therapist of sampledTherapists) {
      const viewCount = Math.floor(Math.random() * 20) + 5;

      for (let i = 0; i < viewCount; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const viewedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        const sessionId = `session_${Date.now()}_${i}_${therapist.id}`;
        const viewDuration = Math.floor(Math.random() * 180) + 30; // 30-210 seconds
        const clickedBook = Math.random() > 0.75; // 25% click book

        await sql`
          INSERT INTO therapist_profile_views (
            therapist_id, session_id, viewed_at, view_duration_seconds,
            clicked_book_button, device_type, browser_family, city, state
          ) VALUES (
            ${therapist.id}, ${sessionId}, ${viewedAt}, ${viewDuration},
            ${clickedBook},
            ${Math.random() > 0.6 ? 'desktop' : 'mobile'},
            ${['Chrome', 'Safari', 'Firefox'][Math.floor(Math.random() * 3)]},
            ${therapist.city}, ${therapist.state}
          )
          ON CONFLICT DO NOTHING
        `;

        profileViewRecords++;
      }
    }

    console.log(`✅ Created ${profileViewRecords} profile view records\n`);

    // Step 4: Create monthly growth metrics based on actual therapist creation dates
    console.log('📈 Creating growth metrics from actual signup data...');

    const growthData = await sql`
      SELECT
        DATE_TRUNC('month', created_at)::date as month,
        COUNT(*) as signups
      FROM therapists
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `;

    for (const row of growthData) {
      const month = new Date(row.month);
      const periodStart = new Date(month.getFullYear(), month.getMonth(), 1).toISOString().split('T')[0];
      const periodEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().split('T')[0];

      const approvedCount = Math.floor(Number(row.signups) * 0.9); // 90% approval rate
      const rejectedCount = Number(row.signups) - approvedCount;

      await sql`
        INSERT INTO therapist_growth_metrics (
          period_start, period_end, period_type,
          new_signups, approved_count, rejected_count,
          inactive_count, avg_approval_time_hours
        ) VALUES (
          ${periodStart}, ${periodEnd}, 'monthly',
          ${row.signups}, ${approvedCount}, ${rejectedCount},
          0, ${Math.random() * 48 + 24}
        )
        ON CONFLICT DO NOTHING
      `;
    }

    console.log(`✅ Created ${growthData.length} monthly growth records\n`);

    // Step 5: Populate booking analytics for therapists with appointments
    console.log('📅 Creating booking analytics...');
    let bookingRecords = 0;

    // Get therapists with their user_ids
    const therapistsWithUsers = await sql`
      SELECT t.id, t.user_id
      FROM therapists t
      WHERE t.profile_status = 'approved'
      LIMIT 100
    `;

    for (const therapist of therapistsWithUsers) {
      // Create booking data for last 30 days
      for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
        const periodDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const totalBookings = Math.floor(Math.random() * 4); // 0-3 bookings per day
        if (totalBookings === 0) continue;

        const confirmedBookings = Math.floor(totalBookings * 0.7);
        const cancelledBookings = Math.floor((totalBookings - confirmedBookings) * 0.5);
        const rejectedBookings = totalBookings - confirmedBookings - cancelledBookings;
        const profileViews = totalBookings + Math.floor(Math.random() * 10);
        const conversionRate = (confirmedBookings / profileViews) * 100;

        await sql`
          INSERT INTO booking_analytics (
            therapist_id, period_date, total_bookings,
            confirmed_bookings, cancelled_bookings, rejected_bookings,
            profile_views, conversion_rate, avg_response_time_hours
          ) VALUES (
            ${therapist.user_id}, ${periodDate}, ${totalBookings},
            ${confirmedBookings}, ${cancelledBookings}, ${rejectedBookings},
            ${profileViews}, ${conversionRate}, ${Math.random() * 24}
          )
          ON CONFLICT DO NOTHING
        `;

        bookingRecords++;
      }
    }

    console.log(`✅ Created ${bookingRecords} booking analytics records\n`);

    console.log('✅ Comprehensive analytics seeding complete!\n');
    console.log('Summary:');
    console.log(`  - ${viewsUpdated} therapist view counts updated`);
    console.log(`  - ${profileViewRecords} profile view tracking records`);
    console.log(`  - ${growthData.length} monthly growth metrics`);
    console.log(`  - ${bookingRecords} booking analytics records`);
    console.log('\n🎉 Dashboards should now display data!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

seedComprehensiveAnalytics()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
