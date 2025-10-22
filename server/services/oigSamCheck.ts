/**
 * OIG/SAM Exclusion Check Service
 * LEGALLY REQUIRED: Must check providers against federal exclusion lists
 *
 * OIG LEIE: Office of Inspector General - List of Excluded Individuals/Entities
 * SAM.gov: System for Award Management - Federal exclusions
 *
 * Requirement: Check monthly for all active providers
 */

import { db } from '../db';
import { oigExclusions, therapists, credentialingAlerts } from '@shared/schema';
import { eq, and, or } from 'drizzle-orm';
import * as csv from 'csv-parse/sync';

export interface OIGExclusionMatch {
  matched: boolean;
  confidence: 'high' | 'medium' | 'low';
  matchedOn: string[]; // e.g., ['name', 'npi']
  exclusion?: {
    firstName: string;
    lastName: string;
    npi?: string;
    exclusionType: string;
    exclusionDate: string;
    reinstatementDate?: string;
    state?: string;
    specialty?: string;
  };
}

export interface SAMExclusionResult {
  excluded: boolean;
  entityName?: string;
  exclusionType?: string;
  activeDate?: string;
  terminationDate?: string;
}

/**
 * Download and import latest OIG LEIE CSV data
 * Should be run monthly via cron job
 */
export async function updateOIGDatabase(): Promise<{ imported: number; errors: number }> {
  try {
    console.log('[OIG] Starting OIG LEIE database update...');

    // Download CSV from OIG
    const url = 'https://oig.hhs.gov/exclusions/downloadables/UPDATED.csv';

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download OIG data: ${response.statusText}`);
    }

    const csvText = await response.text();

    // Parse CSV
    const records = csv.parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`[OIG] Parsed ${records.length} records from OIG CSV`);

    // Clear existing data (we replace it each month)
    await db.delete(oigExclusions);
    console.log('[OIG] Cleared old OIG data');

    // Insert new data in batches
    const batchSize = 1000;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      try {
        const mappedRecords = batch.map((record: any) => ({
          lastName: record.LASTNAME || '',
          firstName: record.FIRSTNAME || '',
          middleName: record.MIDNAME || null,
          businessName: record.BUSNAME || null,
          general: record.GENERAL || null,
          specialty: record.SPECIALTY || null,
          npi: record.NPI || null,
          dob: record.DOB || null,
          address: record.ADDRESS || null,
          city: record.CITY || null,
          state: record.STATE || null,
          zip: record.ZIP || null,
          exclType: record.EXCLTYPE || null,
          exclDate: record.EXCLDATE || null,
          reinDate: record.REINDATE || null,
          waiverDate: record.WAIVERDATE || null,
          waiverState: record.WAIVERSTATE || null,
        }));

        await db.insert(oigExclusions).values(mappedRecords);
        imported += mappedRecords.length;

        console.log(`[OIG] Imported batch ${i / batchSize + 1}: ${mappedRecords.length} records`);
      } catch (error) {
        console.error(`[OIG] Error importing batch ${i / batchSize + 1}:`, error);
        errors += batch.length;
      }
    }

    console.log(`[OIG] OIG database update complete: ${imported} imported, ${errors} errors`);

    return { imported, errors };

  } catch (error) {
    console.error('[OIG] Fatal error updating OIG database:', error);
    throw error;
  }
}

/**
 * Check if a provider is on the OIG exclusion list
 * @param firstName - Provider's first name
 * @param lastName - Provider's last name
 * @param npi - Provider's NPI number (optional but increases accuracy)
 * @returns Match result with confidence level
 */
export async function checkOIGExclusion(
  firstName: string,
  lastName: string,
  npi?: string
): Promise<OIGExclusionMatch> {
  try {
    const matchedOn: string[] = [];

    // Search by name (case-insensitive)
    const nameMatches = await db
      .select()
      .from(oigExclusions)
      .where(
        and(
          eq(oigExclusions.firstName, firstName.toUpperCase()),
          eq(oigExclusions.lastName, lastName.toUpperCase())
        )
      );

    if (nameMatches.length === 0) {
      // No name match - check NPI if provided
      if (npi) {
        const npiMatches = await db
          .select()
          .from(oigExclusions)
          .where(eq(oigExclusions.npi, npi));

        if (npiMatches.length === 0) {
          return {
            matched: false,
            confidence: 'high',
            matchedOn: [],
          };
        }

        // NPI match but different name - suspicious
        matchedOn.push('npi');
        const match = npiMatches[0];

        return {
          matched: true,
          confidence: 'medium',
          matchedOn,
          exclusion: {
            firstName: match.firstName,
            lastName: match.lastName,
            npi: match.npi || undefined,
            exclusionType: match.exclType || 'Unknown',
            exclusionDate: match.exclDate || 'Unknown',
            reinstatementDate: match.reinDate || undefined,
            state: match.state || undefined,
            specialty: match.specialty || undefined,
          },
        };
      }

      // No match at all
      return {
        matched: false,
        confidence: 'high',
        matchedOn: [],
      };
    }

    // Name match found
    matchedOn.push('name');

    const match = nameMatches[0];

    // If NPI also matches, high confidence
    if (npi && match.npi === npi) {
      matchedOn.push('npi');
    }

    const confidence = matchedOn.includes('npi') ? 'high' : 'medium';

    // Check if reinstatement date has passed
    const isCurrentlyExcluded = !match.reinDate || new Date(match.reinDate) > new Date();

    return {
      matched: isCurrentlyExcluded,
      confidence,
      matchedOn,
      exclusion: {
        firstName: match.firstName,
        lastName: match.lastName,
        npi: match.npi || undefined,
        exclusionType: match.exclType || 'Unknown',
        exclusionDate: match.exclDate || 'Unknown',
        reinstatementDate: match.reinDate || undefined,
        state: match.state || undefined,
        specialty: match.specialty || undefined,
      },
    };

  } catch (error) {
    console.error('[OIG] Error checking OIG exclusion:', error);
    // In case of error, assume not excluded but log the error
    return {
      matched: false,
      confidence: 'low',
      matchedOn: [],
    };
  }
}

/**
 * Check SAM.gov exclusions using their public API
 * Requires free API key from sam.gov
 */
export async function checkSAMExclusion(
  firstName: string,
  lastName: string,
  apiKey?: string
): Promise<SAMExclusionResult> {
  try {
    // If no API key, skip SAM check (OIG is more critical)
    if (!apiKey && !process.env.SAM_API_KEY) {
      console.warn('[SAM] No SAM.gov API key configured, skipping SAM check');
      return {
        excluded: false,
      };
    }

    const key = apiKey || process.env.SAM_API_KEY;

    // SAM.gov Exclusions API
    const url = new URL('https://api.sam.gov/entity-information/v3/exclusions');
    url.searchParams.append('firstName', firstName);
    url.searchParams.append('lastName', lastName);
    url.searchParams.append('api_key', key!);

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error(`[SAM] API error: ${response.status} ${response.statusText}`);
      return {
        excluded: false,
      };
    }

    const data = await response.json();

    // Check if any active exclusions found
    if (data.totalRecords === 0 || !data.entityData || data.entityData.length === 0) {
      return {
        excluded: false,
      };
    }

    // Found exclusion record
    const exclusion = data.entityData[0];
    const exclusionDetails = exclusion.exclusionDetails?.[0];

    return {
      excluded: true,
      entityName: exclusion.legalBusinessName || `${firstName} ${lastName}`,
      exclusionType: exclusionDetails?.classificationType || 'Unknown',
      activeDate: exclusionDetails?.activeDate,
      terminationDate: exclusionDetails?.terminationDate,
    };

  } catch (error) {
    console.error('[SAM] Error checking SAM exclusion:', error);
    return {
      excluded: false,
    };
  }
}

/**
 * Run monthly check of all active providers against OIG/SAM
 * Creates alerts for any matches found
 */
export async function runMonthlyExclusionCheck(): Promise<{
  checked: number;
  matched: number;
  alertsCreated: number;
}> {
  console.log('[OIG] Starting monthly exclusion check for all active providers...');

  let checked = 0;
  let matched = 0;
  let alertsCreated = 0;

  try {
    // Get all active providers
    const activeProviders = await db
      .select()
      .from(therapists)
      .where(eq(therapists.profileStatus, 'approved'));

    console.log(`[OIG] Checking ${activeProviders.length} active providers`);

    for (const provider of activeProviders) {
      checked++;

      // Check OIG
      const oigResult = await checkOIGExclusion(
        provider.firstName,
        provider.lastName,
        provider.npiNumber || undefined
      );

      if (oigResult.matched) {
        matched++;
        console.warn(`[OIG] MATCH FOUND: ${provider.firstName} ${provider.lastName} (ID: ${provider.id})`);

        // Create critical alert
        await db.insert(credentialingAlerts).values({
          therapistId: provider.id,
          alertType: 'oig_match',
          severity: 'critical',
          message: `CRITICAL: Provider appears on OIG Exclusion List. Exclusion Type: ${oigResult.exclusion?.exclusionType}. Exclusion Date: ${oigResult.exclusion?.exclusionDate}. Immediate action required.`,
          resolved: false,
        });

        // Auto-suspend profile
        await db
          .update(therapists)
          .set({
            profileStatus: 'inactive',
            lastCredentialingUpdate: new Date(),
          })
          .where(eq(therapists.id, provider.id));

        alertsCreated++;

        console.log(`[OIG] Provider ${provider.id} auto-suspended and alert created`);
      }

      // Check SAM (if API key configured)
      if (process.env.SAM_API_KEY) {
        const samResult = await checkSAMExclusion(
          provider.firstName,
          provider.lastName
        );

        if (samResult.excluded) {
          matched++;
          console.warn(`[SAM] MATCH FOUND: ${provider.firstName} ${provider.lastName} (ID: ${provider.id})`);

          // Create critical alert
          await db.insert(credentialingAlerts).values({
            therapistId: provider.id,
            alertType: 'sam_exclusion',
            severity: 'critical',
            message: `CRITICAL: Provider appears on SAM.gov Exclusion List. Type: ${samResult.exclusionType}. Immediate action required.`,
            resolved: false,
          });

          // Auto-suspend if not already suspended
          await db
            .update(therapists)
            .set({
              profileStatus: 'inactive',
              lastCredentialingUpdate: new Date(),
            })
            .where(eq(therapists.id, provider.id));

          alertsCreated++;
        }
      }

      // Progress logging every 100 providers
      if (checked % 100 === 0) {
        console.log(`[OIG] Progress: ${checked}/${activeProviders.length} checked, ${matched} matches found`);
      }
    }

    console.log(`[OIG] Monthly check complete: ${checked} checked, ${matched} matched, ${alertsCreated} alerts created`);

    return {
      checked,
      matched,
      alertsCreated,
    };

  } catch (error) {
    console.error('[OIG] Error in monthly exclusion check:', error);
    throw error;
  }
}

/**
 * Get OIG database statistics
 */
export async function getOIGStats(): Promise<{
  totalExclusions: number;
  lastUpdated: Date | null;
}> {
  try {
    const result = await db
      .select({
        count: oigExclusions.id,
        lastImported: oigExclusions.importedAt,
      })
      .from(oigExclusions);

    return {
      totalExclusions: result.length,
      lastUpdated: result[0]?.lastImported || null,
    };

  } catch (error) {
    console.error('[OIG] Error getting OIG stats:', error);
    return {
      totalExclusions: 0,
      lastUpdated: null,
    };
  }
}
