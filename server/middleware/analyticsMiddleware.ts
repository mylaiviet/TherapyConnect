/**
 * Analytics Middleware
 *
 * Automatically tracks authenticated user page views and actions
 */

import type { Request, Response, NextFunction } from 'express';
import { matomoServer } from '../services/matomoAnalytics';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    role: string;
  }
}

/**
 * Middleware to track page views for authenticated users
 * Place this after your auth/session middleware
 */
export function trackAuthenticatedPageView(req: Request, res: Response, next: NextFunction) {
  // Only track if user is authenticated
  if (req.session?.userId) {
    const userId = req.session.userId;
    const userRole = req.session.role || 'unknown';
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const title = `${req.method} ${req.path}`;

    // Track asynchronously without blocking the request
    matomoServer.trackPageView(userId, url, title, {
      userRole,
    }).catch(error => {
      console.error('[Analytics Middleware] Failed to track page view:', error);
    });
  }

  next();
}

/**
 * Helper function to track custom events
 * Use this in your route handlers for specific actions
 */
export function trackUserAction(
  userId: string,
  category: string,
  action: string,
  name?: string,
  value?: number
) {
  matomoServer.trackEvent(userId, category, action, name, value).catch(error => {
    console.error('[Analytics] Failed to track user action:', error);
  });
}

/**
 * Middleware to track API endpoint usage
 * This is optional and can be selective based on your needs
 */
export function trackAPIUsage(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId && req.path.startsWith('/api/')) {
    const userId = req.session.userId;
    const endpoint = req.path.replace('/api/', '');

    // Track API usage without blocking
    matomoServer.trackEvent(
      userId,
      'API',
      req.method,
      endpoint
    ).catch(error => {
      console.error('[Analytics Middleware] Failed to track API usage:', error);
    });
  }

  next();
}

/**
 * Track specific user milestones
 * Call these functions directly in your route handlers
 */
export const trackingHelpers = {
  /**
   * Track when user completes registration
   */
  trackRegistration: (userId: string, role: string) => {
    return matomoServer.trackRegistration(userId, role);
  },

  /**
   * Track when user completes their profile
   */
  trackProfileCompletion: (userId: string, percentage: number) => {
    return matomoServer.trackProfileCompletion(userId, percentage);
  },

  /**
   * Track when user views therapist matches
   */
  trackMatchViewed: (userId: string, matchCount: number) => {
    return matomoServer.trackMatchViewed(userId, matchCount);
  },

  /**
   * Track when user books appointment
   */
  trackAppointmentBooked: (userId: string, role: string) => {
    return matomoServer.trackAppointmentBooked(userId, role);
  },

  /**
   * Track when user sends message
   */
  trackMessageSent: (userId: string, messageType: string) => {
    return matomoServer.trackEvent(userId, 'Messaging', 'Sent', messageType);
  },

  /**
   * Track search performed
   */
  trackSearch: (userId: string, filterCount: number, resultsCount: number) => {
    return matomoServer.trackSearch(userId, filterCount, resultsCount);
  },

  /**
   * Track login event
   */
  trackLogin: (userId: string, role: string) => {
    return matomoServer.trackEvent(userId, 'Authentication', 'Login', role);
  },

  /**
   * Track logout event
   */
  trackLogout: (userId: string) => {
    return matomoServer.trackEvent(userId, 'Authentication', 'Logout');
  },
};
