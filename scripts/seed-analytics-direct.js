// Direct SQL insertion for analytics test data
import('dotenv/config');
import pg from 'postgres';

const CITIES = [
  { city: 'San Francisco', state: 'CA' },
  { city: 'Los Angeles', state: 'CA' },
  { city: 'New York', state: 'NY' },
  { city: 'Chicago', state: 'IL' },
  { city: 'Houston', state: 'TX' },
  { city: 'Austin', state: 'TX' },
  { city: 'Seattle', state: 'WA' },
  { city: 'Boston', state: 'MA' },
  { city: 'Denver', state: 'CO' },
  { city: 'Portland', state: 'OR' },
];

async function seed() {
  const sql = pg(process.env.DATABASE_URL);

  try {
    console.log('🌱 Seeding analytics data...');

    // Generate page views
    console.log('📄 Inserting page views...');
    for (let i = 0; i < 100; i++) {
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      await sql`
        INSERT INTO page_views (
          city, state, country, location_method, page_path,
          referrer_domain, device_type, browser_family, created_at
        ) VALUES (
          ${city.city}, ${city.state}, 'USA', 'ip', '/therapist-search',
          'google.com', 'desktop', 'Chrome', ${date.toISOString()}
        )
      `;
    }
    console.log('✅ Inserted 100 page views');

    // Generate searches
    console.log('🔍 Inserting location searches...');
    for (let i = 0; i < 50; i++) {
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      const radius = [25, 50, 100][Math.floor(Math.random() * 3)];
      const results = Math.floor(Math.random() * 20);

      await sql`
        INSERT INTO location_searches (
          search_city, search_state, radius_miles, location_method,
          results_found, had_specialty_filter, created_at
        ) VALUES (
          ${city.city}, ${city.state}, ${radius}, 'ip',
          ${results}, ${Math.random() > 0.5}, ${date.toISOString()}
        )
      `;
    }
    console.log('✅ Inserted 50 location searches');

    console.log('\n🎉 Analytics data seeded successfully!');
    console.log('   • 100 page views');
    console.log('   • 50 location searches');
    console.log('   • 10 cities');
    console.log('\n🔄 Refresh your analytics dashboard to see the data!');

    await sql.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

seed();
