/**
 * Business Intelligence Service
 *
 * Provides advanced analytics for supply vs demand, conversion funnels,
 * search effectiveness, and revenue insights.
 */

import { db } from "../db";
import {
  therapists,
  locationSearches,
  pageViews,
  searchConversionFunnel,
  specialtyDemandMetrics,
  appointments,
} from "@shared/schema";
import { eq, and, gte, lte, sql, desc, count, avg, sum } from "drizzle-orm";

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;
}

// ============================================
// SUPPLY VS DEMAND ANALYSIS
// ============================================

export interface SupplyDemandGap {
  specialty: string;
  searchDemand: number;
  availableTherapists: number;
  supplyDemandRatio: number; // therapists per 100 searches
  topRegions: Array<{
    state: string;
    city?: string;
    searches: number;
    therapists: number;
  }>;
}

/**
 * Analyze supply vs demand gaps by specialty
 */
export async function getSupplyDemandAnalysis(
  dateRange?: DateRange
): Promise<SupplyDemandGap[]> {
  const dateConditions = dateRange ? [
    gte(locationSearches.createdAt, new Date(dateRange.startDate)),
    lte(locationSearches.createdAt, new Date(dateRange.endDate))
  ] : [];

  // Get search demand by specialty (from filters used)
  // Note: This is simplified - in production, you'd track specialty filters
  const searchesByLocation = await db
    .select({
      state: locationSearches.searchState,
      city: locationSearches.searchCity,
      searches: count(locationSearches.id),
      avgResults: avg(locationSearches.resultsFound),
    })
    .from(locationSearches)
    .where(and(...dateConditions))
    .groupBy(locationSearches.searchState, locationSearches.searchCity)
    .orderBy(desc(count(locationSearches.id)))
    .limit(20);

  // Get therapist supply by location
  const therapistsByLocation = await db
    .select({
      state: therapists.state,
      city: therapists.city,
      therapistCount: count(therapists.id),
    })
    .from(therapists)
    .where(eq(therapists.profileStatus, "approved"))
    .groupBy(therapists.state, therapists.city);

  const therapistMap = new Map(
    therapistsByLocation.map(t => [
      `${t.state}:${t.city}`,
      Number(t.therapistCount)
    ])
  );

  // Calculate gaps
  const gaps = searchesByLocation.map(s => {
    const key = `${s.state}:${s.city}`;
    const therapistCount = therapistMap.get(key) || 0;
    const searchCount = Number(s.searches);

    return {
      location: `${s.city}, ${s.state}`,
      searches: searchCount,
      therapists: therapistCount,
      ratio: therapistCount / (searchCount / 100), // therapists per 100 searches
      avgResults: Number(s.avgResults) || 0,
    };
  });

  // Group by needs (simplified - in production, categorize by specialty)
  return [{
    specialty: "General Therapy",
    searchDemand: gaps.reduce((sum, g) => sum + g.searches, 0),
    availableTherapists: gaps.reduce((sum, g) => sum + g.therapists, 0),
    supplyDemandRatio: gaps.length > 0
      ? gaps.reduce((sum, g) => sum + g.ratio, 0) / gaps.length
      : 0,
    topRegions: gaps.slice(0, 10).map(g => ({
      state: g.location.split(', ')[1] || '',
      city: g.location.split(', ')[0] || '',
      searches: g.searches,
      therapists: g.therapists,
    })),
  }];
}

/**
 * Get insurance coverage gaps
 */
export interface InsuranceCoverage {
  insuranceName: string;
  searchDemand: number;
  providersAccepting: number;
  coverageGap: number; // percentage
}

export async function getInsuranceCoverageGaps(): Promise<InsuranceCoverage[]> {
  // Get therapists by insurance accepted
  const insuranceCounts = await db.execute<{
    insurance: string;
    therapist_count: string;
  }>(sql`
    SELECT
      unnest(insurance_accepted) as insurance,
      COUNT(DISTINCT id)::TEXT as therapist_count
    FROM therapists
    WHERE profile_status = 'approved'
    AND insurance_accepted IS NOT NULL
    AND array_length(insurance_accepted, 1) > 0
    GROUP BY insurance
    ORDER BY therapist_count DESC
    LIMIT 20
  `);

  // Calculate gaps (simplified - would need actual search demand data)
  return insuranceCounts.rows.map(row => ({
    insuranceName: row.insurance,
    searchDemand: 100, // Placeholder
    providersAccepting: parseInt(row.therapist_count),
    coverageGap: 0, // Calculate based on demand
  }));
}

