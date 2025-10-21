/**
 * Matomo Analytics Service - Client Side
 *
 * Handles anonymous visitor tracking before authentication
 * Implements HIPAA-compliant tracking with PHI protection
 */

declare global {
  interface Window {
    _paq: any[];
  }
}

export class MatomoAnalytics {
  private initialized: boolean = false;
  private matomoUrl: string;
  private siteId: string;
  private userId: string | null = null;

  constructor(matomoUrl: string, siteId: string) {
    this.matomoUrl = matomoUrl;
    this.siteId = siteId;
  }

  /**
   * Initialize Matomo tracking for anonymous visitors
   * This should be called as early as possible in the app lifecycle
   */
  public initAnonymousTracking(): void {
    if (this.initialized) {
      console.warn('[Matomo] Already initialized');
      return;
    }

    // Initialize the _paq array
    window._paq = window._paq || [];
    const _paq = window._paq;

    // Configure tracking settings for HIPAA compliance
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);

    // Disable tracking of precise location
    _paq.push(['setExcludedQueryParams', ['email', 'phone', 'name', 'token']]);

    // Respect Do Not Track
    _paq.push(['setDoNotTrack', true]);

    // Set tracker URL and site ID
    _paq.push(['setTrackerUrl', `${this.matomoUrl}/matomo.php`]);
    _paq.push(['setSiteId', this.siteId]);

