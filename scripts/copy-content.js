/**
 * Cross-platform script to copy content directory to dist folder
 * Works on both Windows and Linux (Render deployment)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const sourceDir = path.join(projectRoot, 'content');
const destDir = path.join(projectRoot, 'dist', 'content');

console.log('📦 Copying content directory to dist folder...');
console.log('   Source:', sourceDir);
console.log('   Destination:', destDir);

try {
  // Check if source directory exists
  if (!fs.existsSync(sourceDir)) {
    console.error('❌ Error: content directory not found at:', sourceDir);
    process.exit(1);
  }

  // Create dist directory if it doesn't exist
  const distFolder = path.join(projectRoot, 'dist');
  if (!fs.existsSync(distFolder)) {
    console.log('   Creating dist directory...');
    fs.mkdirSync(distFolder, { recursive: true });
  }

  // Remove existing content directory in dist if it exists
  if (fs.existsSync(destDir)) {
    console.log('   Removing existing content directory...');
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  // Copy content directory recursively
  fs.cpSync(sourceDir, destDir, { recursive: true });

  // Verify the copy was successful
  const blogDir = path.join(destDir, 'blog');
  if (!fs.existsSync(blogDir)) {
    console.error('❌ Error: blog directory not found after copy');
    process.exit(1);
  }

  const blogFiles = fs.readdirSync(blogDir);
  const mdFiles = blogFiles.filter(f => f.endsWith('.md'));

  console.log(`✅ Content directory copied successfully!`);
  console.log(`   📄 Found ${mdFiles.length} blog articles`);
  console.log(`   📁 Files: ${mdFiles.join(', ')}`);

} catch (error) {
  console.error('❌ Error copying content directory:', error);
  process.exit(1);
}
