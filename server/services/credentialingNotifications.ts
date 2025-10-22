import { db } from "../db";
import { therapists, credentialingEmailPreferences } from "@shared/schema";
import { eq } from "drizzle-orm";
import { emailService } from "./emailService";
import type {
  DocumentUploadEmailData,
  DocumentVerifiedEmailData,
  DocumentExpiringEmailData,
  PhaseCompletedEmailData,
  CredentialingApprovedEmailData,
  AlertEmailData,
  WelcomeEmailData,
} from "./emailService";

// Get therapist email and preferences
async function getTherapistEmailPreferences(therapistId: string) {
  const therapist = await db.query.therapists.findFirst({
    where: eq(therapists.id, therapistId),
  });

  if (!therapist || !therapist.email) {
    console.warn(`[Notifications] No email found for therapist ${therapistId}`);
    return null;
  }

  // Get email preferences (or create default)
  let prefs = await db.query.credentialingEmailPreferences.findFirst({
    where: eq(credentialingEmailPreferences.therapistId, therapistId),
  });

  // If no preferences exist, create default
  if (!prefs) {
    [prefs] = await db.insert(credentialingEmailPreferences).values({
      therapistId,
      emailEnabled: true,
      documentUploadConfirmation: true,
      documentVerified: true,
      documentExpiring: true,
      phaseCompleted: true,
      credentialingApproved: true,
      alerts: true,
      criticalAlertsOnly: false,
    }).returning();
  }

  return {
    email: therapist.email,
    name: `${therapist.firstName || ""} ${therapist.lastName || ""}`.trim() || therapist.email,
    preferences: prefs,
  };
}

// Base portal URL
function getPortalUrl(): string {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  return `${baseUrl}/provider-credentialing`;
}

// 1. Send document upload confirmation
export async function sendDocumentUploadNotification(
  therapistId: string,
  documentType: string,
  fileName: string
): Promise<boolean> {
  try {
    const info = await getTherapistEmailPreferences(therapistId);
    if (!info || !info.preferences.emailEnabled || !info.preferences.documentUploadConfirmation) {
      return false;
    }

    const data: DocumentUploadEmailData = {
      providerName: info.name,
      documentType: formatDocumentType(documentType),
      fileName,
      uploadDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      portalLink: getPortalUrl(),
    };

    return await emailService.sendDocumentUploadEmail(info.email, data);
  } catch (error) {
    console.error("[Notifications] Error sending document upload email:", error);
    return false;
  }
}

// 2. Send document verified notification
export async function sendDocumentVerifiedNotification(
  therapistId: string,
  documentType: string,
  fileName: string,
  verifiedBy: string
): Promise<boolean> {
  try {
    const info = await getTherapistEmailPreferences(therapistId);
    if (!info || !info.preferences.emailEnabled || !info.preferences.documentVerified) {
      return false;
    }

    const data: DocumentVerifiedEmailData = {
      providerName: info.name,
      documentType: formatDocumentType(documentType),
      fileName,
      verifiedDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      verifiedBy,
      portalLink: getPortalUrl(),
    };

    return await emailService.sendDocumentVerifiedEmail(info.email, data);
  } catch (error) {
    console.error("[Notifications] Error sending document verified email:", error);
    return false;
  }
}

// 3. Send document expiring notification
export async function sendDocumentExpiringNotification(
  therapistId: string,
  documentType: string,
  fileName: string,
  expirationDate: Date,
  daysUntilExpiration: number
): Promise<boolean> {
  try {
    const info = await getTherapistEmailPreferences(therapistId);
    if (!info || !info.preferences.emailEnabled || !info.preferences.documentExpiring) {
      return false;
    }

    // Check if this reminder day is in the therapist's preferences
    const reminderDays = info.preferences.expirationReminderDays || [90, 60, 30, 7];
    if (!reminderDays.includes(daysUntilExpiration)) {
      return false; // Skip if not a configured reminder day
    }

    const data: DocumentExpiringEmailData = {
      providerName: info.name,
      documentType: formatDocumentType(documentType),
      fileName,
      expirationDate: expirationDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      daysUntilExpiration,
      uploadLink: `${getPortalUrl()}?tab=upload`,
    };

    return await emailService.sendDocumentExpiringEmail(info.email, data);
  } catch (error) {
    console.error("[Notifications] Error sending document expiring email:", error);
    return false;
  }
}

// 4. Send phase completed notification
export async function sendPhaseCompletedNotification(
  therapistId: string,
  phaseName: string,
  nextPhase: string | null,
  progressPercentage: number
): Promise<boolean> {
  try {
    const info = await getTherapistEmailPreferences(therapistId);
    if (!info || !info.preferences.emailEnabled || !info.preferences.phaseCompleted) {
      return false;
    }

    const data: PhaseCompletedEmailData = {
      providerName: info.name,
      phaseName: formatPhaseName(phaseName),
      completedDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      nextPhase: nextPhase ? formatPhaseName(nextPhase) : undefined,
      progressPercentage,
      portalLink: getPortalUrl(),
    };

    return await emailService.sendPhaseCompletedEmail(info.email, data);
  } catch (error) {
    console.error("[Notifications] Error sending phase completed email:", error);
    return false;
  }
}

