#!/usr/bin/env node

/**
 * Diagnostic script to test therapist search functionality
 * Tests both API and database state
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

console.log('🔍 Testing Therapist Search Functionality\n');

async function testAPI(endpoint, description) {
  try {
    console.log(`\n📡 Testing: ${description}`);
    console.log(`   URL: ${BASE_URL}${endpoint}`);

    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();

    if (!response.ok) {
      console.log(`   ❌ Error: ${response.status} ${response.statusText}`);
      console.log(`   Response:`, data);
      return { success: false, data };
    }

    console.log(`   ✅ Success: ${response.status}`);
    console.log(`   Results: ${Array.isArray(data) ? data.length : 1} therapist(s)`);

    if (Array.isArray(data) && data.length > 0) {
      const sample = data[0];
      console.log(`   Sample: ${sample.firstName} ${sample.lastName} - ${sample.city}, ${sample.state}`);
    }

    return { success: true, data };
  } catch (error) {
    console.log(`   ❌ Network Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  const tests = [
    { endpoint: '/api/therapists', description: 'Get all therapists (no filters)' },
    { endpoint: '/api/therapists?acceptingNewClients=true', description: 'Filter by accepting new clients' },
    { endpoint: '/api/therapists?city=Houston', description: 'Filter by city (Houston)' },
    { endpoint: '/api/therapists?state=TX', description: 'Filter by state (Texas)' },
    { endpoint: '/api/therapists?specialties=Anxiety,Depression', description: 'Filter by specialties' },
    { endpoint: '/api/therapists?priceMin=50&priceMax=150', description: 'Filter by price range' },
  ];

  console.log('═'.repeat(80));
  console.log('Starting API Tests...');
  console.log('═'.repeat(80));

  const results = [];
  for (const test of tests) {
    const result = await testAPI(test.endpoint, test.description);
    results.push({ ...test, ...result });
  }

  console.log('\n\n' + '═'.repeat(80));
  console.log('Test Summary');
  console.log('═'.repeat(80));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${results.length}\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed! Therapist search is working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
  }

  // Additional diagnostics
  const allTherapists = results[0];
  if (allTherapists?.success && Array.isArray(allTherapists.data)) {
    console.log('\n' + '═'.repeat(80));
    console.log('Database Statistics');
    console.log('═'.repeat(80));
    console.log(`Total Approved Therapists: ${allTherapists.data.length}`);

    if (allTherapists.data.length > 0) {
      const accepting = allTherapists.data.filter(t => t.acceptingNewClients).length;
      const states = [...new Set(allTherapists.data.map(t => t.state))].sort();
      const cities = [...new Set(allTherapists.data.map(t => `${t.city}, ${t.state}`))].sort();

      console.log(`Accepting New Clients: ${accepting}`);
      console.log(`States: ${states.join(', ')}`);
      console.log(`Total Cities: ${cities.length}`);
      console.log(`Sample Cities: ${cities.slice(0, 5).join(', ')}...`);
    } else {
      console.log('⚠️  No approved therapists in database!');
      console.log('   Run: npm run seed-therapists (or similar) to populate test data');
    }
  }
}

// Check if server is running first
console.log('Checking if server is running...');
fetch(`${BASE_URL}/api/test-scheduling-routes`)
  .then(response => {
    if (!response.ok) throw new Error('Server not responding');
    console.log('✅ Server is running\n');
    return runTests();
  })
  .catch(error => {
    console.log('❌ Server is not running or not accessible');
    console.log('   Please start the server with: npm run dev');
    console.log(`   Error: ${error.message}`);
    process.exit(1);
  });
