/**
 * Credentialing System Debugging Tool
 * Diagnoses common issues with the credentialing upload and workflow
 */

import { db } from '../server/db';
import { therapists, credentialingDocuments } from '@shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

interface DiagnosticResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  fix?: string;
}

const results: DiagnosticResult[] = [];

async function diagnoseCredentialingSystem() {
  console.log('='.repeat(80));
  console.log('CREDENTIALING SYSTEM DIAGNOSTICS');
  console.log('='.repeat(80));
  console.log('');

  // 1. Check Database Connection
  console.log('1. Checking Database Connection...');
  try {
    await db.select().from(therapists).limit(1);
    results.push({
      check: 'Database Connection',
      status: 'pass',
      message: 'Successfully connected to database',
    });
    console.log('   ✅ Database connected');
  } catch (error: any) {
    results.push({
      check: 'Database Connection',
      status: 'fail',
      message: `Failed to connect: ${error.message}`,
      fix: 'Check DATABASE_URL in .env file and ensure database is running',
    });
    console.log('   ❌ Database connection failed:', error.message);
    return;
  }
  console.log('');

  // 2. Check Credentialing Tables Exist
  console.log('2. Checking Database Schema...');
  try {
    await db.select().from(credentialingDocuments).limit(1);
    results.push({
      check: 'Database Schema',
      status: 'pass',
      message: 'Credentialing tables exist',
    });
    console.log('   ✅ Credentialing tables exist');
  } catch (error: any) {
    results.push({
      check: 'Database Schema',
      status: 'fail',
      message: 'Credentialing tables missing',
      fix: 'Run: npm run db:push',
    });
    console.log('   ❌ Credentialing tables missing');
    console.log('   💡 FIX: Run "npm run db:push" to create tables');
    return;
  }
  console.log('');

  // 3. Check Uploads Directory
  console.log('3. Checking Uploads Directory...');
  const uploadsDir = path.join(process.cwd(), 'uploads', 'credentialing');
  try {
    await fs.access(uploadsDir);
    const stats = await fs.stat(uploadsDir);
    if (!stats.isDirectory()) {
      results.push({
        check: 'Uploads Directory',
        status: 'fail',
        message: 'Path exists but is not a directory',
        fix: 'Delete the file and create a directory: mkdir uploads/credentialing',
      });
      console.log('   ❌ uploads/credentialing exists but is not a directory');
    } else {
      results.push({
        check: 'Uploads Directory',
        status: 'pass',
        message: `Directory exists: ${uploadsDir}`,
      });
      console.log('   ✅ Uploads directory exists:', uploadsDir);
    }
  } catch {
    results.push({
      check: 'Uploads Directory',
      status: 'warning',
      message: 'Directory does not exist (will be created on first upload)',
      details: { path: uploadsDir },
    });
    console.log('   ⚠️  Directory does not exist (will be created automatically)');
    console.log('      Path:', uploadsDir);
  }
  console.log('');

  // 4. Check Environment Variables
  console.log('4. Checking Environment Variables...');
  const envVars = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    SESSION_SECRET: !!process.env.SESSION_SECRET,
    STORAGE_BACKEND: process.env.STORAGE_BACKEND || 'local',
  };

  if (!envVars.DATABASE_URL) {
    results.push({
      check: 'Environment Variables',
      status: 'fail',
      message: 'DATABASE_URL not set',
      fix: 'Set DATABASE_URL in .env file',
    });
    console.log('   ❌ DATABASE_URL not set');
  } else if (!envVars.SESSION_SECRET) {
    results.push({
      check: 'Environment Variables',
      status: 'fail',
      message: 'SESSION_SECRET not set',
      fix: 'Set SESSION_SECRET in .env file',
    });
    console.log('   ❌ SESSION_SECRET not set');
  } else {
    results.push({
      check: 'Environment Variables',
      status: 'pass',
      message: 'Required environment variables are set',
      details: envVars,
    });
    console.log('   ✅ Environment variables configured');
    console.log('      Storage Backend:', envVars.STORAGE_BACKEND);
  }
  console.log('');

  // 5. Check Therapist Accounts
  console.log('5. Checking Therapist Accounts...');
  try {
    const therapistCount = await db.select().from(therapists);
    const withCredentialing = therapistCount.filter(t => t.credentialingStatus);

    results.push({
      check: 'Therapist Accounts',
      status: therapistCount.length > 0 ? 'pass' : 'warning',
      message: `Found ${therapistCount.length} therapist(s), ${withCredentialing.length} with credentialing started`,
      details: {
        total: therapistCount.length,
        withCredentialing: withCredentialing.length,
      },
    });

    console.log(`   ℹ️  Found ${therapistCount.length} therapist account(s)`);
    console.log(`   ℹ️  ${withCredentialing.length} have started credentialing`);

    if (therapistCount.length === 0) {
      console.log('   ⚠️  No therapist accounts found');
      console.log('   💡 Create a test account: npm run create-therapist-test-account');
    }
  } catch (error: any) {
    results.push({
      check: 'Therapist Accounts',
      status: 'fail',
      message: `Error querying therapists: ${error.message}`,
    });
    console.log('   ❌ Error querying therapists:', error.message);
  }
  console.log('');

  // 6. Check Uploaded Documents
  console.log('6. Checking Uploaded Documents...');
  try {
    const documents = await db.select().from(credentialingDocuments);
    const verified = documents.filter(d => d.verified);

    results.push({
      check: 'Uploaded Documents',
      status: 'pass',
      message: `Found ${documents.length} document(s), ${verified.length} verified`,
      details: {
        total: documents.length,
        verified: verified.length,
        unverified: documents.length - verified.length,
      },
    });

    console.log(`   ℹ️  Found ${documents.length} uploaded document(s)`);
    console.log(`   ℹ️  ${verified.length} verified, ${documents.length - verified.length} pending verification`);

    if (documents.length > 0) {
      console.log('\n   Recent uploads:');
      documents.slice(0, 5).forEach(doc => {
        console.log(`      - ${doc.documentType}: ${doc.fileName} (${doc.verified ? 'verified' : 'pending'})`);
      });
    }
  } catch (error: any) {
    results.push({
      check: 'Uploaded Documents',
      status: 'fail',
      message: `Error querying documents: ${error.message}`,
    });
    console.log('   ❌ Error querying documents:', error.message);
  }
  console.log('');

  // 7. Common Upload Issues
  console.log('7. Common Upload Issues & Solutions...');
  console.log('');
  console.log('   ❌ "Therapist profile not found"');
  console.log('      → You must be logged in as a therapist');
  console.log('      → Create therapist account: npm run create-therapist-test-account');
  console.log('');
  console.log('   ❌ "No file uploaded"');
  console.log('      → File input is empty - select a file first');
  console.log('      → Check browser console for FormData issues');
  console.log('');
  console.log('   ❌ "Document type is required"');
  console.log('      → Select a document type from the dropdown');
  console.log('      → Check that documentType is being sent in the request');
  console.log('');
  console.log('   ❌ "Invalid file type"');
  console.log('      → Only PDF, JPG, PNG, GIF, DOC, DOCX allowed');
  console.log('      → Check file extension matches MIME type');
  console.log('');
  console.log('   ❌ "File too large"');
  console.log('      → Maximum file size is 10MB');
  console.log('      → Compress or resize the file');
  console.log('');
  console.log('   ❌ "Failed to upload document" (500 error)');
  console.log('      → Check server logs for detailed error');
  console.log('      → Ensure uploads directory is writable');
  console.log('      → Check documentStorage service is working');
  console.log('');

  // Summary
  console.log('='.repeat(80));
  console.log('DIAGNOSTIC SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log('');

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️ ';
    console.log(`${icon} ${result.check}: ${result.message}`);
    if (result.fix) {
      console.log(`   💡 Fix: ${result.fix}`);
    }
  });

  console.log('');
  console.log('='.repeat(80));
  console.log('NEXT STEPS');
  console.log('='.repeat(80));
  console.log('');

  if (failed > 0) {
    console.log('1. Fix the failed checks above');
    console.log('2. Run this diagnostic again to verify');
  } else {
    console.log('1. Start the dev server: npm run dev');
    console.log('2. Log in as a therapist (or create account)');
    console.log('3. Navigate to Provider Credentialing page');
    console.log('4. Try uploading a test document');
    console.log('5. Check browser console (F12) for errors');
    console.log('6. Check server logs for backend errors');
  }
  console.log('');
  console.log('For detailed debugging:');
  console.log('- Check server/routes.ts line 831 (upload endpoint)');
  console.log('- Check server/services/documentStorage.ts (file handling)');
  console.log('- Check client/src/components/credentialing/provider/DocumentUploadInterface.tsx (frontend)');
  console.log('');
}

// Run diagnostics
diagnoseCredentialingSystem()
  .then(() => {
    console.log('Diagnostics complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Diagnostic failed:', error);
    process.exit(1);
  });
