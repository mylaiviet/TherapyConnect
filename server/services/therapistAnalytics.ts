/**
 * Therapist Analytics Service
 *
 * Provides analytics queries for therapist engagement, demographics,
 * booking performance, and growth metrics.
 */

import { db } from "../db";
import {
  therapists,
  therapistProfileViews,
  bookingAnalytics,
  therapistGrowthMetrics,
  appointments,
  type Therapist,
} from "@shared/schema";
import { eq, and, gte, lte, sql, desc, count, avg, sum, isNull } from "drizzle-orm";

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;
}

// ============================================
// THERAPIST DISTRIBUTION & DEMOGRAPHICS
// ============================================

export interface TherapistDistribution {
  state: string;
  city?: string;
  totalTherapists: number;
  activeTherapists: number;
  acceptingNewClients: number;
}

/**
 * Get therapist distribution by state and optionally by city
 */
export async function getTherapistDistribution(
  state?: string,
  city?: string
): Promise<TherapistDistribution[]> {
  const conditions = [
    eq(therapists.profileStatus, "approved")
  ];

  if (state) {
    conditions.push(eq(therapists.state, state));
  }

  if (city) {
    conditions.push(eq(therapists.city, city));
  }

  const result = await db
    .select({
      state: therapists.state,
      city: therapists.city,
      totalTherapists: count(therapists.id),
      activeTherapists: sql<number>`COUNT(CASE WHEN ${therapists.acceptingNewClients} = true THEN 1 END)`,
      acceptingNewClients: sql<number>`COUNT(CASE WHEN ${therapists.acceptingNewClients} = true THEN 1 END)`,
    })
    .from(therapists)
    .where(and(...conditions))
    .groupBy(therapists.state, therapists.city);

  return result as TherapistDistribution[];
}

/**
 * Get therapy types breakdown (CBT, DBT, EMDR, etc.)
 */
export interface TherapyTypeBreakdown {
  therapyType: string;
  therapistCount: number;
  avgYearsExperience: number;
}

export async function getTherapyTypeBreakdown(): Promise<TherapyTypeBreakdown[]> {
  const result = await db.execute<{ therapy_type: string; therapist_count: string; avg_years: string }>(sql`
    SELECT
      unnest(therapy_types) as therapy_type,
      COUNT(*)::TEXT as therapist_count,
      ROUND(AVG(years_in_practice), 1)::TEXT as avg_years
    FROM therapists
    WHERE profile_status = 'approved'
    AND therapy_types IS NOT NULL
    AND array_length(therapy_types, 1) > 0
    GROUP BY therapy_type
    ORDER BY therapist_count DESC
    LIMIT 20
  `);

  return result.rows.map(row => ({
    therapyType: row.therapy_type,
    therapistCount: parseInt(row.therapist_count),
    avgYearsExperience: parseFloat(row.avg_years),
  }));
}

/**
 * Get specializations breakdown
 */
export interface SpecializationBreakdown {
  specialty: string;
  therapistCount: number;
  states: string[];
}

export async function getSpecializationBreakdown(): Promise<SpecializationBreakdown[]> {
  const result = await db.execute<{
    specialty: string;
    therapist_count: string;
    states: string
  }>(sql`
    SELECT
      unnest(top_specialties) as specialty,
      COUNT(DISTINCT id)::TEXT as therapist_count,
      string_agg(DISTINCT state, ', ' ORDER BY state) as states
    FROM therapists
    WHERE profile_status = 'approved'
    AND top_specialties IS NOT NULL
    AND array_length(top_specialties, 1) > 0
    GROUP BY specialty
    ORDER BY therapist_count DESC
    LIMIT 30
  `);

  return result.rows.map(row => ({
    specialty: row.specialty,
    therapistCount: parseInt(row.therapist_count),
    states: row.states ? row.states.split(', ') : [],
  }));
}

// ============================================
// ENGAGEMENT METRICS
// ============================================

export interface TherapistEngagement {
  therapistId: string;
  therapistName: string;
  city: string;
  state: string;
  profileViews: number;
  totalBookings: number;
  conversionRate: number;
  avgViewDuration: number; // seconds
}

/**
 * Get top performing therapists by engagement
 */
