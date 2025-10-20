import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);

async function checkData() {
  console.log('Checking therapist data...\n');

  const therapistCount = await sql`
    SELECT COUNT(*) as count, profile_status
    FROM therapists
    GROUP BY profile_status
  `;
  console.log('Therapists by status:', therapistCount);

  const approvedTherapists = await sql`
    SELECT id, first_name, last_name, city, state
    FROM therapists
    WHERE profile_status = 'approved'
    LIMIT 5
  `;
  console.log('\nSample approved therapists:', approvedTherapists);

  const therapyTypesCheck = await sql`
    SELECT therapy_types
    FROM therapists
    WHERE profile_status = 'approved'
    AND therapy_types IS NOT NULL
    LIMIT 3
  `;
  console.log('\nTherapy types sample:', therapyTypesCheck);

  await sql.end();
}

checkData().catch(console.error);
