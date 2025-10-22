/**
 * Full Credentialing System Test
 * Tests all credentialing endpoints with authentication
 */

import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Test credentials
const TEST_EMAIL = 'therapist@test.com';
const TEST_PASSWORD = 'password123';

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];
let sessionCookie = '';

// Helper function to make authenticated requests
async function authenticatedFetch(url: string, options: any = {}) {
  const headers = {
    ...options.headers,
    ...(sessionCookie ? { Cookie: sessionCookie } : {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Capture session cookie from response
  const setCookie = response.headers.get('set-cookie');
  if (setCookie && !sessionCookie) {
    sessionCookie = setCookie.split(';')[0];
  }

  return response;
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('Full Credentialing System Test');
  console.log('='.repeat(80));
  console.log('');

  // Test 1: Server Health
  console.log('Test 1: Server Health Check');
  console.log('-'.repeat(80));
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      console.log('✅ Server is running');
      results.push({ test: 'Server Health', success: true, message: 'Server is running' });
    } else {
      throw new Error(`Server returned ${response.status}`);
    }
  } catch (error: any) {
    console.log('❌ Server is not running');
    console.log('   Please run: npm run dev');
    results.push({ test: 'Server Health', success: false, message: error.message });
    process.exit(1);
  }
  console.log('');

  // Test 2: Login
  console.log('Test 2: User Authentication');
  console.log('-'.repeat(80));
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    // Capture session cookie
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      sessionCookie = setCookie.split(';')[0];
    }

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful');
      console.log(`   User: ${data.email}`);
      console.log(`   Role: ${data.role}`);
      results.push({ test: 'Login', success: true, message: 'Login successful', details: data });
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
  } catch (error: any) {
    console.log('❌ Login failed:', error.message);
    console.log('   Make sure test account exists: npm run create-test-accounts');
    results.push({ test: 'Login', success: false, message: error.message });
    process.exit(1);
  }
  console.log('');

  // Test 3: Get Credentialing Status
  console.log('Test 3: Get Credentialing Status');
  console.log('-'.repeat(80));
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/therapist/credentialing/status`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Retrieved credentialing status');
      console.log(`   Status: ${data.status || 'not_started'}`);
      console.log(`   Progress: ${data.overallProgress || 0}%`);
      results.push({ test: 'Get Status', success: true, message: 'Status retrieved', details: data });
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get status');
    }
  } catch (error: any) {
    console.log('❌ Failed to get status:', error.message);
    results.push({ test: 'Get Status', success: false, message: error.message });
  }
  console.log('');

  // Test 4: NPI Verification
  console.log('Test 4: NPI Verification');
  console.log('-'.repeat(80));
  const testNPI = '1548556871'; // Sample valid NPI
  try {
    const response = await fetch(`${BASE_URL}/api/credentialing/verify-npi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ npiNumber: testNPI }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.valid) {
        console.log('✅ NPI verification successful');
        console.log(`   Name: ${data.name}`);
        console.log(`   Specialty: ${data.specialty}`);
        console.log(`   Location: ${data.location}`);
        results.push({ test: 'NPI Verification', success: true, message: 'NPI verified', details: data });
      } else {
        throw new Error(data.error || 'Invalid NPI');
      }
    } else {
      throw new Error('NPI verification failed');
    }
  } catch (error: any) {
    console.log('❌ NPI verification failed:', error.message);
    results.push({ test: 'NPI Verification', success: false, message: error.message });
  }
  console.log('');

  // Test 5: Save NPI to Profile
  console.log('Test 5: Save NPI to Profile');
  console.log('-'.repeat(80));
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/therapist/credentialing/save-npi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        npiNumber: testNPI,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ NPI saved to profile');
      console.log(`   NPI: ${data.npiNumber}`);
      results.push({ test: 'Save NPI', success: true, message: 'NPI saved successfully' });
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save NPI');
    }
  } catch (error: any) {
    console.log('❌ Failed to save NPI:', error.message);
    results.push({ test: 'Save NPI', success: false, message: error.message });
  }
  console.log('');

  // Test 6: Document Upload
  console.log('Test 6: Document Upload');
  console.log('-'.repeat(80));
  try {
    // Create a test PDF file
    const testPdfPath = path.join(process.cwd(), 'test-document.pdf');
    if (!fs.existsSync(testPdfPath)) {
      // Create a minimal PDF
      const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Document) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000314 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
407
%%EOF`;
      fs.writeFileSync(testPdfPath, pdfContent);
      console.log('   Created test PDF file');
    }

    // Create form data
    const form = new FormData();
    form.append('document', fs.createReadStream(testPdfPath));
    form.append('documentType', 'license');
    form.append('expirationDate', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString());

    const response = await fetch(`${BASE_URL}/api/therapist/credentialing/upload`, {
      method: 'POST',
      headers: {
        ...(sessionCookie ? { Cookie: sessionCookie } : {}),
        ...form.getHeaders(),
      },
      body: form,
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Document uploaded successfully');
      console.log(`   File: ${data.document.fileName}`);
      console.log(`   Type: ${data.document.documentType}`);
      console.log(`   Size: ${(data.document.fileSize / 1024).toFixed(2)} KB`);
      results.push({ test: 'Document Upload', success: true, message: 'Document uploaded', details: data });
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    // Clean up test file
    if (fs.existsSync(testPdfPath)) {
      fs.unlinkSync(testPdfPath);
    }
  } catch (error: any) {
    console.log('❌ Document upload failed:', error.message);
    results.push({ test: 'Document Upload', success: false, message: error.message });
  }
  console.log('');

  // Test 7: Get Documents
  console.log('Test 7: Get Uploaded Documents');
  console.log('-'.repeat(80));
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/therapist/credentialing/documents`);

    if (response.ok) {
      const documents = await response.json();
      console.log(`✅ Retrieved ${documents.length} document(s)`);
      documents.forEach((doc: any, index: number) => {
        console.log(`   ${index + 1}. ${doc.documentType} - ${doc.fileName} (${doc.verified ? 'Verified' : 'Pending'})`);
      });
      results.push({ test: 'Get Documents', success: true, message: `${documents.length} documents found` });
    } else {
      throw new Error('Failed to get documents');
    }
  } catch (error: any) {
    console.log('❌ Failed to get documents:', error.message);
    results.push({ test: 'Get Documents', success: false, message: error.message });
  }
  console.log('');

  // Summary
  console.log('='.repeat(80));
  console.log('Test Summary');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');

  console.log('Detailed Results:');
  results.forEach((result) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.test}: ${result.message}`);
  });
  console.log('');

  if (failed === 0) {
    console.log('🎉 All tests passed! Credentialing system is working correctly!');
    console.log('');
    console.log('You can now:');
    console.log('1. Log in at http://localhost:5000 with therapist@test.com / password123');
    console.log('2. Navigate to Credentialing in the menu');
    console.log('3. Upload documents, verify NPI, and track your progress');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
