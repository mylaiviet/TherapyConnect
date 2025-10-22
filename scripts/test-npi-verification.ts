/**
 * Test NPI Verification
 * Run with: npx tsx scripts/test-npi-verification.ts
 */

const TEST_NPIS = [
  { npi: '1881624449', description: 'Valid Provider NPI' },
  { npi: '1003000126', description: 'Valid Test NPI' },
  { npi: '1234567893', description: 'Valid Format Test' },
  { npi: '0000000000', description: 'Invalid - All Zeros' },
  { npi: '123456789', description: 'Invalid - Only 9 digits' },
  { npi: 'ABCDEFGHIJ', description: 'Invalid - Letters' },
];

async function testNPIVerification(npiNumber: string, description: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${description}`);
  console.log(`NPI: ${npiNumber}`);
  console.log('='.repeat(60));

  try {
    const response = await fetch('http://localhost:5000/api/credentialing/verify-npi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ npiNumber }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ API Response: SUCCESS');
      console.log(JSON.stringify(result, null, 2));

      if (result.valid) {
        console.log('\n📋 Verification Details:');
        console.log(`   Valid: ${result.valid}`);
        console.log(`   Name: ${result.name || 'N/A'}`);
        console.log(`   Type: ${result.enumerationType || 'N/A'}`);
        console.log(`   Specialty: ${result.specialtyDescription || 'N/A'}`);
        console.log(`   Status: ${result.status || 'N/A'}`);
        console.log(`   Location: ${result.city || 'N/A'}, ${result.state || 'N/A'}`);
      } else {
        console.log('\n❌ NPI Invalid');
        console.log(`   Error: ${result.error || 'Unknown error'}`);
      }
    } else {
      console.log('❌ API Response: FAILED');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ Test Failed:', error instanceof Error ? error.message : error);
  }
}

async function testNPISearch() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Testing: NPI Search by Name');
  console.log('Search: firstName=John, lastName=Smith');
  console.log('='.repeat(60));

  try {
    const response = await fetch(
      'http://localhost:5000/api/credentialing/search-npi?firstName=John&lastName=Smith&limit=5'
    );

    const results = await response.json();

    if (response.ok) {
      console.log(`✅ Found ${results.length} results`);
      results.slice(0, 3).forEach((result: any, index: number) => {
        console.log(`\n   Result ${index + 1}:`);
        console.log(`   NPI: ${result.npiNumber}`);
        console.log(`   Name: ${result.name}`);
        console.log(`   Specialty: ${result.specialtyDescription || 'N/A'}`);
        console.log(`   Location: ${result.city || 'N/A'}, ${result.state || 'N/A'}`);
      });
    } else {
      console.log('❌ Search Failed');
    }
  } catch (error) {
    console.error('❌ Search Test Failed:', error instanceof Error ? error.message : error);
  }
}

async function runAllTests() {
  console.log('\n🧪 NPI VERIFICATION TEST SUITE');
  console.log('================================\n');

  // Check if server is running
  try {
    const healthCheck = await fetch('http://localhost:5000/');
    if (!healthCheck.ok) {
      throw new Error('Server not responding');
    }
    console.log('✅ Server is running on http://localhost:5000\n');
  } catch (error) {
    console.error('❌ ERROR: Server is not running!');
    console.error('   Please start the server with: npm run dev');
    process.exit(1);
  }

  // Test each NPI
  for (const test of TEST_NPIS) {
    await testNPIVerification(test.npi, test.description);
    await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause between tests
  }

  // Test search functionality
  await testNPISearch();

  console.log('\n' + '='.repeat(60));
  console.log('🎉 All tests completed!');
  console.log('='.repeat(60) + '\n');
}

// Run tests
runAllTests().catch(console.error);
