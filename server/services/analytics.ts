/**
 * Analytics Tracking Service
 * HIPAA-Compliant anonymous visitor tracking
 * Tracks city-level location data for business intelligence
 */

import { Request } from 'express';
import { db } from '../db';
import { pageViews, locationSearches, userLocationHistory } from '@shared/schema';
import type { InsertPageView, InsertLocationSearch, InsertUserLocationHistory } from '@shared/schema';
import { getLocationFromRequest } from './ipGeolocation';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Session type
declare module 'express-session' {
  interface SessionData {
    analyticsSessionId?: string;
    sessionStartTime?: number;
  }
}

/**
 * Get or create anonymous analytics session ID
 * NOT linked to user accounts
 */
export function getAnalyticsSessionId(req: Request): string {
  // Check existing session
  if (req.session.analyticsSessionId) {
    return req.session.analyticsSessionId;
  }

  // Generate new anonymous session ID
  const sessionId = uuidv4();
  req.session.analyticsSessionId = sessionId;
  req.session.sessionStartTime = Date.now();

  return sessionId;
}

/**
 * Check if this is a new analytics session
 */
function isNewSession(req: Request): boolean {
  const startTime = req.session.sessionStartTime;
  if (!startTime) return true;

  // Consider new if session started in last 30 seconds
  return (Date.now() - startTime) < 30000;
}

/**
 * Extract device type from user agent
 */
function getDeviceType(userAgent?: string): string {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  return 'desktop';
}

/**
 * Extract browser family from user agent
 */
function getBrowserFamily(userAgent?: string): string {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();
  if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
  return 'other';
}

/**
 * Extract referrer domain from URL
 */
function getReferrerDomain(referrer?: string): string | null {
  if (!referrer) return 'direct';

  try {
    const url = new URL(referrer);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Track page view (anonymous)
 * Called on every page load
 */
export async function trackPageView(req: Request, pagePath: string): Promise<void> {
  try {
    // Get anonymous session ID
    const sessionId = getAnalyticsSessionId(req);
    const isNew = isNewSession(req);

    // Get location from IP (non-blocking)
    const locationResult = await getLocationFromRequest(req);

    // Extract device/browser info
    const userAgent = req.headers['user-agent'];
    const deviceType = getDeviceType(userAgent);
    const browserFamily = getBrowserFamily(userAgent);
    const referrerDomain = getReferrerDomain(req.headers['referer']);

    // Prepare page view data
    const pageView: InsertPageView = {
      sessionId,
      isNewSession: isNew,
      pagePath,
      referrerDomain,
      deviceType,
      browserFamily,
      city: locationResult.success ? locationResult.location?.city : null,
      state: locationResult.success ? locationResult.location?.region : null,
      country: locationResult.success ? locationResult.location?.country : 'USA',
      locationMethod: locationResult.success ? 'ip' : 'unknown',
    };

    // Insert asynchronously (don't block request)
    db.insert(pageViews)
      .values(pageView)
      .catch(err => {
        console.error('[Analytics] Failed to track page view:', err.message);
      });

    console.log(`[Analytics] Page view tracked: ${pagePath} from ${pageView.city || 'unknown'}, ${pageView.state || 'unknown'}`);

  } catch (error) {
    // Never throw - analytics should not break the app
    console.error('[Analytics] Error tracking page view:', error);
  }
}

/**
 * Track location-based search
 * Called when user searches for therapists
 */
export async function trackLocationSearch(
  req: Request,
  searchData: {
    city?: string;
    state?: string;
    zipCode?: string;
    radiusMiles?: number;
    locationMethod: 'ip' | 'gps' | 'manual';
    resultsFound: number;
    filters?: {
      specialties?: string[];
      insurance?: string[];
      modalities?: string[];
      gender?: string[];
    };
  }
): Promise<void> {
  try {
    const sessionId = getAnalyticsSessionId(req);

    // Prepare search data
    const searchRecord: InsertLocationSearch = {
      sessionId,
      searchCity: searchData.city || null,
      searchState: searchData.state || null,
      searchZip: searchData.zipCode || null,
      radiusMiles: searchData.radiusMiles || 25,
      locationMethod: searchData.locationMethod,
      resultsFound: searchData.resultsFound,
      resultsClicked: 0, // Will be updated if user clicks

      // Track IF filters were used, not WHAT filters (privacy)
      hadSpecialtyFilter: !!(searchData.filters?.specialties?.length),
      hadInsuranceFilter: !!(searchData.filters?.insurance?.length),
      hadModalityFilter: !!(searchData.filters?.modalities?.length),
      hadGenderFilter: !!(searchData.filters?.gender?.length),
    };

    // Insert asynchronously
    await db.insert(locationSearches).values(searchRecord);

    console.log(`[Analytics] Search tracked: ${searchRecord.searchCity}, ${searchRecord.searchState} (${searchRecord.resultsFound} results)`);

  } catch (error) {
    console.error('[Analytics] Error tracking search:', error);
  }
}

/**
 * Track registered user location (requires consent)
 * WARNING: This contains PHI - only call with user consent
 */
export async function trackUserLocation(
  userId: string,
  locationData: {
    city?: string;
    state?: string;
    zipCode?: string;
    locationMethod: 'ip' | 'gps' | 'manual';
    actionType: 'search' | 'profile_view' | 'booking' | 'account_creation';
  }
): Promise<void> {
  try {
    const userLocation: InsertUserLocationHistory = {
      userId,
      city: locationData.city || null,
      state: locationData.state || null,
      zipCode: locationData.zipCode || null,
      country: 'USA',
      locationMethod: locationData.locationMethod,
      actionType: locationData.actionType,
    };

    await db.insert(userLocationHistory).values(userLocation);

    console.log(`[Analytics] User location tracked: ${userId} - ${userLocation.actionType}`);

  } catch (error) {
    console.error('[Analytics] Error tracking user location:', error);
  }
}

/**
 * Get analytics session info (for debugging)
 */
export function getSessionInfo(req: Request): {
  sessionId: string;
  isNew: boolean;
  duration: number;
} {
  const sessionId = getAnalyticsSessionId(req);
  const isNew = isNewSession(req);
  const duration = req.session.sessionStartTime
    ? Date.now() - req.session.sessionStartTime
    : 0;

  return { sessionId, isNew, duration };
}

/**
 * Cleanup old analytics data
 * Run this as a daily cron job
 */
export async function cleanupOldAnalytics(): Promise<void> {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Delete old page views
    const { sql } = await import('drizzle-orm');
    await db.execute(sql`
      DELETE FROM page_views
      WHERE created_at < ${ninetyDaysAgo.toISOString()}
    `);

    // Delete old location searches
    await db.execute(sql`
      DELETE FROM location_searches
      WHERE created_at < ${ninetyDaysAgo.toISOString()}
    `);

    // Delete old user location history (1 year retention)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    await db.execute(sql`
      DELETE FROM user_location_history
      WHERE created_at < ${oneYearAgo.toISOString()}
    `);

    console.log('[Analytics] Old data cleaned up successfully');

  } catch (error) {
    console.error('[Analytics] Error cleaning up old data:', error);
  }
}
