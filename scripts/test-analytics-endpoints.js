/**
 * Test Analytics Endpoints
 * Quick script to verify what data is being returned
 */

const endpoints = [
  '/api/admin/analytics/therapists/distribution',
  '/api/admin/analytics/therapists/therapy-types',
  '/api/admin/analytics/therapists/growth',
  '/api/admin/analytics/business/supply-demand',
  '/api/admin/analytics/business/conversion-funnel',
];

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`http://localhost:5000${endpoint}`, {
      headers: {
        'Cookie': 'connect.sid=s%3AYourSessionCookieHere' // Replace with actual session
      }
    });

    const data = await response.json();
    console.log(`\n${endpoint}:`);
    console.log('Status:', response.status);
    console.log('Data type:', Array.isArray(data) ? 'Array' : 'Object');
    console.log('Data length/keys:', Array.isArray(data) ? data.length : Object.keys(data).length);
    console.log('Sample:', JSON.stringify(data).substring(0, 200));
  } catch (error) {
    console.error(`Error testing ${endpoint}:`, error.message);
  }
}

async function runTests() {
  console.log('Testing analytics endpoints...\n');
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
}

runTests();
