import { db } from '../server/db.js';
import * as therapistAnalytics from '../server/services/therapistAnalytics.js';

async function test() {
  console.log('Testing getTherapistDistribution...\n');

  const result = await therapistAnalytics.getTherapistDistribution();
  console.log('Result type:', Array.isArray(result) ? 'Array' : 'Object');
  console.log('Result length:', result.length);
  console.log('First 3 items:', JSON.stringify(result.slice(0, 3), null, 2));

  process.exit(0);
}

test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