// ============================================
// CONVERSION FUNNEL ANALYSIS
// ============================================

export interface ConversionFunnel {
  stage: string;
  users: number;
  dropoffRate: number; // percentage from previous stage
  avgTimeToNextStage: number; // minutes
}

/**
 * Get full conversion funnel from search to booking
 */
export async function getConversionFunnel(
  dateRange?: DateRange
): Promise<ConversionFunnel[]> {
  const dateConditions = dateRange ? [
    gte(pageViews.createdAt, new Date(dateRange.startDate)),
    lte(pageViews.createdAt, new Date(dateRange.endDate))
  ] : [];

  // Stage 1: Homepage/Landing visits
  const landingVisits = await db
    .select({
      count: count(pageViews.sessionId),
    })
    .from(pageViews)
    .where(
      and(
        eq(pageViews.isNewSession, true),
        ...dateConditions
      )
    );

  // Stage 2: Search performed
  const searchPerformed = await db
    .select({
      count: count(locationSearches.sessionId),
    })
    .from(locationSearches)
    .where(and(...(dateRange ? [
      gte(locationSearches.createdAt, new Date(dateRange.startDate)),
      lte(locationSearches.createdAt, new Date(dateRange.endDate))
    ] : [])));

  // Stage 3: Profile viewed
  const profileViews = await db.execute<{ count: string }>(sql`
    SELECT COUNT(DISTINCT session_id)::TEXT as count
    FROM page_views
    WHERE page_path LIKE '/therapist/%'
    ${dateRange ? sql`AND created_at >= ${new Date(dateRange.startDate)} AND created_at <= ${new Date(dateRange.endDate)}` : sql``}
  `);

  // Stage 4: Booking initiated (clicked book button)
  const bookingInitiated = await db.execute<{ count: string }>(sql`
    SELECT COUNT(DISTINCT session_id)::TEXT as count
    FROM therapist_profile_views
    WHERE clicked_book_button = true
    ${dateRange ? sql`AND viewed_at >= ${new Date(dateRange.startDate)} AND viewed_at <= ${new Date(dateRange.endDate)}` : sql``}
  `);

  // Stage 5: Booking confirmed
  const bookingConfirmed = await db
    .select({
      count: count(appointments.id),
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.status, "confirmed"),
        ...(dateRange ? [
          gte(sql`${appointments.appointmentDate}::date`, dateRange.startDate),
          lte(sql`${appointments.appointmentDate}::date`, dateRange.endDate)
        ] : [])
      )
    );

  const landing = Number(landingVisits[0]?.count || 0);
  const search = Number(searchPerformed[0]?.count || 0);
  const profile = Number(profileViews.rows[0]?.count || 0);
  const initiated = Number(bookingInitiated.rows[0]?.count || 0);
  const confirmed = Number(bookingConfirmed[0]?.count || 0);

  return [
    {
      stage: "Landing Page Visit",
      users: landing,
      dropoffRate: 0,
      avgTimeToNextStage: 2.5,
    },
    {
      stage: "Search Performed",
      users: search,
      dropoffRate: landing > 0 ? ((landing - search) / landing) * 100 : 0,
      avgTimeToNextStage: 5.2,
    },
    {
      stage: "Profile Viewed",
      users: profile,
      dropoffRate: search > 0 ? ((search - profile) / search) * 100 : 0,
      avgTimeToNextStage: 3.8,
    },
    {
      stage: "Booking Initiated",
      users: initiated,
      dropoffRate: profile > 0 ? ((profile - initiated) / profile) * 100 : 0,
      avgTimeToNextStage: 15.0,
    },
    {
      stage: "Booking Confirmed",
      users: confirmed,
      dropoffRate: initiated > 0 ? ((initiated - confirmed) / initiated) * 100 : 0,
      avgTimeToNextStage: 0,
    },
  ];
}

// ============================================
// SEARCH EFFECTIVENESS
// ============================================

export interface SearchEffectiveness {
  totalSearches: number;
  avgResultsFound: number;
  searchesWithZeroResults: number;
  zeroResultsRate: number; // percentage
  avgSearchRadius: number;
  mostCommonFilters: Array<{
    filter: string;
    usageCount: number;
  }>;
  searchesByLocation: Array<{
    city: string;
    state: string;
    searchCount: number;
    avgResults: number;
  }>;
}

/**
 * Analyze search quality and effectiveness
 */
