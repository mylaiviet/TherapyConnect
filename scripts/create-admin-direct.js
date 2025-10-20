// Direct admin creation script that works with environment variables
import('dotenv/config');
import pg from 'postgres';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment');
    console.log('Please make sure your .env file exists with DATABASE_URL set');
    process.exit(1);
  }

  const sql = pg(databaseUrl);

  try {
    const email = 'admin@karematch.com';
    const password = 'admin123';

    console.log('🔍 Checking if admin user exists...');

    // Check if user exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    let userId;

    if (existingUsers.length > 0) {
      console.log('✅ Admin user already exists');
      userId = existingUsers[0].id;
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      console.log('🔐 Creating admin user...');

      // Create user
      const newUsers = await sql`
        INSERT INTO users (email, password, role)
        VALUES (${email}, ${hashedPassword}, 'admin')
        RETURNING id
      `;

      userId = newUsers[0].id;
      console.log('✅ Admin user created');
    }

    // Check if admin_users entry exists
    const existingAdminUsers = await sql`
      SELECT id FROM admin_users WHERE user_id = ${userId}
    `;

    if (existingAdminUsers.length === 0) {
      console.log('🔧 Creating admin_users entry...');

      await sql`
        INSERT INTO admin_users (user_id, role)
        VALUES (${userId}, 'admin')
      `;

      console.log('✅ Admin entry created');
    } else {
      console.log('✅ Admin entry already exists');
    }

    console.log('\n🎉 Admin account ready!');
    console.log('\n📝 Login credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    admin@karematch.com');
    console.log('Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 Login at: http://localhost:5000/login');
    console.log('📊 Admin dashboard: http://localhost:5000/admin');

    await sql.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    await sql.end();
    process.exit(1);
  }
}

createAdmin();