// 5. Send credentialing approved notification
export async function sendCredentialingApprovedNotification(
  therapistId: string
): Promise<boolean> {
  try {
    const info = await getTherapistEmailPreferences(therapistId);
    if (!info || !info.preferences.emailEnabled || !info.preferences.credentialingApproved) {
      return false;
    }

    const baseUrl = process.env.BASE_URL || "http://localhost:5000";

    const data: CredentialingApprovedEmailData = {
      providerName: info.name,
      approvalDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      nextSteps: [
        "Complete your provider profile with bio, specialties, and photo",
        "Set your availability and scheduling preferences",
        "Review and accept your first client appointments",
        "Familiarize yourself with our platform features and tools",
        "Keep your credentials current by uploading updated documents before expiration",
      ],
      dashboardLink: `${baseUrl}/dashboard`,
    };

    return await emailService.sendCredentialingApprovedEmail(info.email, data);
  } catch (error) {
    console.error("[Notifications] Error sending credentialing approved email:", error);
    return false;
  }
}

// 6. Send alert notification
export async function sendAlertNotification(
  therapistId: string,
  alertType: string,
  alertMessage: string,
  severity: "critical" | "warning" | "info",
  actionRequired?: string
): Promise<boolean> {
  try {
    const info = await getTherapistEmailPreferences(therapistId);
    if (!info || !info.preferences.emailEnabled || !info.preferences.alerts) {
      return false;
    }

    // If critical alerts only mode is enabled, skip non-critical alerts
    if (info.preferences.criticalAlertsOnly && severity !== "critical") {
      return false;
    }

    const data: AlertEmailData = {
      providerName: info.name,
      alertType: formatAlertType(alertType),
      alertMessage,
      severity,
      actionRequired,
      portalLink: `${getPortalUrl()}?tab=alerts`,
    };

    return await emailService.sendAlertEmail(info.email, data);
  } catch (error) {
    console.error("[Notifications] Error sending alert email:", error);
    return false;
  }
}

// 7. Send welcome email
export async function sendWelcomeNotification(therapistId: string): Promise<boolean> {
  try {
    const info = await getTherapistEmailPreferences(therapistId);
    if (!info || !info.preferences.emailEnabled) {
      return false;
    }

    const data: WelcomeEmailData = {
      providerName: info.name,
      email: info.email,
      portalLink: getPortalUrl(),
      supportEmail: process.env.SUPPORT_EMAIL || "credentialing@therapyconnect.com",
      nextSteps: [
        "Log in to your credentialing portal",
        "Review the list of required documents",
        "Upload all required credentialing documents (license, transcript, diploma, ID, insurance, etc.)",
        "Verify your NPI number in the NPI Verification tab",
        "Complete any additional verification steps as requested",
        "Monitor your progress in the Status & Progress tab",
        "Respond promptly to any alerts or requests for additional information",
      ],
    };

    return await emailService.sendWelcomeEmail(info.email, data);
  } catch (error) {
    console.error("[Notifications] Error sending welcome email:", error);
    return false;
  }
}

// Utility: Format document type for display
function formatDocumentType(type: string): string {
  const types: Record<string, string> = {
    license: "Professional License",
    transcript: "Graduate Transcript",
    diploma: "Diploma/Degree",
    government_id: "Government ID",
    liability_insurance: "Liability Insurance",
    dea_certificate: "DEA Certificate",
    board_certification: "Board Certification",
  };
  return types[type] || type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// Utility: Format phase name for display
function formatPhaseName(phase: string): string {
  const phases: Record<string, string> = {
    document_review: "Document Review",
    npi_verification: "NPI Verification",
    license_verification: "License Verification",
    education_verification: "Education Verification",
    background_check: "Background Check",
    insurance_verification: "Insurance Verification",
    oig_sam_check: "OIG/SAM Exclusion Check",
    final_review: "Final Review",
  };
  return phases[phase] || phase.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// Utility: Format alert type for display
function formatAlertType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// Batch notification for multiple expiring documents
export async function sendExpiringDocumentsBatch(
  therapistId: string,
  expiringDocuments: Array<{
    documentType: string;
    fileName: string;
    expirationDate: Date;
    daysUntilExpiration: number;
  }>
): Promise<boolean> {
  try {
    // Send individual notifications for each document
    const results = await Promise.all(
      expiringDocuments.map((doc) =>
        sendDocumentExpiringNotification(
          therapistId,
          doc.documentType,
          doc.fileName,
          doc.expirationDate,
          doc.daysUntilExpiration
        )
      )
    );

    return results.some((result) => result); // Return true if at least one email sent
  } catch (error) {
    console.error("[Notifications] Error sending expiring documents batch:", error);
    return false;
  }
}
