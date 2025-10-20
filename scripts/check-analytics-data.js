import('dotenv/config');
import pg from 'postgres';

const sql = pg(process.env.DATABASE_URL);

async function check() {
  try {
    const pageViews = await sql`SELECT COUNT(*) FROM page_views`;
    const searches = await sql`SELECT COUNT(*) FROM location_searches`;
    const cities = await sql`SELECT DISTINCT city, state FROM page_views WHERE city IS NOT NULL LIMIT 10`;

    console.log('📊 Analytics Data Check:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Page views:', pageViews[0].count);
    console.log('Location searches:', searches[0].count);
    console.log('\nCities with data:');
    cities.forEach(c => console.log(`  - ${c.city}, ${c.state}`));

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

check();
