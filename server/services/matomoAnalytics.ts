/**
 * Matomo Analytics Service - Server Side
 *
 * Handles authenticated user tracking via Matomo HTTP API
 * Implements HIPAA-compliant server-side tracking
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface MatomoTrackingParams {
  // Required parameters
  idsite: string;           // Site ID
  rec: number;              // Always 1 to track
  url: string;              // Page URL

  // User identification
  uid?: string;             // User ID (anonymized)
  _id?: string;             // Visitor ID (16 char hex)

  // Action tracking
  action_name?: string;     // Page title
  e_c?: string;             // Event category
  e_a?: string;             // Event action
  e_n?: string;             // Event name
  e_v?: number;             // Event value

  // Custom dimensions
  dimension1?: string;      // Custom dimension 1 (e.g., user role)
  dimension2?: string;      // Custom dimension 2 (e.g., account age)
  dimension3?: string;      // Custom dimension 3
  dimension4?: string;      // Custom dimension 4
  dimension5?: string;      // Custom dimension 5

  // Technical data
  urlref?: string;          // Referrer URL
  ua?: string;              // User agent
  lang?: string;            // Language
  res?: string;             // Screen resolution

  // Timing
  cdt?: string;             // Custom timestamp (ISO 8601)
  h?: number;               // Hour
  m?: number;               // Minute
  s?: number;               // Second

  // Authentication
  token_auth?: string;      // Auth token for API
}

interface TrackEventOptions {
  userId?: string;
  userRole?: string;
  sessionAge?: string;
  customDimensions?: Record<number, string>;
}

export class MatomoServerAnalytics {
  private matomoUrl: string;
  private siteId: string;
  private authToken: string;
  private client: AxiosInstance;
  private enabled: boolean;

  constructor(matomoUrl: string, siteId: string, authToken: string) {
    this.matomoUrl = matomoUrl;
    this.siteId = siteId;
    this.authToken = authToken;
    this.enabled = !!matomoUrl && !!siteId && !!authToken;

    this.client = axios.create({
      baseURL: matomoUrl,
      timeout: 5000,
      headers: {
        'User-Agent': 'TherapyConnect-Server/1.0',
      },
    });

    if (this.enabled) {
      console.log('[Matomo Server] Initialized for authenticated user tracking');
    } else {
      console.warn('[Matomo Server] Not fully configured - tracking disabled');
    }
  }

  /**
   * Generate anonymized visitor ID from user ID
   * Consistent hash for same user, but not reversible
   */
  private generateVisitorId(userId: string): string {
    const hash = crypto.createHash('sha256').update(userId).digest('hex');
    return hash.substring(0, 16); // Matomo requires 16 hex chars
  }

  /**
   * Sanitize string to remove PHI
   */
  private sanitize(input: string): string {
    if (!input) return '';

    // Remove email addresses
    let sanitized = input.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[redacted]');

    // Remove phone numbers
    sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[redacted]');

    // Remove SSN patterns
    sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[redacted]');

    return sanitized;
  }

  /**
   * Track page view for authenticated user
   */
  public async trackPageView(
    userId: string,
    url: string,
    title: string,
    options?: TrackEventOptions
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      const params: MatomoTrackingParams = {
        idsite: this.siteId,
        rec: 1,
        url: this.sanitize(url),
        action_name: this.sanitize(title),
        uid: userId,
        _id: this.generateVisitorId(userId),
        token_auth: this.authToken,
        cdt: new Date().toISOString(),
      };

      // Add custom dimensions
      if (options?.userRole) {
        params.dimension1 = options.userRole; // User role (patient/provider/admin)
      }

      if (options?.sessionAge) {
        params.dimension2 = options.sessionAge; // Account age
      }

      if (options?.customDimensions) {
        Object.entries(options.customDimensions).forEach(([key, value]) => {
          const dimensionKey = `dimension${key}` as keyof MatomoTrackingParams;
          params[dimensionKey] = this.sanitize(value);
        });
      }

      await this.sendTracking(params);
      console.log(`[Matomo Server] Page view tracked for user ${userId}`);
    } catch (error) {
      console.error('[Matomo Server] Failed to track page view:', error);
    }
  }

  /**
   * Track custom event for authenticated user
   */
  public async trackEvent(
    userId: string,
    category: string,
    action: string,
    name?: string,
    value?: number,
    options?: TrackEventOptions
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      const params: MatomoTrackingParams = {
        idsite: this.siteId,
        rec: 1,
        url: `https://app.therapyconnect.com/event`, // Generic event URL
        e_c: this.sanitize(category),
        e_a: this.sanitize(action),
        e_n: name ? this.sanitize(name) : undefined,
        e_v: value,
        uid: userId,
        _id: this.generateVisitorId(userId),
        token_auth: this.authToken,
        cdt: new Date().toISOString(),
      };

      // Add custom dimensions
      if (options?.userRole) {
        params.dimension1 = options.userRole;
      }

      if (options?.sessionAge) {
        params.dimension2 = options.sessionAge;
      }

      if (options?.customDimensions) {
        Object.entries(options.customDimensions).forEach(([key, value]) => {
          const dimensionKey = `dimension${key}` as keyof MatomoTrackingParams;
          params[dimensionKey] = this.sanitize(value);
        });
      }

      await this.sendTracking(params);
      console.log(`[Matomo Server] Event tracked: ${category}/${action} for user ${userId}`);
    } catch (error) {
      console.error('[Matomo Server] Failed to track event:', error);
    }
  }

  /**
   * Track user registration
   */
  public async trackRegistration(userId: string, userRole: string): Promise<void> {
    await this.trackEvent(
      userId,
      'User',
      'Registration',
      userRole,
      undefined,
      { userRole, sessionAge: '0' }
    );
  }

  /**
   * Track profile completion
   */
  public async trackProfileCompletion(userId: string, completionPercentage: number): Promise<void> {
    await this.trackEvent(
      userId,
      'Profile',
      'Completed',
      undefined,
      completionPercentage
    );
  }

  /**
   * Track therapist match viewed
   */
  public async trackMatchViewed(userId: string, matchCount: number): Promise<void> {
    await this.trackEvent(
      userId,
      'Matching',
      'Results Viewed',
      undefined,
      matchCount
    );
  }

  /**
   * Track appointment booked
   */
  public async trackAppointmentBooked(userId: string, userRole: string): Promise<void> {
    await this.trackEvent(
      userId,
      'Appointment',
      'Booked',
      undefined,
      undefined,
      { userRole }
    );
  }

  /**
   * Track message sent
   */
  public async trackMessageSent(userId: string, messageType: string): Promise<void> {
    await this.trackEvent(
      userId,
      'Messaging',
      'Message Sent',
      messageType
    );
  }

  /**
   * Track search performed (without search terms for HIPAA)
   */
  public async trackSearch(userId: string, filterCount: number, resultsCount: number): Promise<void> {
    await this.trackEvent(
      userId,
      'Search',
      'Performed',
      `${filterCount} filters`,
      resultsCount
    );
  }

  /**
   * Track goal conversion
   */
  public async trackGoal(userId: string, goalId: number, revenue?: number): Promise<void> {
    if (!this.enabled) return;

    try {
      const params: MatomoTrackingParams = {
        idsite: this.siteId,
        rec: 1,
        url: `https://app.therapyconnect.com/goal/${goalId}`,
        uid: userId,
        _id: this.generateVisitorId(userId),
        token_auth: this.authToken,
        cdt: new Date().toISOString(),
      };

      // Note: Goal tracking with revenue requires additional params
      // idgoal and revenue which aren't in our type yet
      const trackingUrl = `${this.matomoUrl}/matomo.php`;
      await this.client.get(trackingUrl, {
        params: {
          ...params,
          idgoal: goalId,
          revenue: revenue,
        },
      });

      console.log(`[Matomo Server] Goal ${goalId} tracked for user ${userId}`);
    } catch (error) {
      console.error('[Matomo Server] Failed to track goal:', error);
    }
  }

  /**
   * Send tracking request to Matomo
   */
  private async sendTracking(params: MatomoTrackingParams): Promise<void> {
    try {
      const trackingUrl = `${this.matomoUrl}/matomo.php`;

      await this.client.get(trackingUrl, {
        params,
        timeout: 5000,
      });
    } catch (error) {
      // Log but don't throw - analytics failures shouldn't break the app
      console.error('[Matomo Server] Tracking request failed:', error);
    }
  }

  /**
   * Bulk track multiple events
   * Useful for batch processing
   */
  public async bulkTrack(requests: MatomoTrackingParams[]): Promise<void> {
    if (!this.enabled) return;

    try {
      const bulkUrl = `${this.matomoUrl}/matomo.php`;

      // Matomo bulk tracking format
      const bulkRequests = {
        requests: requests.map(req =>
          '?' + new URLSearchParams(req as any).toString()
        ),
        token_auth: this.authToken,
      };

      await this.client.post(bulkUrl, bulkRequests, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`[Matomo Server] Bulk tracked ${requests.length} events`);
    } catch (error) {
      console.error('[Matomo Server] Bulk tracking failed:', error);
    }
  }

  /**
   * Check if tracking is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }
}

// Create singleton instance
const MATOMO_URL = process.env.MATOMO_URL || '';
const MATOMO_SITE_ID = process.env.MATOMO_SITE_ID || '2'; // Separate site ID for authenticated users
const MATOMO_AUTH_TOKEN = process.env.MATOMO_AUTH_TOKEN || '';

export const matomoServer = new MatomoServerAnalytics(
  MATOMO_URL,
  MATOMO_SITE_ID,
  MATOMO_AUTH_TOKEN
);

// Export convenience functions
export const trackUserPageView = (userId: string, url: string, title: string, options?: TrackEventOptions) =>
  matomoServer.trackPageView(userId, url, title, options);

export const trackUserEvent = (userId: string, category: string, action: string, name?: string, value?: number, options?: TrackEventOptions) =>
  matomoServer.trackEvent(userId, category, action, name, value, options);

export const trackRegistration = (userId: string, userRole: string) =>
  matomoServer.trackRegistration(userId, userRole);

export const trackProfileCompletion = (userId: string, percentage: number) =>
  matomoServer.trackProfileCompletion(userId, percentage);

export const trackMatchViewed = (userId: string, matchCount: number) =>
  matomoServer.trackMatchViewed(userId, matchCount);

export const trackAppointmentBooked = (userId: string, userRole: string) =>
  matomoServer.trackAppointmentBooked(userId, userRole);