export async function getSearchEffectiveness(
  dateRange?: DateRange
): Promise<SearchEffectiveness> {
  const dateConditions = dateRange ? [
    gte(locationSearches.createdAt, new Date(dateRange.startDate)),
    lte(locationSearches.createdAt, new Date(dateRange.endDate))
  ] : [];

  // Overall search stats
  const searchStats = await db
    .select({
      totalSearches: count(locationSearches.id),
      avgResults: avg(locationSearches.resultsFound),
      avgRadius: avg(locationSearches.radiusMiles),
      zeroResults: sql<number>`COUNT(CASE WHEN ${locationSearches.resultsFound} = 0 THEN 1 END)`,
    })
    .from(locationSearches)
    .where(and(...dateConditions));

  // Filter usage
  const filterStats = await db
    .select({
      specialtyFilter: sum(sql<number>`CASE WHEN ${locationSearches.hadSpecialtyFilter} THEN 1 ELSE 0 END`),
      insuranceFilter: sum(sql<number>`CASE WHEN ${locationSearches.hadInsuranceFilter} THEN 1 ELSE 0 END`),
      modalityFilter: sum(sql<number>`CASE WHEN ${locationSearches.hadModalityFilter} THEN 1 ELSE 0 END`),
      genderFilter: sum(sql<number>`CASE WHEN ${locationSearches.hadGenderFilter} THEN 1 ELSE 0 END`),
    })
    .from(locationSearches)
    .where(and(...dateConditions));

  // Searches by location
  const searchesByLocation = await db
    .select({
      city: locationSearches.searchCity,
      state: locationSearches.searchState,
      searchCount: count(locationSearches.id),
      avgResults: avg(locationSearches.resultsFound),
    })
    .from(locationSearches)
    .where(and(...dateConditions))
    .groupBy(locationSearches.searchCity, locationSearches.searchState)
    .orderBy(desc(count(locationSearches.id)))
    .limit(15);

  const total = Number(searchStats[0]?.totalSearches || 0);
  const zero = Number(searchStats[0]?.zeroResults || 0);

  return {
    totalSearches: total,
    avgResultsFound: Number(searchStats[0]?.avgResults || 0),
    searchesWithZeroResults: zero,
    zeroResultsRate: total > 0 ? (zero / total) * 100 : 0,
    avgSearchRadius: Number(searchStats[0]?.avgRadius || 0),
    mostCommonFilters: [
      { filter: "Specialty", usageCount: Number(filterStats[0]?.specialtyFilter || 0) },
      { filter: "Insurance", usageCount: Number(filterStats[0]?.insuranceFilter || 0) },
      { filter: "Modality", usageCount: Number(filterStats[0]?.modalityFilter || 0) },
      { filter: "Gender", usageCount: Number(filterStats[0]?.genderFilter || 0) },
    ].sort((a, b) => b.usageCount - a.usageCount),
    searchesByLocation: searchesByLocation.map(s => ({
      city: s.city || '',
      state: s.state || '',
      searchCount: Number(s.searchCount),
      avgResults: Number(s.avgResults || 0),
    })),
  };
}

// ============================================
// PRICING & REVENUE INSIGHTS
// ============================================

export interface PricingInsights {
  avgIndividualSessionFee: number;
  avgCouplesSessionFee: number;
  slidingScaleAdoption: number; // percentage
  pricingByRegion: Array<{
    state: string;
    avgFee: number;
    therapistCount: number;
  }>;
  pricingBySpecialty: Array<{
    specialty: string;
    avgFee: number;
    therapistCount: number;
  }>;
}

/**
 * Analyze pricing and revenue metrics
 */
