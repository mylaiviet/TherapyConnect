/**
 * Therapist Matching Service for Chatbot
 * Converts chatbot preferences into therapist search filters
 * Returns top 3-5 matches ranked by compatibility
 */

import { storage } from '../storage';
import type { TherapistFilters } from '../storage';
import type { Therapist } from '@shared/schema';
import { db } from '../db';
import { chatPreferences, chatTherapistMatches } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface MatchedTherapist extends Therapist {
  matchScore: number; // 0-100
  matchReasons: string[]; // Why this therapist was matched
}

/**
 * Find therapists based on chatbot conversation preferences
 */
export async function findMatchingTherapists(
  conversationId: string
): Promise<MatchedTherapist[]> {
  // Get user preferences from database
  const [prefs] = await db
    .select()
    .from(chatPreferences)
    .where(eq(chatPreferences.conversationId, conversationId))
    .limit(1);

  if (!prefs) {
    throw new Error('No preferences found for conversation');
  }

  // Convert chatbot preferences to therapist filters
  // Use RELAXED filtering to maximize matches - we'll rank by score instead
  const filters: TherapistFilters = {
    acceptingNewClients: true, // Always prioritize therapists accepting new clients
  };

  // Location filter - accept both ZIP codes and city names
  if (prefs.locationZip && prefs.locationZip.trim().length > 0) {
    filters.location = prefs.locationZip.trim();
    // Don't set radius - let DB return all matching locations
  }

  // DON'T filter on modalities - accept all session formats
  // We'll use this for scoring instead

  // DON'T filter on therapy approach - use for scoring only

  // DON'T filter on insurance - we're doing out-of-pocket anyway

  // DON'T filter on price - we'll accept all prices and show the range
  // Users can decide if it's affordable

  // Fetch therapists matching the filters
  const allMatches = await storage.getAllTherapists(filters);

  // Score and rank therapists
  const scoredMatches = allMatches.map((therapist) => {
    const { score, reasons } = calculateMatchScore(therapist, prefs);
    return {
      ...therapist,
      matchScore: score,
      matchReasons: reasons,
    };
  });

  // Sort by match score (highest first)
  scoredMatches.sort((a, b) => b.matchScore - a.matchScore);

  // Return top 5 matches
  const topMatches = scoredMatches.slice(0, 5);

  // Save matches to database for future reference
  await saveMatchesToDatabase(conversationId, topMatches);

  return topMatches;
}

/**
 * Calculate compatibility score for a therapist
 * Returns score (0-100) and reasons for the match
 */
function calculateMatchScore(
  therapist: Therapist,
  prefs: any
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Base score for being approved and accepting clients
  if (therapist.acceptingNewClients) {
    score += 20;
    reasons.push('Accepting new clients');
  }

  // Location match - check both ZIP and city
  if (prefs.locationZip) {
    const userLocation = prefs.locationZip.trim().toLowerCase();
    const therapistZip = therapist.zipCode?.trim().toLowerCase() || '';
    const therapistCity = therapist.city?.trim().toLowerCase() || '';

    // Exact ZIP match
    if (therapistZip === userLocation) {
      score += 15;
      reasons.push('Located in your area');
    }
    // City name match (case insensitive, partial match)
    else if (therapistCity.includes(userLocation) || userLocation.includes(therapistCity)) {
      score += 15;
      reasons.push('Located in your area');
    }
    // If therapist is in same state or nearby, give partial credit
    else if (therapistCity && therapistZip) {
      score += 5;
      reasons.push('Available in your region');
    }
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

  // Has bio and photo (completeness bonus)
  if (therapist.bio && therapist.bio.length > 100) {
    score += 3;
  }

  return { score: Math.min(score, 100), reasons };
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
        matchReasons: match.matchReasons,
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
        matchScore: match.matchScore,
        matchReasons: match.matchReasons || [],
      };
    })
  );

  // Filter out nulls and return
  return therapists.filter((t) => t !== null) as MatchedTherapist[];
}
