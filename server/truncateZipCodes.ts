import "dotenv/config";
import { db } from './db';
import { sql } from 'drizzle-orm';

async function truncate() {
  await db.execute(sql`TRUNCATE TABLE zip_codes`);
  console.log('✅ zip_codes table truncated');
  process.exit(0);
}

truncate().catch(console.error);