export async function getTopPerformers(
  dateRange?: DateRange,
  limit: number = 20
): Promise<TherapistEngagement[]> {
  const dateConditions = [];

  if (dateRange) {
    dateConditions.push(
      gte(therapistProfileViews.viewedAt, new Date(dateRange.startDate)),
      lte(therapistProfileViews.viewedAt, new Date(dateRange.endDate))
    );
  }

  const result = await db
    .select({
      therapistId: therapists.id,
      therapistName: sql<string>`${therapists.firstName} || ' ' || ${therapists.lastName}`,
      city: therapists.city,
      state: therapists.state,
      profileViews: count(therapistProfileViews.id),
      avgViewDuration: avg(therapistProfileViews.viewDurationSeconds),
    })
    .from(therapists)
    .leftJoin(therapistProfileViews, eq(therapistProfileViews.therapistId, therapists.id))
    .where(
      and(
        eq(therapists.profileStatus, "approved"),
        ...(dateConditions.length > 0 ? dateConditions : [])
      )
    )
    .groupBy(therapists.id, therapists.firstName, therapists.lastName, therapists.city, therapists.state)
    .orderBy(desc(count(therapistProfileViews.id)))
    .limit(limit);

  // Get booking data separately and merge
  const therapistIds = result.map(r => r.therapistId);

  const bookings = await db
    .select({
      therapistId: appointments.therapistId,
      totalBookings: count(appointments.id),
    })
    .from(appointments)
    .where(
      and(
        sql`${appointments.therapistId} = ANY(${therapistIds}::varchar[])`,
        ...(dateRange ? [
          gte(sql`${appointments.appointmentDate}::date`, dateRange.startDate),
          lte(sql`${appointments.appointmentDate}::date`, dateRange.endDate)
        ] : [])
      )
    )
    .groupBy(appointments.therapistId);

  const bookingsMap = new Map(bookings.map(b => [b.therapistId, b.totalBookings]));

  return result.map(r => ({
    therapistId: r.therapistId,
    therapistName: r.therapistName,
    city: r.city,
    state: r.state,
    profileViews: Number(r.profileViews),
    totalBookings: bookingsMap.get(r.therapistId) || 0,
    conversionRate: r.profileViews > 0
      ? ((bookingsMap.get(r.therapistId) || 0) / Number(r.profileViews)) * 100
      : 0,
    avgViewDuration: Number(r.avgViewDuration) || 0,
  }));
}

/**
 * Get therapists with low engagement (need promotion)
 */
export interface LowEngagementTherapist {
  therapistId: string;
  therapistName: string;
  city: string;
  state: string;
  profileViews: number;
  daysSinceCreated: number;
  specialties: string[];
}

