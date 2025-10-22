/**
 * Credentialing Automated Jobs
 * Scheduled tasks for maintaining provider credentials
 */

import cron from 'node-cron';
import { updateOIGDatabase, runMonthlyExclusionCheck } from '../services/oigSamCheck';
import { checkExpiringCredentials } from '../services/credentialingService';
import { db } from '../db';
import { therapists, credentialingAlerts } from '@shared/schema';
import { eq, and, lt } from 'drizzle-orm';

/**
 * Initialize all credentialing cron jobs
 */
export function initializeCredentialingJobs() {
  console.log('[Cron] Initializing credentialing automated jobs...');

  // Job 1: Update OIG Database - Monthly on the 1st at 2 AM
  cron.schedule('0 2 1 * *', async () => {
    console.log('[Cron] Starting monthly OIG database update...');
    try {
      const result = await updateOIGDatabase();
      console.log(`[Cron] OIG database updated successfully: ${result.imported} records imported, ${result.errors} errors`);
    } catch (error) {
      console.error('[Cron] Error updating OIG database:', error);
    }
  });

  // Job 2: Check All Active Providers Against OIG/SAM - Monthly on 2nd at 3 AM
  cron.schedule('0 3 2 * *', async () => {
    console.log('[Cron] Starting monthly provider exclusion check...');
    try {
      const result = await runMonthlyExclusionCheck();
      console.log(`[Cron] Monthly exclusion check complete: ${result.checked} checked, ${result.matched} matches, ${result.alertsCreated} alerts`);
    } catch (error) {
      console.error('[Cron] Error in monthly exclusion check:', error);
    }
  });

  // Job 3: Check for Expiring Credentials - Daily at 8 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Checking for expiring credentials...');
    try {
      await checkExpiringCredentials();
      console.log('[Cron] Expiring credentials check complete');
    } catch (error) {
      console.error('[Cron] Error checking expiring credentials:', error);
    }
  });

  // Job 4: Auto-Expire Licenses - Daily at 1 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('[Cron] Checking for expired licenses...');
    try {
      const today = new Date();

      // Find providers with expired licenses
      const expiredProviders = await db
        .select()
        .from(therapists)
        .where(
          and(
            eq(therapists.profileStatus, 'approved'),
            lt(therapists.licenseExpiration, today)
          )
        );

      for (const provider of expiredProviders) {
        // Auto-inactivate
        await db
          .update(therapists)
          .set({
            profileStatus: 'inactive',
            credentialingStatus: 'rejected',
            lastCredentialingUpdate: new Date(),
          })
          .where(eq(therapists.id, provider.id));

        // Create alert
        await db.insert(credentialingAlerts).values({
          therapistId: provider.id,
          alertType: 'license_expired',
          severity: 'critical',
          message: `License expired on ${provider.licenseExpiration?.toLocaleDateString()}. Profile has been auto-deactivated.`,
          resolved: false,
        });

        console.log(`[Cron] Provider ${provider.id} license expired - auto-deactivated`);
      }

      console.log(`[Cron] Expired license check complete: ${expiredProviders.length} providers deactivated`);
    } catch (error) {
      console.error('[Cron] Error checking expired licenses:', error);
    }
  });

  // Job 5: Send Expiration Reminder Emails - Daily at 9 AM
  // Note: This requires email service integration (future enhancement)
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Sending expiration reminder emails...');
    try {
      const today = new Date();
      const days60 = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
      const days30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const days10 = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);

      // Get providers with expiring licenses
      const expiringProviders = await db
        .select()
        .from(therapists)
        .where(
          and(
            eq(therapists.profileStatus, 'approved'),
            lt(therapists.licenseExpiration, days60)
          )
        );

      for (const provider of expiringProviders) {
        if (provider.licenseExpiration) {
          const expirationDate = new Date(provider.licenseExpiration);
          const daysUntilExpiration = Math.floor(
            (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Send reminders at 60, 30, and 10 days
          if (daysUntilExpiration === 60 || daysUntilExpiration === 30 || daysUntilExpiration === 10) {
            console.log(`[Cron] Would send email to ${provider.email}: License expires in ${daysUntilExpiration} days`);

            // TODO: Integrate email service
            // await sendEmail({
            //   to: provider.email,
            //   subject: `License Expiration Reminder - ${daysUntilExpiration} Days`,
            //   template: 'license-expiration',
            //   data: {
            //     firstName: provider.firstName,
            //     daysRemaining: daysUntilExpiration,
            //     expirationDate: expirationDate.toLocaleDateString(),
            //   },
            // });
          }
        }

        // Check DEA expiration too
        if (provider.deaExpiration) {
          const expirationDate = new Date(provider.deaExpiration);
          const daysUntilExpiration = Math.floor(
            (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilExpiration === 60 || daysUntilExpiration === 30 || daysUntilExpiration === 10) {
            console.log(`[Cron] Would send email to ${provider.email}: DEA expires in ${daysUntilExpiration} days`);
          }
        }
      }

      console.log(`[Cron] Expiration reminder check complete: ${expiringProviders.length} providers checked`);
    } catch (error) {
      console.error('[Cron] Error sending expiration reminders:', error);
    }
  });

  // Job 6: Quarterly Re-verification Reminder - 1st of Jan, Apr, Jul, Oct at 10 AM
  cron.schedule('0 10 1 1,4,7,10 *', async () => {
    console.log('[Cron] Quarterly re-verification reminder...');
    try {
      // Get all active providers
      const providers = await db
        .select()
        .from(therapists)
        .where(eq(therapists.profileStatus, 'approved'));

      console.log(`[Cron] Would send quarterly re-verification reminder to ${providers.length} providers`);

      // TODO: Send emails to providers reminding them to update credentials

    } catch (error) {
      console.error('[Cron] Error in quarterly reminder:', error);
    }
  });

  // Job 7: Weekly Credentialing Report - Every Monday at 7 AM
  cron.schedule('0 7 * * 1', async () => {
    console.log('[Cron] Generating weekly credentialing report...');
    try {
      // Count providers by credentialing status
      const statusCounts = await db
        .select({
          credentialingStatus: therapists.credentialingStatus,
        })
        .from(therapists);

      const stats = statusCounts.reduce((acc: Record<string, number>, row) => {
        const status = row.credentialingStatus || 'not_started';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      console.log('[Cron] Weekly Credentialing Report:');
      console.log('  Not Started:', stats['not_started'] || 0);
      console.log('  Documents Pending:', stats['documents_pending'] || 0);
      console.log('  Under Review:', stats['under_review'] || 0);
      console.log('  Approved:', stats['approved'] || 0);
      console.log('  Rejected:', stats['rejected'] || 0);

      // Count unresolved alerts
      const unresolvedAlerts = await db
        .select()
        .from(credentialingAlerts)
        .where(eq(credentialingAlerts.resolved, false));

      console.log('  Unresolved Alerts:', unresolvedAlerts.length);

      // TODO: Send email report to admin team

    } catch (error) {
      console.error('[Cron] Error generating weekly report:', error);
    }
  });

  console.log('[Cron] ✅ All credentialing jobs scheduled');
  console.log('[Cron] Schedule:');
  console.log('  - Monthly OIG Update: 1st of month at 2:00 AM');
  console.log('  - Monthly Provider Check: 2nd of month at 3:00 AM');
  console.log('  - Daily Expiring Credentials: Every day at 8:00 AM');
  console.log('  - Daily Expired Licenses: Every day at 1:00 AM');
  console.log('  - Daily Email Reminders: Every day at 9:00 AM');
  console.log('  - Quarterly Re-verification: 1st of Jan/Apr/Jul/Oct at 10:00 AM');
  console.log('  - Weekly Report: Every Monday at 7:00 AM');
}

/**
 * Run OIG update immediately (for testing or manual trigger)
 */
export async function runOIGUpdateNow() {
  console.log('[Manual] Running OIG database update now...');
  try {
    const result = await updateOIGDatabase();
    console.log(`[Manual] OIG database updated: ${result.imported} imported, ${result.errors} errors`);
    return result;
  } catch (error) {
    console.error('[Manual] Error updating OIG:', error);
    throw error;
  }
}

/**
 * Run monthly exclusion check immediately (for testing)
 */
export async function runExclusionCheckNow() {
  console.log('[Manual] Running monthly exclusion check now...');
  try {
    const result = await runMonthlyExclusionCheck();
    console.log(`[Manual] Exclusion check complete: ${result.checked} checked, ${result.matched} matches`);
    return result;
  } catch (error) {
    console.error('[Manual] Error in exclusion check:', error);
    throw error;
  }
}

/**
 * Check expiring credentials immediately (for testing)
 */
export async function checkExpiringNow() {
  console.log('[Manual] Checking expiring credentials now...');
  try {
    await checkExpiringCredentials();
    console.log('[Manual] Expiring credentials check complete');
  } catch (error) {
    console.error('[Manual] Error checking expiring credentials:', error);
    throw error;
  }
}