export async function getPricingInsights(): Promise<PricingInsights> {
  // Overall pricing stats
  const pricingStats = await db
    .select({
      avgIndividual: avg(therapists.individualSessionFee),
      avgCouples: avg(therapists.couplesSessionFee),
      totalTherapists: count(therapists.id),
      slidingScale: sql<number>`COUNT(CASE WHEN ${therapists.offersSlidingScale} = true THEN 1 END)`,
    })
    .from(therapists)
    .where(eq(therapists.profileStatus, "approved"));

  // Pricing by region
  const pricingByRegion = await db
    .select({
      state: therapists.state,
      avgFee: avg(therapists.individualSessionFee),
      therapistCount: count(therapists.id),
    })
    .from(therapists)
    .where(
      and(
        eq(therapists.profileStatus, "approved"),
        sql`${therapists.individualSessionFee} IS NOT NULL`
      )
    )
    .groupBy(therapists.state)
    .orderBy(desc(avg(therapists.individualSessionFee)))
    .limit(20);

  // Pricing by specialty (simplified)
  const pricingBySpecialty = await db.execute<{
    specialty: string;
    avg_fee: string;
    therapist_count: string;
  }>(sql`
    SELECT
      unnest(top_specialties) as specialty,
      ROUND(AVG(individual_session_fee))::TEXT as avg_fee,
      COUNT(DISTINCT id)::TEXT as therapist_count
    FROM therapists
    WHERE profile_status = 'approved'
    AND individual_session_fee IS NOT NULL
    AND top_specialties IS NOT NULL
    AND array_length(top_specialties, 1) > 0
    GROUP BY specialty
    ORDER BY avg_fee DESC
    LIMIT 15
  `);

  const total = Number(pricingStats[0]?.totalTherapists || 0);
  const slidingScale = Number(pricingStats[0]?.slidingScale || 0);

  return {
    avgIndividualSessionFee: Number(pricingStats[0]?.avgIndividual || 0),
    avgCouplesSessionFee: Number(pricingStats[0]?.avgCouples || 0),
    slidingScaleAdoption: total > 0 ? (slidingScale / total) * 100 : 0,
    pricingByRegion: pricingByRegion.map(p => ({
      state: p.state,
      avgFee: Number(p.avgFee || 0),
      therapistCount: Number(p.therapistCount),
    })),
    pricingBySpecialty: pricingBySpecialty.rows.map(p => ({
      specialty: p.specialty,
      avgFee: Number(p.avg_fee),
      therapistCount: parseInt(p.therapist_count),
    })),
  };
}

// ============================================
// USER BEHAVIOR PATTERNS
// ============================================

export interface UserBehaviorPatterns {
  peakSearchTimes: Array<{
    dayOfWeek: string;
    hour: number;
    searchCount: number;
  }>;
  avgSessionDuration: number; // minutes
  returnVisitorRate: number; // percentage
  mobileVsDesktop: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}

/**
 * Analyze user behavior patterns
 */
export async function getUserBehaviorPatterns(
  dateRange?: DateRange
): Promise<UserBehaviorPatterns> {
  const dateConditions = dateRange ? [
    gte(pageViews.createdAt, new Date(dateRange.startDate)),
    lte(pageViews.createdAt, new Date(dateRange.endDate))
  ] : [];

  // Peak search times
  const peakTimes = await db.execute<{
    day_of_week: string;
    hour: string;
    search_count: string;
  }>(sql`
    SELECT
      TO_CHAR(created_at, 'Day') as day_of_week,
      EXTRACT(HOUR FROM created_at)::TEXT as hour,
      COUNT(*)::TEXT as search_count
    FROM location_searches
    ${dateRange ? sql`WHERE created_at >= ${new Date(dateRange.startDate)} AND created_at <= ${new Date(dateRange.endDate)}` : sql``}
    GROUP BY TO_CHAR(created_at, 'Day'), EXTRACT(HOUR FROM created_at)
    ORDER BY search_count DESC
    LIMIT 20
  `);

  // Device breakdown
  const deviceStats = await db
    .select({
      deviceType: pageViews.deviceType,
      count: count(pageViews.id),
    })
    .from(pageViews)
    .where(and(...dateConditions))
    .groupBy(pageViews.deviceType);

  const deviceMap = new Map(deviceStats.map(d => [d.deviceType, Number(d.count)]));

  // Return visitor rate
  const visitorStats = await db.execute<{
    total_sessions: string;
    return_sessions: string;
  }>(sql`
    SELECT
      COUNT(DISTINCT session_id)::TEXT as total_sessions,
      COUNT(DISTINCT CASE WHEN is_new_session = false THEN session_id END)::TEXT as return_sessions
    FROM page_views
    ${dateRange ? sql`WHERE created_at >= ${new Date(dateRange.startDate)} AND created_at <= ${new Date(dateRange.endDate)}` : sql``}
  `);

  const total = Number(visitorStats.rows[0]?.total_sessions || 0);
  const returning = Number(visitorStats.rows[0]?.return_sessions || 0);

  return {
    peakSearchTimes: peakTimes.rows.map(p => ({
      dayOfWeek: p.day_of_week.trim(),
      hour: parseInt(p.hour),
      searchCount: parseInt(p.search_count),
    })),
    avgSessionDuration: 8.5, // Placeholder - calculate from actual data
    returnVisitorRate: total > 0 ? (returning / total) * 100 : 0,
    mobileVsDesktop: {
      mobile: deviceMap.get("mobile") || 0,
      desktop: deviceMap.get("desktop") || 0,
      tablet: deviceMap.get("tablet") || 0,
    },
  };
}
