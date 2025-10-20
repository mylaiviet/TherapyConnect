import pg from 'pg';
const { Client } = pg;

async function testConnection() {
  console.log('Testing PostgreSQL database connection...\n');
  console.log('Host: karematch-db.cm1ksgqm0c00.us-east-1.rds.amazonaws.com');
  console.log('Port: 5432');
  console.log('Database: postgres');
  console.log('User: postgres');
  console.log('Password: ****');
  console.log('SSL Mode: Enabled with rejectUnauthorized=false (for AWS RDS)');
  console.log('');

  const client = new Client({
    host: 'karematch-db.cm1ksgqm0c00.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Welcome2ppmsi!',  // No encoding needed when passed as parameter
    ssl: {
      rejectUnauthorized: false,
    }
  });

  try {
    console.log('Attempting to connect...');
    await client.connect();
    console.log('✅ Successfully connected to PostgreSQL database!\n');

    // Test query to get database version
    console.log('Running test query: SELECT version()');
    const result = await client.query('SELECT version()');
    console.log('✅ Query executed successfully!\n');
    console.log('Database version:');
    console.log(result.rows[0].version);
    console.log('');

    // Get database name and current user
    const dbInfo = await client.query('SELECT current_database(), current_user, inet_server_addr(), inet_server_port()');
    console.log('Connection details:');
    console.log('- Database:', dbInfo.rows[0].current_database);
    console.log('- User:', dbInfo.rows[0].current_user);
    console.log('- Server IP:', dbInfo.rows[0].inet_server_addr);
    console.log('- Server Port:', dbInfo.rows[0].inet_server_port);
    console.log('');

    console.log('✅ All tests passed! Database is ready for use.');

  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nConnection closed.');
  }
}

testConnection();
