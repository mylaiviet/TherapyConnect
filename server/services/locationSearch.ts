/**
 * Location Search Service
 * Provides fuzzy matching for city names and ZIP code lookups
 */

import Fuse from 'fuse.js';
import { db } from '../db';
import { zipCodes } from '@shared/schema';
import { like, or, eq } from 'drizzle-orm';

export interface LocationResult {
  zip: string;
  city: string;
  state: string;
  latitude: string | null;
  longitude: string | null;
  matchScore?: number; // 0-1, higher is better
}

// Cache for city list (loaded once on first search)
let cityCache: { city: string; state: string; zip: string }[] = [];
let fuseInstance: Fuse<{ city: string; state: string; zip: string }> | null = null;

/**
 * Initialize the fuzzy search index
 * Loads all unique cities from database
 */
async function initializeFuseIndex() {
  if (fuseInstance) return; // Already initialized

  console.log('Initializing location fuzzy search index...');

  // Get all ZIP codes from database
  const allZips = await db.select().from(zipCodes);

  // Create unique city+state combinations for searching
  const uniqueCities = new Map<string, { city: string; state: string; zip: string }>();

  allZips.forEach((zip) => {
    const key = `${zip.city.toLowerCase()},${zip.state}`;
    if (!uniqueCities.has(key)) {
      uniqueCities.set(key, {
        city: zip.city,
        state: zip.state,
        zip: zip.zip,
      });
    }
  });

  cityCache = Array.from(uniqueCities.values());

  // Initialize Fuse.js with fuzzy matching configuration
  fuseInstance = new Fuse(cityCache, {
    keys: [
      { name: 'city', weight: 0.7 },
      { name: 'state', weight: 0.3 },
    ],
    threshold: 0.4, // 0 = exact match, 1 = match anything (0.4 = 60% similarity required)
    distance: 100,
    minMatchCharLength: 3,
    includeScore: true,
  });

  console.log(`✅ Fuzzy search index initialized with ${cityCache.length} cities`);
}

/**
 * Search for locations by city name (with fuzzy matching for misspellings)
 * @param query - User's search input (city name, possibly misspelled)
 * @param limit - Maximum number of results to return
 * @returns Array of matching locations, sorted by relevance
 */
export async function searchLocationByCity(
  query: string,
  limit: number = 5
): Promise<LocationResult[]> {
  // Handle empty query
  if (!query || query.trim().length < 3) {
    return [];
  }

  const normalizedQuery = query.trim();

  // Initialize fuzzy search if not already done
  await initializeFuzeIndex();

  if (!fuseInstance) {
    throw new Error('Fuzzy search index not initialized');
  }

  // Perform fuzzy search
  const fuzzyResults = fuseInstance.search(normalizedQuery, { limit: limit * 2 });

  // Get ZIP codes for matched cities
  const results: LocationResult[] = [];

  for (const result of fuzzyResults.slice(0, limit)) {
    const { city, state, zip } = result.item;

    // Get first ZIP code for this city
    const [zipData] = await db
      .select()
      .from(zipCodes)
      .where(eq(zipCodes.zip, zip))
      .limit(1);

    if (zipData) {
      results.push({
        zip: zipData.zip,
        city: zipData.city,
        state: zipData.state,
        latitude: zipData.latitude,
        longitude: zipData.longitude,
        matchScore: result.score ? 1 - result.score : 1, // Convert to 0-1 (higher is better)
      });
    }
  }

  return results;
}

/**
 * Lookup location by exact ZIP code
 * @param zipCode - 5-digit ZIP code
 * @returns Location data if found, null otherwise
 */
export async function lookupByZipCode(zipCode: string): Promise<LocationResult | null> {
  // Validate ZIP code format
  if (!/^\d{5}$/.test(zipCode)) {
    return null;
  }

  const [result] = await db
    .select()
    .from(zipCodes)
    .where(eq(zipCodes.zip, zipCode))
    .limit(1);

  if (!result) {
    return null;
  }

  return {
    zip: result.zip,
    city: result.city,
    state: result.state,
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

/**
 * Smart location search - handles both ZIP codes and city names
 * @param query - User input (ZIP code or city name)
 * @param limit - Max results for city search
 * @returns Array of matching locations
 */
export async function smartLocationSearch(
  query: string,
  limit: number = 5
): Promise<LocationResult[]> {
  const normalizedQuery = query.trim();

  // Check if query is a ZIP code (5 digits)
  if (/^\d{5}$/.test(normalizedQuery)) {
    const zipResult = await lookupByZipCode(normalizedQuery);
    return zipResult ? [zipResult] : [];
  }

  // Otherwise, treat as city name with fuzzy matching
  return searchLocationByCity(normalizedQuery, limit);
}

// Helper function with correct spelling
async function initializeFuzeIndex() {
  return initializeFuseIndex();
}
