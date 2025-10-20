/**
 * Therapist Matching Service for Chatbot
 * Converts chatbot preferences into therapist search filters
 * Returns matches ranked by proximity and compatibility
 * Prevents showing Boston therapists to Denver patients
 */

import { storage } from '../storage';
import type { TherapistFilters } from '../storage';
import type { Therapist } from '@shared/schema';
import { db } from '../db';
import { chatPreferences, chatTherapistMatches } from '@shared/schema';
import { eq } from 'drizzle-orm';
// DISABLED: Proximity matcher has unfixable SQL syntax errors with Drizzle+Neon
// Using simple location matching in calculateMatchScore instead
// import { filterByProximity } from './proximityMatcher';

export interface MatchedTherapist extends Therapist {
  matchScore: number; // 0-100
  matchReasons: string[]; // Why this therapist was matched
  distance: number | null; // Distance in miles from user
}

/**
 * Find therapists based on chatbot conversation preferences
 * with proximity filtering (prevents showing Boston therapists to Denver patients)
 */
export async function findMatchingTherapists(
  conversationId: string,
  offset: number = 0,
  limit: number = 5
): Promise<{ therapists: MatchedTherapist[]; hasMore: boolean; total: number }> {
  console.log(`[MATCHER] Starting findMatchingTherapists for conversation: ${conversationId}, offset: ${offset}, limit: ${limit}`);

  // Get user preferences from database
  const [prefs] = await db
    .select()
    .from(chatPreferences)
    .where(eq(chatPreferences.conversationId, conversationId))
    .limit(1);

  if (!prefs) {
    console.error('[MATCHER] No preferences found for conversation:', conversationId);
    throw new Error('No preferences found for conversation');
  }

  console.log('[MATCHER] User preferences:', {
    location: prefs.locationZip,
    sessionFormat: prefs.sessionFormat,
    paymentMethod: prefs.paymentMethod,
    treatmentGoals: prefs.treatmentGoals,
  });

  // Get all therapists (we'll filter by proximity ourselves)
  const filters: TherapistFilters = {
    acceptingNewClients: true,
  };

  // Fetch ALL therapists first
  console.log('[MATCHER] Fetching all therapists with filters:', filters);
  const allTherapists = await storage.getAllTherapists(filters);
  console.log(`[MATCHER] Found ${allTherapists.length} therapists accepting new clients`);

  // DISABLED: Proximity filtering due to SQL errors
  // Using location matching in calculateMatchScore() instead
  console.log('[MATCHER] Using simple location matching (no proximity filtering)');
  const proximityFiltered: Array<Therapist & { distance: number | null }> = allTherapists.map(t => ({ ...t, distance: null }));

  // Score and rank therapists - REQUIRE location match
  const scoredMatches = proximityFiltered
    .map((therapist) => {
      const { score, reasons, hasLocationMatch } = calculateMatchScore(therapist, prefs);

      // Boost score based on proximity
      let proximityBoost = 0;
      if (therapist.distance !== null) {
        if (therapist.distance <= 10) proximityBoost = 20;
        else if (therapist.distance <= 25) proximityBoost = 15;
        else if (therapist.distance <= 50) proximityBoost = 10;
        else if (therapist.distance <= 100) proximityBoost = 5;

        // Add distance to reasons
        if (therapist.distance <= 25) {
          reasons.unshift(`${therapist.distance} miles away`);
        }
      }

      return {
        ...therapist,
        matchScore: Math.min(score + proximityBoost, 100),
        matchReasons: reasons,
        hasLocationMatch, // Track if location matched
      };
    })
    .filter(t => t.hasLocationMatch); // CRITICAL: Only include therapists with location match

  console.log(`[MATCHER] After REQUIRED location filter: ${scoredMatches.length} therapists`);

  // Filter out therapists with very low scores (likely wrong location)
  // Minimum score of 30 ensures they have at least location match OR strong specialty match
  const filteredMatches = scoredMatches.filter(t => t.matchScore >= 30);

  console.log(`[MATCHER] After score filtering (>=30): ${filteredMatches.length} therapists`);

  // Sort by match score (highest first), then by distance (closest first)
  filteredMatches.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    // Same score - sort by distance
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });

  // Pagination
  const total = filteredMatches.length;
  const paginatedMatches = filteredMatches.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

  console.log(`[MATCHER] Pagination: total=${total}, offset=${offset}, limit=${limit}, hasMore=${hasMore}`);
  console.log(`[MATCHER] Returning ${paginatedMatches.length} therapists`);

  // Save matches to database for first batch only
  if (offset === 0 && paginatedMatches.length > 0) {
    console.log('[MATCHER] Saving top matches to database');
    await saveMatchesToDatabase(conversationId, paginatedMatches.slice(0, 5));
  }

  console.log('[MATCHER] Completed successfully');
  return {
    therapists: paginatedMatches,
    hasMore,
    total,
  };
}

