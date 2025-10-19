/**
 * Proximity-Based Therapist Matching
 * Calculates distance between user ZIP and therapist ZIP
 * Prevents showing Boston therapists to Denver patients
 */

import { db } from '../db';
import { zipCodes } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

interface ZipCodeData {
  zipCode: string;
  city: string;
  state: string;
  latitude: string;
  longitude: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Get coordinates for a ZIP code or city name
 */
export async function getLocationCoordinates(
  location: string
): Promise<ZipCodeData | null> {
  // Try as ZIP code first
  if (/^\d{5}$/.test(location)) {
    const [zipData] = await db
      .select()
      .from(zipCodes)
      .where(eq(zipCodes.zipCode, location))
      .limit(1);

    if (zipData) {
      return zipData as ZipCodeData;
    }
  }

  // Try as city name - use case-insensitive search with LOWER()
  const cityName = location.trim();
  const [cityData] = await db
    .select()
    .from(zipCodes)
    .where(sql`LOWER(city) = LOWER(${cityName})`)
    .limit(1);

  if (cityData) {
    return cityData as ZipCodeData;
  }

  return null;
}

/**
 * Calculate distance from user location to therapist location
 * Returns distance in miles, or null if coordinates not available
 */
export async function calculateTherapistDistance(
  userLocation: string,
  therapistZipCode: string
): Promise<number | null> {
  try {
    const userCoords = await getLocationCoordinates(userLocation);
    const therapistCoords = await getLocationCoordinates(therapistZipCode);

    if (!userCoords) {
      console.log(`[PROXIMITY] Could not find coordinates for user location: ${userLocation}`);
      return null;
    }

    if (!therapistCoords) {
      console.log(`[PROXIMITY] Could not find coordinates for therapist ZIP: ${therapistZipCode}`);
      return null;
    }

    const distance = calculateDistance(
      parseFloat(userCoords.latitude),
      parseFloat(userCoords.longitude),
      parseFloat(therapistCoords.latitude),
      parseFloat(therapistCoords.longitude)
    );

    return distance;
  } catch (error) {
    console.error('[PROXIMITY] Error calculating distance:', error);
    return null;
  }
}

/**
 * Filter therapists by maximum distance
 * Returns only therapists within maxDistanceMiles of user location
 */
export async function filterByProximity<T extends { zipCode?: string | null }>(
  therapists: T[],
  userLocation: string,
  maxDistanceMiles: number = 50
): Promise<Array<T & { distance: number | null }>> {
  const therapistsWithDistance = await Promise.all(
    therapists.map(async (therapist) => {
      if (!therapist.zipCode) {
        return { ...therapist, distance: null };
      }

      const distance = await calculateTherapistDistance(
        userLocation,
        therapist.zipCode
      );

      return { ...therapist, distance };
    })
  );

  // Filter to only include therapists within max distance
  // Or therapists where distance couldn't be calculated (benefit of doubt)
  const filtered = therapistsWithDistance.filter(
    (t) => t.distance === null || t.distance <= maxDistanceMiles
  );

  // Sort by distance (closest first), nulls last
  filtered.sort((a, b) => {
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });

  return filtered;
}

/**
 * Get distance ranges for pagination
 * Returns therapists in expanding circles: 0-25mi, 25-50mi, 50-100mi, 100+mi
 */
export async function getTherapistsByDistanceRanges<
  T extends { zipCode?: string | null }
>(
  therapists: T[],
  userLocation: string
): Promise<{
  nearby: Array<T & { distance: number | null }>; // 0-25 miles
  regional: Array<T & { distance: number | null }>; // 25-50 miles
  extended: Array<T & { distance: number | null }>; // 50-100 miles
  distant: Array<T & { distance: number | null }>; // 100+ miles
}> {
  const therapistsWithDistance = await Promise.all(
    therapists.map(async (therapist) => {
      if (!therapist.zipCode) {
        return { ...therapist, distance: null };
      }

      const distance = await calculateTherapistDistance(
        userLocation,
        therapist.zipCode
      );

      return { ...therapist, distance };
    })
  );

  // Sort all by distance
  therapistsWithDistance.sort((a, b) => {
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });

  return {
    nearby: therapistsWithDistance.filter((t) => t.distance !== null && t.distance <= 25),
    regional: therapistsWithDistance.filter((t) => t.distance !== null && t.distance > 25 && t.distance <= 50),
    extended: therapistsWithDistance.filter((t) => t.distance !== null && t.distance > 50 && t.distance <= 100),
    distant: therapistsWithDistance.filter((t) => t.distance !== null && t.distance > 100),
  };
}
