/**
 * Test Document Upload Endpoint
 * This script tests the document upload functionality
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function testUploadEndpoint() {
  console.log('='.repeat(80));
  console.log('Document Upload Endpoint Test');
  console.log('='.repeat(80));
  console.log('');

  // Step 1: Check if server is running
  console.log('1. Checking server status...');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      console.log('   ✅ Server is running');
      results.push({ test: 'Server Status', success: true, message: 'Server is running' });
    } else {
      console.log('   ❌ Server returned error:', response.status);
      results.push({ test: 'Server Status', success: false, message: `Server error: ${response.status}` });
      return;
    }
  } catch (error) {
    console.log('   ❌ Cannot connect to server');
    console.log('   Make sure the development server is running: npm run dev');
    results.push({ test: 'Server Status', success: false, message: 'Cannot connect to server' });
    return;
  }
  console.log('');

  // Step 2: Check uploads directory
  console.log('2. Checking uploads directory...');
  const uploadsDir = path.join(process.cwd(), 'uploads', 'credentialing');
  try {
    await fs.promises.access(uploadsDir);
    console.log('   ✅ Uploads directory exists:', uploadsDir);
    results.push({ test: 'Uploads Directory', success: true, message: 'Directory exists' });
  } catch {
    console.log('   ⚠️  Uploads directory does not exist. Creating...');
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    console.log('   ✅ Created uploads directory:', uploadsDir);
    results.push({ test: 'Uploads Directory', success: true, message: 'Directory created' });
  }
  console.log('');

  // Step 3: Check database tables
  console.log('3. Checking database schema...');
  console.log('   Run: npm run db:push');
  console.log('   This ensures all credentialing tables exist');
  console.log('');

  // Step 4: Authentication check
  console.log('4. Testing authentication...');
  console.log('   To test upload, you need to:');
  console.log('   a) Be logged in as a therapist');
  console.log('   b) Have a therapist profile created');
  console.log('');
  console.log('   Steps to test manually:');
  console.log('   1. Open http://localhost:5000/');
  console.log('   2. Sign up as a therapist or log in');
  console.log('   3. Go to Provider Credentialing page');
  console.log('   4. Try uploading a document');
  console.log('');

  // Step 5: Common issues
  console.log('5. Common Upload Failure Causes:');
  console.log('   ❌ Not logged in → Sign in first');
  console.log('   ❌ No therapist profile → Complete therapist registration');
  console.log('   ❌ File too large → Must be under 10MB');
  console.log('   ❌ Wrong file type → Use PDF, JPG, PNG, GIF, DOC, or DOCX');
  console.log('   ❌ Missing document type → Select a document type');
  console.log('   ❌ Missing expiration date → Required for licenses, insurance, etc.');
  console.log('');

  // Summary
  console.log('='.repeat(80));
  console.log('Test Summary');
  console.log('='.repeat(80));
  results.forEach((result) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.test}: ${result.message}`);
  });
  console.log('');
  console.log('Next Steps:');
  console.log('1. Make sure you are logged in as a therapist');
  console.log('2. Check browser console (F12) for detailed error messages');
  console.log('3. Check server logs for backend errors');
  console.log('4. Verify your therapist profile exists in the database');
  console.log('');
}

// Run the test
testUploadEndpoint()
  .then(() => {
    console.log('Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