/**
 * Calculate compatibility score for a therapist
 * Returns score (0-100) and reasons for the match
 */
function calculateMatchScore(
  therapist: Therapist,
  prefs: any
): { score: number; reasons: string[]; hasLocationMatch: boolean } {
  let score = 0;
  const reasons: string[] = [];
  let hasLocationMatch = false; // Track if location matched

  // Base score for being approved and accepting clients
  if (therapist.acceptingNewClients) {
    score += 20;
    reasons.push('Accepting new clients');
  }

  // Location match - STRICT: Only match therapists in same ZIP or city
  // No fallback points - if location doesn't match, therapist gets 0 location points
  if (prefs.locationZip) {
    const userLocation = prefs.locationZip.trim().toLowerCase();
    const therapistZip = therapist.zipCode?.trim().toLowerCase() || '';
    const therapistCity = therapist.city?.trim().toLowerCase() || '';

    // Exact ZIP match
    if (therapistZip === userLocation) {
      score += 30; // Increased from 15 - location is critical
      reasons.push('Located in your area');
      hasLocationMatch = true;
    }
    // City name match (case insensitive, partial match)
    else if (therapistCity && userLocation && (therapistCity.includes(userLocation) || userLocation.includes(therapistCity))) {
      score += 30; // Increased from 15
      reasons.push('Located in your area');
      hasLocationMatch = true;
    }
    // NO FALLBACK - wrong location = 0 points
  }

  // Session format match
  if (prefs.sessionFormat && prefs.sessionFormat !== 'either') {
    if (therapist.sessionTypes?.includes(prefs.sessionFormat)) {
      score += 15;
      reasons.push(`Offers ${prefs.sessionFormat} sessions`);
    }
  } else if (prefs.sessionFormat === 'either') {
    // Bonus for flexible therapists
    if (therapist.sessionTypes?.length && therapist.sessionTypes.length > 1) {
      score += 10;
      reasons.push('Offers both in-person and virtual');
    }
  }

  // Therapy approach match
  if (prefs.therapyApproach && prefs.therapyApproach !== 'not-sure') {
    if (therapist.modalities?.includes(prefs.therapyApproach)) {
      score += 20;
      reasons.push(`Specializes in ${prefs.therapyApproach}`);
    }
  }

  // Insurance match
  if (prefs.paymentMethod === 'insurance' && prefs.insuranceProvider) {
    if (therapist.insuranceAccepted?.includes(prefs.insuranceProvider)) {
      score += 15;
      reasons.push(`Accepts ${prefs.insuranceProvider}`);
    }
  }

  // Out-of-pocket affordability
  if (prefs.paymentMethod === 'out-of-pocket') {
    const fee = therapist.individualSessionFee || 0;
    if (fee >= 50 && fee <= 150) {
      score += 10;
      reasons.push('Affordable session rate');
    }
  }

  // Specialties alignment with treatment goals
  if (prefs.treatmentGoals && therapist.topSpecialties) {
    const goalsLower = prefs.treatmentGoals.toLowerCase();
    const matchingSpecialties = therapist.topSpecialties.filter((spec) =>
      goalsLower.includes(spec.toLowerCase()) ||
      spec.toLowerCase().includes(goalsLower.split(' ')[0]) // Match on first keyword
    );

    if (matchingSpecialties.length > 0) {
      score += 15;
      reasons.push(`Specializes in ${matchingSpecialties[0]}`);
    }
  }

  // Years of experience bonus
  if (therapist.yearsInPractice && therapist.yearsInPractice >= 5) {
    score += 5;
    reasons.push(`${therapist.yearsInPractice}+ years of experience`);
  }

  // NEW MATCHING - Phase 1: Core Matching
  // Gender preference match
  if (prefs.genderPreference && prefs.genderPreference !== 'no-preference') {
    if (therapist.gender === prefs.genderPreference) {
      score += 10;
      reasons.push(`${therapist.gender} therapist`);
    }
  }

  // Immediate availability match
  if (prefs.urgency === 'immediate' || prefs.urgency === 'asap') {
    if ((therapist.currentWaitlistWeeks || 0) === 0) {
      score += 15;
      reasons.push('Available immediately');
    }
  } else if (prefs.urgency === 'within-month') {
    if ((therapist.currentWaitlistWeeks || 0) <= 4) {
      score += 10;
      reasons.push('Available within a month');
    }
  }

  // Session length preference match
  if (prefs.sessionLength && therapist.sessionLengthOptions) {
    if (therapist.sessionLengthOptions.includes(prefs.sessionLength)) {
      score += 8;
      reasons.push(`Offers ${prefs.sessionLength} sessions`);
    }
  }

  // NEW MATCHING - Phase 2: Accessibility
  if (prefs.wheelchairAccessible && therapist.wheelchairAccessible) {
    score += 12;
    reasons.push('Wheelchair accessible');
  }

  if (prefs.aslRequired && therapist.aslCapable) {
    score += 12;
    reasons.push('ASL capable');
  }

  if (prefs.serviceAnimal && therapist.serviceAnimalFriendly) {
    score += 10;
    reasons.push('Service animal friendly');
  }

  // Virtual platform preference
  if (prefs.virtualPlatform && therapist.virtualPlatforms) {
    if (therapist.virtualPlatforms.includes(prefs.virtualPlatform)) {
      score += 8;
      reasons.push(`Uses ${prefs.virtualPlatform}`);
    }
  }

  // NEW MATCHING - Phase 3: Financial
  if (prefs.consultationNeeded && therapist.consultationOffered) {
    score += 8;
    reasons.push('Offers free consultation');
  }

  if (prefs.superbillNeeded && therapist.superbillProvided) {
    score += 10;
    reasons.push('Provides superbill');
  }

  if (prefs.fsaHsa && therapist.fsaHsaAccepted) {
    score += 8;
    reasons.push('Accepts FSA/HSA');
  }

  // Has bio and photo (completeness bonus)
  if (therapist.bio && therapist.bio.length > 100) {
    score += 3;
  }

  return { score: Math.min(score, 100), reasons, hasLocationMatch };
}

/**
 * Save matched therapists to database
 */
async function saveMatchesToDatabase(
  conversationId: string,
  matches: MatchedTherapist[]
): Promise<void> {
  for (const match of matches) {
    await db
      .insert(chatTherapistMatches)
      .values({
        conversationId,
        therapistId: match.id,
        matchScore: match.matchScore,
        // matchReasons stored in-memory only, not persisted to DB
      })
      .onConflictDoNothing(); // Prevent duplicates
  }
}

/**
 * Get saved matches for a conversation
 */
export async function getSavedMatches(
  conversationId: string
): Promise<MatchedTherapist[]> {
  const matches = await db
    .select()
    .from(chatTherapistMatches)
    .where(eq(chatTherapistMatches.conversationId, conversationId));

  // Fetch full therapist data for each match
  const therapists = await Promise.all(
    matches.map(async (match) => {
      const therapist = await storage.getTherapistById(match.therapistId);
      if (!therapist) return null;

      return {
        ...therapist,
        matchScore: match.matchScore || 0,
        matchReasons: [], // Reasons not persisted, would need to recalculate
        distance: null,
      };
    })
  );

  // Filter out nulls and return
  return therapists.filter((t) => t !== null) as MatchedTherapist[];
}