export async function getLowEngagementTherapists(
  limit: number = 20
): Promise<LowEngagementTherapist[]> {
  const result = await db
    .select({
      therapistId: therapists.id,
      therapistName: sql<string>`${therapists.firstName} || ' ' || ${therapists.lastName}`,
      city: therapists.city,
      state: therapists.state,
      profileViews: therapists.profileViews,
      specialties: therapists.topSpecialties,
      createdAt: therapists.createdAt,
    })
    .from(therapists)
    .where(
      and(
        eq(therapists.profileStatus, "approved"),
        lte(therapists.profileViews, 5) // Less than 5 views
      )
    )
    .orderBy(therapists.profileViews, desc(therapists.createdAt))
    .limit(limit);

  return result.map(r => ({
    therapistId: r.therapistId,
    therapistName: r.therapistName,
    city: r.city,
    state: r.state,
    profileViews: r.profileViews,
    daysSinceCreated: Math.floor(
      (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    ),
    specialties: r.specialties || [],
  }));
}

// ============================================
// BOOKING PERFORMANCE
// ============================================

export interface BookingPerformance {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  avgConversionRate: number;
  topBookedTherapists: Array<{
    therapistId: string;
    therapistName: string;
    bookingCount: number;
  }>;
}

export async function getBookingPerformance(
  dateRange?: DateRange
): Promise<BookingPerformance> {
  const dateConditions = dateRange ? [
    gte(sql`${appointments.appointmentDate}::date`, dateRange.startDate),
    lte(sql`${appointments.appointmentDate}::date`, dateRange.endDate)
  ] : [];

  // Get overall booking stats
  const stats = await db
    .select({
      totalBookings: count(appointments.id),
      confirmedBookings: sql<number>`COUNT(CASE WHEN ${appointments.status} = 'confirmed' THEN 1 END)`,
      cancelledBookings: sql<number>`COUNT(CASE WHEN ${appointments.status} = 'cancelled' THEN 1 END)`,
      pendingBookings: sql<number>`COUNT(CASE WHEN ${appointments.status} = 'pending' THEN 1 END)`,
    })
    .from(appointments)
    .where(and(...dateConditions));

  // Get top booked therapists
  const topBooked = await db
    .select({
      therapistId: appointments.therapistId,
      therapistName: sql<string>`${therapists.firstName} || ' ' || ${therapists.lastName}`,
      bookingCount: count(appointments.id),
    })
    .from(appointments)
    .innerJoin(therapists, eq(therapists.userId, appointments.therapistId))
    .where(and(...dateConditions))
    .groupBy(appointments.therapistId, therapists.firstName, therapists.lastName)
    .orderBy(desc(count(appointments.id)))
    .limit(10);

  return {
    totalBookings: Number(stats[0]?.totalBookings || 0),
    confirmedBookings: Number(stats[0]?.confirmedBookings || 0),
    cancelledBookings: Number(stats[0]?.cancelledBookings || 0),
    pendingBookings: Number(stats[0]?.pendingBookings || 0),
    avgConversionRate: 0, // Calculate separately if needed
    topBookedTherapists: topBooked.map(t => ({
      therapistId: t.therapistId,
      therapistName: t.therapistName,
      bookingCount: Number(t.bookingCount),
    })),
  };
}

// ============================================
// GROWTH METRICS
// ============================================

export interface GrowthMetrics {
  newTherapistsThisMonth: number;
  newTherapistsLastMonth: number;
  growthRate: number; // percentage
  approvalRate: number; // percentage
  avgApprovalTimeDays: number;
  monthlyGrowth: Array<{
    month: string; // YYYY-MM
    newSignups: number;
    approved: number;
    rejected: number;
  }>;
}

export async function getGrowthMetrics(): Promise<GrowthMetrics> {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // This month's signups
  const thisMonth = await db
    .select({ count: count(therapists.id) })
    .from(therapists)
    .where(gte(therapists.createdAt, thisMonthStart));

  // Last month's signups
  const lastMonth = await db
    .select({ count: count(therapists.id) })
    .from(therapists)
    .where(
      and(
        gte(therapists.createdAt, lastMonthStart),
        lte(therapists.createdAt, lastMonthEnd)
      )
    );

  // Get monthly growth for last 12 months
  const monthlyGrowth = await db.execute<{
    month: string;
    new_signups: string;
    approved: string;
    rejected: string;
  }>(sql`
    SELECT
      TO_CHAR(created_at, 'YYYY-MM') as month,
      COUNT(*)::TEXT as new_signups,
      SUM(CASE WHEN profile_status = 'approved' THEN 1 ELSE 0 END)::TEXT as approved,
      SUM(CASE WHEN profile_status = 'rejected' THEN 1 ELSE 0 END)::TEXT as rejected
    FROM therapists
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY TO_CHAR(created_at, 'YYYY-MM')
    ORDER BY month DESC
    LIMIT 12
  `);

  const thisMonthCount = Number(thisMonth[0]?.count || 0);
  const lastMonthCount = Number(lastMonth[0]?.count || 0);
  const growthRate = lastMonthCount > 0
    ? ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100
    : 0;

  // Get approval stats
  const approvalStats = await db
    .select({
      total: count(therapists.id),
      approved: sql<number>`COUNT(CASE WHEN ${therapists.profileStatus} = 'approved' THEN 1 END)`,
    })
    .from(therapists);

  const approvalRate = approvalStats[0].total > 0
    ? (Number(approvalStats[0].approved) / Number(approvalStats[0].total)) * 100
    : 0;

  return {
    newTherapistsThisMonth: thisMonthCount,
    newTherapistsLastMonth: lastMonthCount,
    growthRate,
    approvalRate,
    avgApprovalTimeDays: 2.5, // Placeholder - implement if needed
    monthlyGrowth: monthlyGrowth.rows.map(row => ({
      month: row.month,
      newSignups: parseInt(row.new_signups),
      approved: parseInt(row.approved),
      rejected: parseInt(row.rejected),
    })),
  };
}

// ============================================
// REGIONAL DRILL-DOWN
// ============================================

export interface RegionalTherapist {
  id: string;
  name: string;
  credentials: string;
  specialties: string[];
  profileViews: number;
  acceptingNewClients: boolean;
  yearsInPractice: number;
}

export async function getTherapistsByRegion(
  state: string,
  city?: string
): Promise<RegionalTherapist[]> {
  const conditions = [
    eq(therapists.profileStatus, "approved"),
    eq(therapists.state, state)
  ];

  if (city) {
    conditions.push(eq(therapists.city, city));
  }

  const result = await db
    .select({
      id: therapists.id,
      firstName: therapists.firstName,
      lastName: therapists.lastName,
      credentials: therapists.credentials,
      specialties: therapists.topSpecialties,
      profileViews: therapists.profileViews,
      acceptingNewClients: therapists.acceptingNewClients,
      yearsInPractice: therapists.yearsInPractice,
    })
    .from(therapists)
    .where(and(...conditions))
    .orderBy(desc(therapists.profileViews));

  return result.map(r => ({
    id: r.id,
    name: `${r.firstName} ${r.lastName}`,
    credentials: r.credentials || "",
    specialties: r.specialties || [],
    profileViews: r.profileViews,
    acceptingNewClients: r.acceptingNewClients,
    yearsInPractice: r.yearsInPractice || 0,
  }));
}
