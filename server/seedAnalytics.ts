/**
 * Seed Analytics Data
 * Generates realistic test data for analytics dashboard testing
 */

import { db } from './db';
import { pageViews, locationSearches } from '@shared/schema';
import type { InsertPageView, InsertLocationSearch } from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';

const CITIES = [
  { city: 'San Francisco', state: 'CA' },
  { city: 'Los Angeles', state: 'CA' },
  { city: 'New York', state: 'NY' },
  { city: 'Brooklyn', state: 'NY' },
  { city: 'Chicago', state: 'IL' },
  { city: 'Houston', state: 'TX' },
  { city: 'Austin', state: 'TX' },
  { city: 'Seattle', state: 'WA' },
  { city: 'Boston', state: 'MA' },
  { city: 'Denver', state: 'CO' },
  { city: 'Portland', state: 'OR' },
  { city: 'Miami', state: 'FL' },
  { city: 'Atlanta', state: 'GA' },
  { city: 'Philadelphia', state: 'PA' },
  { city: 'Phoenix', state: 'AZ' },
];

const PAGE_PATHS = [
  '/',
  '/therapist-search',
  '/match',
  '/about',
  '/how-it-works',
];

const REFERRERS = [
  'google.com',
  'facebook.com',
  'twitter.com',
  'instagram.com',
  'direct',
  null,
];

const DEVICES = ['desktop', 'mobile', 'tablet'];
const BROWSERS = ['Chrome', 'Safari', 'Firefox', 'Edge'];
const LOCATION_METHODS = ['ip', 'gps', 'manual', 'unknown'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
  return date;
}

async function seedAnalytics() {
  console.log('🌱 Seeding analytics data...');

  const sessions = new Map<number, string>(); // day -> sessionId

  // Generate data for the past 30 days
  const pageViewsData: InsertPageView[] = [];
  const searchesData: InsertLocationSearch[] = [];

  for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
    const date = generateDate(daysAgo);

    // Generate 50-200 page views per day
    const viewCount = randomInt(50, 200);

    for (let i = 0; i < viewCount; i++) {
      const sessionId = sessions.get(daysAgo) || uuidv4();
      if (!sessions.has(daysAgo)) {
        sessions.set(daysAgo, sessionId);
      }

      const location = randomElement(CITIES);
      const isNewSession = Math.random() > 0.7; // 30% new sessions

      pageViewsData.push({
        sessionId,
        isNewSession,
        pagePath: randomElement(PAGE_PATHS),
        referrerDomain: randomElement(REFERRERS),
        deviceType: randomElement(DEVICES),
        browserFamily: randomElement(BROWSERS),
        city: location.city,
        state: location.state,
        country: 'USA',
        locationMethod: randomElement(LOCATION_METHODS),
        createdAt: date,
      });
    }

    // Generate 20-80 searches per day
    const searchCount = randomInt(20, 80);

    for (let i = 0; i < searchCount; i++) {
      const sessionId = randomElement(Array.from(sessions.values()));
      const location = randomElement(CITIES);
      const radius = randomElement([10, 25, 50, 100]);
      const resultsFound = randomInt(0, 25);

      searchesData.push({
        sessionId,
        searchCity: location.city,
        searchState: location.state,
        searchZip: null,
        radiusMiles: radius,
        locationMethod: randomElement(['ip', 'gps', 'manual']),
        resultsFound,
        resultsClicked: resultsFound > 0 ? randomInt(0, Math.min(resultsFound, 3)) : 0,
        hadSpecialtyFilter: Math.random() > 0.6,
        hadInsuranceFilter: Math.random() > 0.7,
        hadModalityFilter: Math.random() > 0.8,
        hadGenderFilter: Math.random() > 0.9,
        createdAt: date,
      });
    }
  }

  // Insert page views in batches
  console.log(`📄 Inserting ${pageViewsData.length} page views...`);
  const pageViewBatchSize = 500;
  for (let i = 0; i < pageViewsData.length; i += pageViewBatchSize) {
    const batch = pageViewsData.slice(i, i + pageViewBatchSize);
    await db.insert(pageViews).values(batch);
    console.log(`   ✓ Inserted page views ${i + 1} to ${Math.min(i + pageViewBatchSize, pageViewsData.length)}`);
  }

  // Insert searches in batches
  console.log(`🔍 Inserting ${searchesData.length} location searches...`);
  const searchBatchSize = 500;
  for (let i = 0; i < searchesData.length; i += searchBatchSize) {
    const batch = searchesData.slice(i, i + searchBatchSize);
    await db.insert(locationSearches).values(batch);
    console.log(`   ✓ Inserted searches ${i + 1} to ${Math.min(i + searchBatchSize, searchesData.length)}`);
  }

  console.log('✅ Analytics data seeded successfully!');
  console.log(`   • ${pageViewsData.length} page views`);
  console.log(`   • ${searchesData.length} location searches`);
  console.log(`   • ${CITIES.length} unique cities`);
  console.log(`   • Past 30 days of data`);
}

// Run automatically when executed
seedAnalytics()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error seeding analytics:', error);
    console.error(error);
    process.exit(1);
  });

export { seedAnalytics };
