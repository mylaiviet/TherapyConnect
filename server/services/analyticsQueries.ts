/**
 * Analytics Queries Service
 * Pre-built queries for admin dashboard
 */

import { db } from '../db';
import { sql, desc, eq, and, gte, lte, count, avg } from 'drizzle-orm';
import { pageViews, locationSearches, geographicAggregates } from '@shared/schema';

export interface DateRange {
  startDate: string; // ISO date string
  endDate: string;
}

/**
 * Get geographic distribution of visitors
 */
export async function getVisitorsByGeography(dateRange?: DateRange) {
  const conditions = [];
  if (dateRange) {
    conditions.push(gte(pageViews.createdAt, new Date(dateRange.startDate)));
    conditions.push(lte(pageViews.createdAt, new Date(dateRange.endDate)));
  }

  const results = await db
    .select({
      state: pageViews.state,
      city: pageViews.city,
      visitors: count(pageViews.id),
      uniqueSessions: sql<number>`COUNT(DISTINCT ${pageViews.sessionId})`,
    })
    .from(pageViews)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(pageViews.state, pageViews.city)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(50);

  return results;
}

/**
 * Get top cities by visitor count
 */
export async function getTopCities(limit: number = 10, dateRange?: DateRange) {
  const conditions = [sql`${pageViews.city} IS NOT NULL`];
  if (dateRange) {
    conditions.push(gte(pageViews.createdAt, new Date(dateRange.startDate)));
    conditions.push(lte(pageViews.createdAt, new Date(dateRange.endDate)));
  }

  const results = await db
    .select({
      city: pageViews.city,
      state: pageViews.state,
      visitors: count(pageViews.id),
    })
    .from(pageViews)
    .where(and(...conditions))
    .groupBy(pageViews.city, pageViews.state)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(limit);

  return results;
}

/**
 * Get location method usage statistics
 */
export async function getLocationMethodStats(dateRange?: DateRange) {
  const conditions = [];
  if (dateRange) {
    conditions.push(gte(locationSearches.createdAt, new Date(dateRange.startDate)));
    conditions.push(lte(locationSearches.createdAt, new Date(dateRange.endDate)));
  }

  const results = await db
    .select({
      locationMethod: locationSearches.locationMethod,
      searchCount: count(locationSearches.id),
      avgResultsFound: sql<number>`ROUND(AVG(${locationSearches.resultsFound}))`,
      avgRadius: sql<number>`ROUND(AVG(${locationSearches.radiusMiles}))`,
    })
    .from(locationSearches)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(locationSearches.locationMethod);

  return results;
}

/**
 * Get search patterns by city
 */
export async function getSearchPatternsByCity(dateRange?: DateRange) {
  const conditions = [sql`${locationSearches.searchCity} IS NOT NULL`];
  if (dateRange) {
    conditions.push(gte(locationSearches.createdAt, new Date(dateRange.startDate)));
    conditions.push(lte(locationSearches.createdAt, new Date(dateRange.endDate)));
  }

  const results = await db
    .select({
      city: locationSearches.searchCity,
      state: locationSearches.searchState,
      totalSearches: count(locationSearches.id),
      avgResultsFound: sql<number>`ROUND(AVG(${locationSearches.resultsFound}), 1)`,
      avgRadius: sql<number>`ROUND(AVG(${locationSearches.radiusMiles}))`,
      successRate: sql<number>`ROUND(100.0 * SUM(CASE WHEN ${locationSearches.resultsFound} > 0 THEN 1 ELSE 0 END) / COUNT(*), 1)`,
    })
    .from(locationSearches)
    .where(and(...conditions))
    .groupBy(locationSearches.searchCity, locationSearches.searchState)
    .having(sql`COUNT(*) >= 5`) // Min 5 searches for significance
    .orderBy(desc(sql`COUNT(*)`))
    .limit(30);

  return results;
}

/**
 * Identify underserved markets
 * Cities with high search demand but low results
 */
export async function getUnderservedMarkets(dateRange?: DateRange) {
  const conditions = [sql`${locationSearches.searchCity} IS NOT NULL`];
  if (dateRange) {
    conditions.push(gte(locationSearches.createdAt, new Date(dateRange.startDate)));
    conditions.push(lte(locationSearches.createdAt, new Date(dateRange.endDate)));
  }

  const results = await db
    .select({
      city: locationSearches.searchCity,
      state: locationSearches.searchState,
      searchDemand: count(locationSearches.id),
      avgResults: sql<number>`ROUND(AVG(${locationSearches.resultsFound}), 1)`,
      avgRadius: sql<number>`ROUND(AVG(${locationSearches.radiusMiles}))`,
    })
    .from(locationSearches)
    .where(and(...conditions))
    .groupBy(locationSearches.searchCity, locationSearches.searchState)
    .having(sql`AVG(${locationSearches.resultsFound}) < 5 AND COUNT(*) >= 10`)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(20);

  return results;
}

/**
 * Get daily visitor trends
 */