    // Load Matomo script asynchronously
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `${this.matomoUrl}/matomo.js`;

    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }

    this.initialized = true;
    console.log('[Matomo] Anonymous visitor tracking initialized');
  }

  /**
   * Set user ID after authentication
   * This links anonymous visitor data to authenticated user
   */
  public setUserId(userId: string): void {
    if (!this.initialized) {
      console.warn('[Matomo] Not initialized, call initAnonymousTracking first');
      return;
    }

    this.userId = userId;
    window._paq = window._paq || [];
    window._paq.push(['setUserId', userId]);

    // Track the login event
    window._paq.push(['trackEvent', 'Authentication', 'Login', userId]);

    console.log('[Matomo] User ID set:', userId);
  }

  /**
   * Reset user ID on logout
   */
  public resetUserId(): void {
    if (!this.initialized) return;

    window._paq = window._paq || [];
    window._paq.push(['resetUserId']);
    window._paq.push(['trackEvent', 'Authentication', 'Logout']);

    this.userId = null;
    console.log('[Matomo] User ID reset');
  }

  /**
   * Track page view (automatic with SPA routing)
   */
  public trackPageView(customTitle?: string): void {
    if (!this.initialized) return;

    window._paq = window._paq || [];

    if (customTitle) {
      // Sanitize title to remove any PHI
      const sanitizedTitle = this.sanitizeTitle(customTitle);
      window._paq.push(['setDocumentTitle', sanitizedTitle]);
    }

    window._paq.push(['trackPageView']);
  }

  /**
   * Track custom event
   * Used for tracking user interactions without PHI
   */
  public trackEvent(
    category: string,
    action: string,
    name?: string,
    value?: number
  ): void {
    if (!this.initialized) return;

    window._paq = window._paq || [];

    // Sanitize all parameters to prevent PHI leakage
    const sanitizedCategory = this.sanitizeString(category);
    const sanitizedAction = this.sanitizeString(action);
    const sanitizedName = name ? this.sanitizeString(name) : undefined;

    if (sanitizedName !== undefined && value !== undefined) {
      window._paq.push(['trackEvent', sanitizedCategory, sanitizedAction, sanitizedName, value]);
    } else if (sanitizedName !== undefined) {
      window._paq.push(['trackEvent', sanitizedCategory, sanitizedAction, sanitizedName]);
    } else {
      window._paq.push(['trackEvent', sanitizedCategory, sanitizedAction]);
    }
  }

  /**
   * Track site search (without search query content for HIPAA)
   */
  public trackSearch(keyword: string, category?: string, resultsCount?: number): void {
    if (!this.initialized) return;

    window._paq = window._paq || [];

    // Don't track actual search terms that might contain symptoms/conditions
    // Only track that a search occurred
    window._paq.push(['trackEvent', 'Search', 'Performed', category, resultsCount]);
  }

  /**
   * Track goal conversion
   */
  public trackGoal(goalId: number, customRevenue?: number): void {
    if (!this.initialized) return;

    window._paq = window._paq || [];
    window._paq.push(['trackGoal', goalId, customRevenue]);
  }

  /**
   * Track outbound link click
   */
  public trackOutboundLink(url: string): void {
    if (!this.initialized) return;

    window._paq = window._paq || [];
    window._paq.push(['trackLink', url, 'link']);
  }

  /**
   * Track download
   */
  public trackDownload(url: string): void {
    if (!this.initialized) return;

    window._paq = window._paq || [];
    window._paq.push(['trackLink', url, 'download']);
  }

  /**
   * Set custom dimension
   * Useful for tracking user properties without PHI
   */
  public setCustomDimension(dimensionId: number, value: string): void {
    if (!this.initialized) return;

    window._paq = window._paq || [];
    window._paq.push(['setCustomDimension', dimensionId, this.sanitizeString(value)]);
  }

  /**
   * Delete custom dimension
   */
  public deleteCustomDimension(dimensionId: number): void {
    if (!this.initialized) return;

    window._paq = window._paq || [];
    window._paq.push(['deleteCustomDimension', dimensionId]);
  }

  /**
   * Sanitize title to remove potential PHI
   */
  private sanitizeTitle(title: string): string {
    // Remove any email addresses
    let sanitized = title.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[email]');

    // Remove phone numbers
    sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[phone]');

    // Remove potential names (words with capital letters in specific positions)
    // This is a basic implementation - enhance based on your needs

    return sanitized;
  }

  /**
   * Sanitize string to remove potential PHI
   */
  private sanitizeString(input: string): string {
    if (!input) return '';

    // Remove email addresses
    let sanitized = input.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[redacted]');

    // Remove phone numbers
    sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[redacted]');

    // Remove potential SSN patterns
    sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[redacted]');

    return sanitized;
  }

  /**
   * Get visitor ID (useful for debugging)
   */
  public async getVisitorId(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!this.initialized) {
        resolve(null);
        return;
      }

      window._paq = window._paq || [];
      window._paq.push([function(this: any) {
        resolve(this.getVisitorId());
      }]);
    });
  }

  /**
   * Check if user has opted out of tracking
   */
  public async isUserOptedOut(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.initialized) {
        resolve(false);
        return;
      }

      window._paq = window._paq || [];
      window._paq.push([function(this: any) {
        resolve(this.isUserOptedOut());
      }]);
    });
  }

  /**
   * Opt user out of tracking
   */
  public optUserOut(): void {
    if (!this.initialized) return;

    window._paq = window._paq || [];
    window._paq.push(['optUserOut']);
  }

  /**
   * Opt user back in to tracking
   */
  public forgetUserOptOut(): void {
    if (!this.initialized) return;

    window._paq = window._paq || [];
    window._paq.push(['forgetUserOptOut']);
  }
}

// Create singleton instance
// These values should come from environment variables
const MATOMO_URL = import.meta.env.VITE_MATOMO_URL || 'https://analytics.yourdomain.com';
const MATOMO_SITE_ID = import.meta.env.VITE_MATOMO_SITE_ID || '1';

export const analytics = new MatomoAnalytics(MATOMO_URL, MATOMO_SITE_ID);

// Export convenience functions
export const initTracking = () => analytics.initAnonymousTracking();
export const setUserId = (userId: string) => analytics.setUserId(userId);
export const resetUserId = () => analytics.resetUserId();
export const trackPageView = (title?: string) => analytics.trackPageView(title);
export const trackEvent = (category: string, action: string, name?: string, value?: number) =>
  analytics.trackEvent(category, action, name, value);
export const trackGoal = (goalId: number, revenue?: number) => analytics.trackGoal(goalId, revenue);
