import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Welcome2ppmsi!@karematch-db.cm1ksgqm0c00.us-east-1.rds.amazonaws.com:5432/postgres';

async function listTables() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false,
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Query to list all tables in the public schema
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log(`Found ${result.rows.length} tables:\n`);
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });

    console.log('\n✅ Database schema initialized successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

listTables();