export async function getDailyVisitorTrends(dateRange: DateRange) {
  const results = await db
    .select({
      date: sql<string>`DATE(${pageViews.createdAt})`,
      totalVisitors: count(pageViews.id),
      uniqueSessions: sql<number>`COUNT(DISTINCT ${pageViews.sessionId})`,
      newSessions: sql<number>`SUM(CASE WHEN ${pageViews.isNewSession} THEN 1 ELSE 0 END)`,
    })
    .from(pageViews)
    .where(
      and(
        gte(pageViews.createdAt, new Date(dateRange.startDate)),
        lte(pageViews.createdAt, new Date(dateRange.endDate))
      )
    )
    .groupBy(sql`DATE(${pageViews.createdAt})`)
    .orderBy(sql`DATE(${pageViews.createdAt})`);

  return results;
}

/**
 * Get daily search trends
 */
export async function getDailySearchTrends(dateRange: DateRange) {
  const results = await db
    .select({
      date: sql<string>`DATE(${locationSearches.createdAt})`,
      totalSearches: count(locationSearches.id),
      avgResultsFound: sql<number>`ROUND(AVG(${locationSearches.resultsFound}), 1)`,
      avgRadius: sql<number>`ROUND(AVG(${locationSearches.radiusMiles}))`,
    })
    .from(locationSearches)
    .where(
      and(
        gte(locationSearches.createdAt, new Date(dateRange.startDate)),
        lte(locationSearches.createdAt, new Date(dateRange.endDate))
      )
    )
    .groupBy(sql`DATE(${locationSearches.createdAt})`)
    .orderBy(sql`DATE(${locationSearches.createdAt})`);

  return results;
}

/**
 * Get device and browser statistics
 */
export async function getDeviceStats(dateRange?: DateRange) {
  const conditions = [];
  if (dateRange) {
    conditions.push(gte(pageViews.createdAt, new Date(dateRange.startDate)));
    conditions.push(lte(pageViews.createdAt, new Date(dateRange.endDate)));
  }

  const deviceStats = await db
    .select({
      deviceType: pageViews.deviceType,
      visitors: count(pageViews.id),
    })
    .from(pageViews)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(pageViews.deviceType);

  const browserStats = await db
    .select({
      browserFamily: pageViews.browserFamily,
      visitors: count(pageViews.id),
    })
    .from(pageViews)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(pageViews.browserFamily)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

  return { deviceStats, browserStats };
}

/**
 * Get traffic sources
 */
export async function getTrafficSources(dateRange?: DateRange) {
  const conditions = [sql`${pageViews.isNewSession} = true`];
  if (dateRange) {
    conditions.push(gte(pageViews.createdAt, new Date(dateRange.startDate)));
    conditions.push(lte(pageViews.createdAt, new Date(dateRange.endDate)));
  }

  const results = await db
    .select({
      referrerDomain: pageViews.referrerDomain,
      newSessions: count(pageViews.id),
    })
    .from(pageViews)
    .where(and(...conditions))
    .groupBy(pageViews.referrerDomain)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(20);

  return results;
}

/**
 * Get filter usage statistics
 */
export async function getFilterUsageStats(dateRange?: DateRange) {
  const conditions = [];
  if (dateRange) {
    conditions.push(gte(locationSearches.createdAt, new Date(dateRange.startDate)));
    conditions.push(lte(locationSearches.createdAt, new Date(dateRange.endDate)));
  }

  const results = await db
    .select({
      totalSearches: count(locationSearches.id),
      withSpecialtyFilter: sql<number>`SUM(CASE WHEN ${locationSearches.hadSpecialtyFilter} THEN 1 ELSE 0 END)`,
      withInsuranceFilter: sql<number>`SUM(CASE WHEN ${locationSearches.hadInsuranceFilter} THEN 1 ELSE 0 END)`,
      withModalityFilter: sql<number>`SUM(CASE WHEN ${locationSearches.hadModalityFilter} THEN 1 ELSE 0 END)`,
      withGenderFilter: sql<number>`SUM(CASE WHEN ${locationSearches.hadGenderFilter} THEN 1 ELSE 0 END)`,
    })
    .from(locationSearches)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return results[0] || null;
}

/**
 * Get summary statistics
 */
export async function getSummaryStats(dateRange?: DateRange) {
  const pvConditions = [];
  const lsConditions = [];

  if (dateRange) {
    pvConditions.push(gte(pageViews.createdAt, new Date(dateRange.startDate)));
    pvConditions.push(lte(pageViews.createdAt, new Date(dateRange.endDate)));
    lsConditions.push(gte(locationSearches.createdAt, new Date(dateRange.startDate)));
    lsConditions.push(lte(locationSearches.createdAt, new Date(dateRange.endDate)));
  }

  // Get page view stats
  const pageViewStats = await db
    .select({
      totalPageViews: count(pageViews.id),
      uniqueSessions: sql<number>`COUNT(DISTINCT ${pageViews.sessionId})`,
      uniqueCities: sql<number>`COUNT(DISTINCT ${pageViews.city})`,
      uniqueStates: sql<number>`COUNT(DISTINCT ${pageViews.state})`,
    })
    .from(pageViews)
    .where(pvConditions.length > 0 ? and(...pvConditions) : undefined);

  // Get search stats
  const searchStats = await db
    .select({
      totalSearches: count(locationSearches.id),
      avgResultsFound: sql<number>`ROUND(AVG(${locationSearches.resultsFound}), 1)`,
      avgRadius: sql<number>`ROUND(AVG(${locationSearches.radiusMiles}))`,
    })
    .from(locationSearches)
    .where(lsConditions.length > 0 ? and(...lsConditions) : undefined);

  return {
    ...pageViewStats[0],
    ...searchStats[0],
  };
}
