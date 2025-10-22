/**
 * Credentialing Workflow Service
 * Orchestrates the complete credentialing process for providers
 */

import { db } from '../db';
import {
  therapists,
  credentialingVerifications,
  credentialingTimeline,
  credentialingAlerts,
  credentialingNotes,
  type Therapist,
  type InsertCredentialingVerification,
  type InsertCredentialingTimeline,
  type InsertCredentialingAlert,
  type InsertCredentialingNote,
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { verifyNPI } from './npiVerification';
import { validateDEANumber } from './deaValidation';
import { checkOIGExclusion, checkSAMExclusion } from './oigSamCheck';
import { sendAlertNotification } from './credentialingNotifications';

export interface CredentialingProgress {
  therapistId: string;
  currentPhase: string;
  credentialingStatus: 'not_started' | 'in_progress' | 'approved' | 'rejected'; // Frontend expects this
  overallStatus: 'not_started' | 'in_progress' | 'approved' | 'rejected'; // Backwards compatibility
  completedPhases: string[];
  pendingPhases: string[];
  failedPhases: string[];
  startDate?: Date;
  completedDate?: Date;
  daysInProcess?: number;
  totalPhases: number;
  completedPhasesCount: number;
  timeline?: any[]; // Frontend expects this name
  phases: {
    phase: string;
    status: string;
    startedAt?: Date;
    completedAt?: Date;
  }[];
  verifications?: any[];
  therapistInfo?: {
    npiNumber?: string;
    firstName: string;
    lastName: string;
    licenseNumber?: string;
    licenseState?: string;
  };
}

const CREDENTIALING_PHASES = [
  'document_review',
  'npi_verification',
  'license_verification',
  'education_verification',
  'background_check',
  'insurance_verification',
  'oig_sam_check',
  'final_review',
];

/**
 * Initialize credentialing for a provider
 */
export async function initializeCredentialing(therapistId: string): Promise<void> {
  try {
    // Update therapist status
    await db
      .update(therapists)
      .set({
        credentialingStatus: 'documents_pending',
        credentialingStartedAt: new Date(),
        lastCredentialingUpdate: new Date(),
      })
      .where(eq(therapists.id, therapistId));

    // Create timeline entries for all phases
    const timelineEntries = CREDENTIALING_PHASES.map(phase => ({
      therapistId,
      phase,
      status: 'pending' as const,
    }));

    await db.insert(credentialingTimeline).values(timelineEntries);

    // Create initial note
    await db.insert(credentialingNotes).values({
      therapistId,
      authorId: 'system',
      noteType: 'general',
      note: 'Credentialing process initialized. Waiting for provider to upload required documents.',
      isInternal: true,
    });

    console.log(`[Credentialing] Initialized for therapist ${therapistId}`);

  } catch (error) {
    console.error('[Credentialing] Error initializing:', error);
    throw error;
  }
}

/**
 * Run automated verifications for a provider
 * This runs the free API checks (NPI, OIG/SAM, DEA format)
 */
export async function runAutomatedVerifications(therapistId: string): Promise<{
  npi: boolean;
  dea: boolean;
  oig: boolean;
  sam: boolean;
}> {
  const results = {
    npi: false,
    dea: false,
    oig: false,
    sam: false,
  };

  try {
    // Get therapist data
    const therapist = await db
      .select()
      .from(therapists)
      .where(eq(therapists.id, therapistId))
      .limit(1);

    if (therapist.length === 0) {
      throw new Error('Therapist not found');
    }

    const provider = therapist[0];

    // 1. NPI Verification (if provided)
    if (provider.npiNumber) {
      console.log(`[Credentialing] Verifying NPI for ${therapistId}...`);

      const npiResult = await verifyNPI(provider.npiNumber);

      if (npiResult.valid) {
        results.npi = true;

        // Save verification
        await db.insert(credentialingVerifications).values({
          therapistId,
          verificationType: 'npi',
          status: 'verified',
          verificationDate: new Date(),
          verifiedBy: 'automated',
          verificationSource: 'CMS NPI Registry API',
          verificationData: JSON.stringify(npiResult),
          notes: `NPI verified: ${npiResult.name}, ${npiResult.specialtyDescription}`,
        });

        console.log(`[Credentialing] NPI verified for ${therapistId}`);
      } else {
        // Failed verification
        await db.insert(credentialingVerifications).values({
          therapistId,
          verificationType: 'npi',
          status: 'failed',
          verificationDate: new Date(),
          verifiedBy: 'automated',
          verificationSource: 'CMS NPI Registry API',
          notes: `NPI verification failed: ${npiResult.error}`,
        });

        // Create alert
        await db.insert(credentialingAlerts).values({
          therapistId,
          alertType: 'npi_verification_failed',
          severity: 'warning',
          message: `NPI verification failed: ${npiResult.error}`,
          resolved: false,
        });

        console.warn(`[Credentialing] NPI verification failed for ${therapistId}: ${npiResult.error}`);
      }
    }

    // 2. DEA Validation (if provided)
    if (provider.deaNumber) {
      console.log(`[Credentialing] Validating DEA for ${therapistId}...`);

      const deaResult = validateDEANumber(provider.deaNumber, provider.lastName);

      if (deaResult.valid) {
        results.dea = true;

        await db.insert(credentialingVerifications).values({
          therapistId,
          verificationType: 'dea',
          status: 'verified',
          verificationDate: new Date(),
          verifiedBy: 'automated',
          verificationSource: 'DEA Format Validation Algorithm',
          verificationData: JSON.stringify(deaResult),
          expirationDate: provider.deaExpiration || undefined,
          notes: `DEA format validated: ${deaResult.registrantTypeDescription}`,
        });

        console.log(`[Credentialing] DEA validated for ${therapistId}`);
      } else {
        await db.insert(credentialingVerifications).values({
          therapistId,
          verificationType: 'dea',
          status: 'failed',
          verificationDate: new Date(),
          verifiedBy: 'automated',
          verificationSource: 'DEA Format Validation Algorithm',
          notes: `DEA validation failed: ${deaResult.errors?.join(', ')}`,
        });

        await db.insert(credentialingAlerts).values({
          therapistId,
          alertType: 'dea_validation_failed',
          severity: 'warning',
          message: `DEA validation failed: ${deaResult.errors?.join(', ')}`,
          resolved: false,
        });

        console.warn(`[Credentialing] DEA validation failed for ${therapistId}`);
      }
    }

    // 3. OIG Exclusion Check (CRITICAL)
    console.log(`[Credentialing] Checking OIG exclusion for ${therapistId}...`);

    const oigResult = await checkOIGExclusion(
      provider.firstName,
      provider.lastName,
      provider.npiNumber || undefined
    );

    if (!oigResult.matched) {
      results.oig = true;

      await db.insert(credentialingVerifications).values({
        therapistId,
        verificationType: 'oig',
        status: 'verified',
        verificationDate: new Date(),
        verifiedBy: 'automated',
        verificationSource: 'OIG LEIE Database',
        verificationData: JSON.stringify(oigResult),
        nextCheckDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        notes: 'No match found in OIG exclusion list',
      });

      console.log(`[Credentialing] OIG check passed for ${therapistId}`);
    } else {
      // CRITICAL: Provider is excluded
      await db.insert(credentialingVerifications).values({
        therapistId,
        verificationType: 'oig',
        status: 'failed',
        verificationDate: new Date(),
        verifiedBy: 'automated',
        verificationSource: 'OIG LEIE Database',
        verificationData: JSON.stringify(oigResult),
        notes: `EXCLUDED: ${oigResult.exclusion?.exclusionType} - ${oigResult.exclusion?.exclusionDate}`,
      });

      await db.insert(credentialingAlerts).values({
        therapistId,
        alertType: 'oig_match',
        severity: 'critical',
        message: `CRITICAL: Provider appears on OIG Exclusion List. Type: ${oigResult.exclusion?.exclusionType}. Date: ${oigResult.exclusion?.exclusionDate}. IMMEDIATE ACTION REQUIRED.`,
        resolved: false,
      });

      // Send critical alert email (non-blocking)
      sendAlertNotification(
        therapistId,
        'OIG Exclusion Match',
        `Your name appears on the OIG Exclusion List. This is a critical compliance issue that must be resolved immediately.`,
        'critical',
        'Please contact our credentialing team immediately at credentialing@therapyconnect.com to discuss this matter.'
      ).catch(err => console.error("Error sending OIG alert notification:", err));

      // Auto-reject
      await db
        .update(therapists)
        .set({
          profileStatus: 'rejected',
          credentialingStatus: 'rejected',
          lastCredentialingUpdate: new Date(),
        })
        .where(eq(therapists.id, therapistId));

      console.error(`[Credentialing] OIG EXCLUSION FOUND for ${therapistId} - AUTO-REJECTED`);
    }

    // 4. SAM Exclusion Check (if API key available)
    if (process.env.SAM_API_KEY) {
      console.log(`[Credentialing] Checking SAM exclusion for ${therapistId}...`);

      const samResult = await checkSAMExclusion(provider.firstName, provider.lastName);

      if (!samResult.excluded) {
        results.sam = true;

        await db.insert(credentialingVerifications).values({
          therapistId,
          verificationType: 'sam',
          status: 'verified',
          verificationDate: new Date(),
          verifiedBy: 'automated',
          verificationSource: 'SAM.gov API',
          verificationData: JSON.stringify(samResult),
          nextCheckDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          notes: 'No match found in SAM exclusion list',
        });

        console.log(`[Credentialing] SAM check passed for ${therapistId}`);
      } else {
        await db.insert(credentialingVerifications).values({
          therapistId,
          verificationType: 'sam',
          status: 'failed',
          verificationDate: new Date(),
          verifiedBy: 'automated',
          verificationSource: 'SAM.gov API',
          verificationData: JSON.stringify(samResult),
          notes: `EXCLUDED: ${samResult.exclusionType}`,
        });

        await db.insert(credentialingAlerts).values({
          therapistId,
          alertType: 'sam_exclusion',
          severity: 'critical',
          message: `CRITICAL: Provider appears on SAM.gov Exclusion List. Type: ${samResult.exclusionType}. IMMEDIATE ACTION REQUIRED.`,
          resolved: false,
        });

        console.error(`[Credentialing] SAM EXCLUSION FOUND for ${therapistId}`);
      }
    }

    // Update overall status
    const allPassed = results.oig && (results.npi || !provider.npiNumber) && (results.dea || !provider.deaNumber);

    if (allPassed) {
      await db
        .update(therapists)
        .set({
          credentialingStatus: 'under_review',
          lastCredentialingUpdate: new Date(),
        })
        .where(eq(therapists.id, therapistId));
    }

    return results;

  } catch (error) {
    console.error('[Credentialing] Error running automated verifications:', error);
    throw error;
  }
}

/**
 * Get credentialing progress for a provider
 */
export async function getCredentialingProgress(therapistId: string): Promise<CredentialingProgress> {
  try {
    const therapist = await db
      .select()
      .from(therapists)
      .where(eq(therapists.id, therapistId))
      .limit(1);

    if (therapist.length === 0) {
      throw new Error('Therapist not found');
    }

    const provider = therapist[0];

    const timeline = await db
      .select()
      .from(credentialingTimeline)
      .where(eq(credentialingTimeline.therapistId, therapistId))
      .orderBy(credentialingTimeline.createdAt);

    // Get all verification records
    const verifications = await db
      .select()
      .from(credentialingVerifications)
      .where(eq(credentialingVerifications.therapistId, therapistId))
      .orderBy(desc(credentialingVerifications.verificationDate));

    const completed = timeline.filter(t => t.status === 'completed');
    const pending = timeline.filter(t => t.status === 'pending');
    const failed = timeline.filter(t => t.status === 'failed');

    const currentPhase = timeline.find(t => t.status === 'in_progress')?.phase
                      || pending[0]?.phase
                      || 'final_review';

    let daysInProcess: number | undefined;
    if (provider.credentialingStartedAt) {
      const now = new Date();
      const started = new Date(provider.credentialingStartedAt);
      daysInProcess = Math.floor((now.getTime() - started.getTime()) / (1000 * 60 * 60 * 24));
    }

    const timelineData = timeline.map(t => ({
      phase: t.phase,
      status: t.status,
      startedAt: t.startedAt || undefined,
      completedAt: t.completedAt || undefined,
    }));

    return {
      therapistId,
      currentPhase,
      credentialingStatus: provider.credentialingStatus as any || 'not_started', // Frontend expects this
      overallStatus: provider.credentialingStatus as any || 'not_started', // Backwards compatibility
      completedPhases: completed.map(t => t.phase),
      pendingPhases: pending.map(t => t.phase),
      failedPhases: failed.map(t => t.phase),
      startDate: provider.credentialingStartedAt || undefined,
      completedDate: provider.credentialingCompletedAt || undefined,
      daysInProcess,
      totalPhases: CREDENTIALING_PHASES.length,
      completedPhasesCount: completed.length,
      timeline: timelineData, // Frontend expects this name
      phases: timelineData, // Backwards compatibility
      verifications: verifications.map(v => ({
        id: v.id,
        verificationType: v.verificationType,
        status: v.status,
        verificationDate: v.verificationDate,
        verifiedBy: v.verifiedBy,
        verificationSource: v.verificationSource,
        notes: v.notes,
        expirationDate: v.expirationDate,
        nextCheckDate: v.nextCheckDate,
      })),
      therapistInfo: {
        npiNumber: provider.npiNumber || undefined,
        firstName: provider.firstName,
        lastName: provider.lastName,
        licenseNumber: provider.licenseNumber || undefined,
        licenseState: provider.licenseState || undefined,
      },
    };

  } catch (error) {
    console.error('[Credentialing] Error getting progress:', error);
    throw error;
  }
}

/**
 * Mark a credentialing phase as complete
 */
export async function completeCredentialingPhase(
  therapistId: string,
  phase: string,
  notes?: string
): Promise<void> {
  try {
    await db
      .update(credentialingTimeline)
      .set({
        status: 'completed',
        completedAt: new Date(),
        notes,
      })
      .where(
        and(
          eq(credentialingTimeline.therapistId, therapistId),
          eq(credentialingTimeline.phase, phase)
        )
      );

    // Check if all phases complete
    const progress = await getCredentialingProgress(therapistId);

    if (progress.pendingPhases.length === 0 && progress.failedPhases.length === 0) {
      // All phases complete - approve provider
      await db
        .update(therapists)
        .set({
          profileStatus: 'approved',
          credentialingStatus: 'approved',
          credentialingCompletedAt: new Date(),
          lastCredentialingUpdate: new Date(),
        })
        .where(eq(therapists.id, therapistId));

      console.log(`[Credentialing] Provider ${therapistId} APPROVED - all phases complete`);
    }

  } catch (error) {
    console.error('[Credentialing] Error completing phase:', error);
    throw error;
  }
}

/**
 * Check for expiring credentials and create alerts
 */
export async function checkExpiringCredentials(): Promise<void> {
  try {
    const today = new Date();
    const days60 = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    // Check for expiring licenses
    const expiringLicenses = await db
      .select()
      .from(therapists)
      .where(and(
        eq(therapists.profileStatus, 'approved'),
        // License expires within 60 days
      ));

    for (const provider of expiringLicenses) {
      if (provider.licenseExpiration) {
        const expirationDate = new Date(provider.licenseExpiration);
        if (expirationDate <= days60 && expirationDate > today) {
          const daysUntilExpiration = Math.floor(
            (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          await db.insert(credentialingAlerts).values({
            therapistId: provider.id,
            alertType: 'license_expiring',
            severity: daysUntilExpiration <= 30 ? 'warning' : 'info',
            message: `License expires in ${daysUntilExpiration} days (${expirationDate.toLocaleDateString()}). Provider needs to renew.`,
            resolved: false,
          });
        }
      }

      // Check DEA expiration
      if (provider.deaExpiration) {
        const expirationDate = new Date(provider.deaExpiration);
        if (expirationDate <= days60 && expirationDate > today) {
          const daysUntilExpiration = Math.floor(
            (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          await db.insert(credentialingAlerts).values({
            therapistId: provider.id,
            alertType: 'dea_expiring',
            severity: daysUntilExpiration <= 30 ? 'warning' : 'info',
            message: `DEA registration expires in ${daysUntilExpiration} days (${expirationDate.toLocaleDateString()}). Provider needs to renew.`,
            resolved: false,
          });
        }
      }
    }

  } catch (error) {
    console.error('[Credentialing] Error checking expiring credentials:', error);
  }
}
