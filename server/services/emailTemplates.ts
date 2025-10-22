import type {
  DocumentUploadEmailData,
  DocumentVerifiedEmailData,
  DocumentExpiringEmailData,
  PhaseCompletedEmailData,
  CredentialingApprovedEmailData,
  AlertEmailData,
  WelcomeEmailData,
} from "./emailService";

// Base HTML template wrapper
function wrapTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TherapyConnect Credentialing</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .content h2 {
      color: #333;
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .content p {
      margin: 15px 0;
      color: #555;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
      text-align: center;
    }
    .button:hover {
      opacity: 0.9;
    }
    .alert-box {
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .alert-critical {
      background-color: #fee;
      border-left: 4px solid #dc2626;
      color: #991b1b;
    }
    .alert-warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      color: #92400e;
    }
    .alert-info {
      background-color: #dbeafe;
      border-left: 4px solid #3b82f6;
      color: #1e40af;
    }
    .info-box {
      background-color: #f3f4f6;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .info-box strong {
      color: #111827;
    }
    ul {
      padding-left: 20px;
      margin: 15px 0;
    }
    li {
      margin: 8px 0;
      color: #555;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 25px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 TherapyConnect</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">Provider Credentialing</p>
    </div>
    ${content}
    <div class="footer">
      <p>
        <strong>TherapyConnect Credentialing Team</strong><br>
        Questions? Contact us at <a href="mailto:credentialing@therapyconnect.com">credentialing@therapyconnect.com</a>
      </p>
      <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
        © ${new Date().getFullYear()} TherapyConnect. All rights reserved.<br>
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// 1. Document Upload Confirmation
export function renderDocumentUploadTemplate(data: DocumentUploadEmailData): string {
  const content = `
    <div class="content">
      <h2>Document Uploaded Successfully ✅</h2>
      <p>Hello <strong>${data.providerName}</strong>,</p>
      <p>
        We've received your document and it's now under review by our credentialing team.
      </p>

      <div class="info-box">
        <strong>Document Details:</strong>
        <ul style="margin: 10px 0 0 0;">
          <li><strong>Type:</strong> ${data.documentType}</li>
          <li><strong>File Name:</strong> ${data.fileName}</li>
          <li><strong>Upload Date:</strong> ${data.uploadDate}</li>
        </ul>
      </div>

      <p>
        Our team will review your document within <strong>3-5 business days</strong>.
        You'll receive another email once the document has been verified.
      </p>

      <div class="alert-box alert-info">
        <strong>📝 What's Next?</strong><br>
        Continue uploading any remaining required documents to expedite your credentialing process.
      </div>

      <a href="${data.portalLink}" class="button">View Credentialing Portal</a>

      <p style="margin-top: 25px; color: #6b7280; font-size: 14px;">
        You can track your credentialing progress anytime in your provider portal.
      </p>
    </div>
  `;
  return wrapTemplate(content);
}

// 2. Document Verified
export function renderDocumentVerifiedTemplate(data: DocumentVerifiedEmailData): string {
  const content = `
    <div class="content">
      <h2>Document Verified ✓</h2>
      <p>Hello <strong>${data.providerName}</strong>,</p>
      <p>
        Great news! Your document has been successfully verified by our credentialing team.
      </p>

      <div class="info-box">
        <strong>Verification Details:</strong>
        <ul style="margin: 10px 0 0 0;">
          <li><strong>Document Type:</strong> ${data.documentType}</li>
          <li><strong>File Name:</strong> ${data.fileName}</li>
          <li><strong>Verified Date:</strong> ${data.verifiedDate}</li>
          <li><strong>Verified By:</strong> ${data.verifiedBy}</li>
        </ul>
      </div>

      <p>
        This document has been approved and is now part of your verified credentialing record.
      </p>

      <a href="${data.portalLink}" class="button">View All Documents</a>

      <p style="margin-top: 25px; color: #6b7280; font-size: 14px;">
        Your credentialing progress has been updated. Check your portal for the latest status.
      </p>
    </div>
  `;
  return wrapTemplate(content);
}

// 3. Document Expiring Soon
export function renderDocumentExpiringTemplate(data: DocumentExpiringEmailData): string {
  const isUrgent = data.daysUntilExpiration <= 30;
  const alertClass = isUrgent ? "alert-critical" : "alert-warning";
  const urgencyText = isUrgent ? "URGENT ACTION REQUIRED" : "Action Required";

  const content = `
    <div class="content">
      <h2>Document Expiring Soon ⚠️</h2>
      <p>Hello <strong>${data.providerName}</strong>,</p>

      <div class="alert-box ${alertClass}">
        <strong>${urgencyText}</strong><br>
        One of your credentialing documents is expiring soon and requires your immediate attention.
      </div>

      <div class="info-box">
        <strong>Document Details:</strong>
        <ul style="margin: 10px 0 0 0;">
          <li><strong>Document Type:</strong> ${data.documentType}</li>
          <li><strong>File Name:</strong> ${data.fileName}</li>
          <li><strong>Expiration Date:</strong> ${data.expirationDate}</li>
          <li><strong style="color: ${isUrgent ? "#dc2626" : "#f59e0b"};">Days Remaining:</strong> ${data.daysUntilExpiration} days</li>
        </ul>
      </div>

      <p>
        To maintain your credentialing status and continue accepting clients, please upload
        an updated version of this document as soon as possible.
      </p>

      <a href="${data.uploadLink}" class="button">Upload Updated Document</a>

      <div class="divider"></div>

      <p style="color: #6b7280; font-size: 14px;">
        <strong>Important:</strong> If this document expires before you upload a new version,
        your credentialing status may be impacted and you may not be able to accept new clients
        until the document is renewed.
      </p>
    </div>
  `;
  return wrapTemplate(content);
}

// 4. Phase Completed
export function renderPhaseCompletedTemplate(data: PhaseCompletedEmailData): string {
  const content = `
    <div class="content">
      <h2>Credentialing Phase Completed 🎯</h2>
      <p>Hello <strong>${data.providerName}</strong>,</p>
      <p>
        Excellent progress! We've completed another phase of your credentialing process.
      </p>

      <div class="info-box">
        <strong>Progress Update:</strong>
        <ul style="margin: 10px 0 0 0;">
          <li><strong>Completed Phase:</strong> ${data.phaseName}</li>
          <li><strong>Completion Date:</strong> ${data.completedDate}</li>
          <li><strong>Overall Progress:</strong> ${data.progressPercentage}%</li>
          ${data.nextPhase ? `<li><strong>Next Phase:</strong> ${data.nextPhase}</li>` : ""}
        </ul>
      </div>

      ${
        data.nextPhase
          ? `
      <p>
        We're now moving forward with <strong>${data.nextPhase}</strong>.
        You'll be notified as we make progress on this phase.
      </p>
      `
          : `
      <p>
        You've completed all credentialing phases! Your application is under final review.
      </p>
      `
      }

      <a href="${data.portalLink}" class="button">View Credentialing Progress</a>

      <div class="alert-box alert-info">
        <strong>📊 Progress Tracker</strong><br>
        Track your credentialing journey and see which phases have been completed in your provider portal.
      </div>
    </div>
  `;
  return wrapTemplate(content);
}

// 5. Credentialing Approved
export function renderCredentialingApprovedTemplate(data: CredentialingApprovedEmailData): string {
  const content = `
    <div class="content">
      <h2 style="color: #059669;">🎉 Credentialing Approved!</h2>
      <p>Hello <strong>${data.providerName}</strong>,</p>
      <p style="font-size: 18px; color: #059669; font-weight: 600;">
        Congratulations! Your credentialing has been approved.
      </p>

      <p>
        You are now officially credentialed with TherapyConnect and can begin accepting
        client appointments through our platform.
      </p>

      <div class="info-box">
        <strong>Approval Details:</strong>
        <ul style="margin: 10px 0 0 0;">
          <li><strong>Approval Date:</strong> ${data.approvalDate}</li>
          <li><strong>Status:</strong> <span style="color: #059669;">Active & Credentialed</span></li>
        </ul>
      </div>

      <div class="divider"></div>

      <h3 style="color: #333; font-size: 18px; margin-top: 25px;">What's Next?</h3>
      <ul>
        ${data.nextSteps.map((step) => `<li>${step}</li>`).join("")}
      </ul>

      <a href="${data.dashboardLink}" class="button">Go to Provider Dashboard</a>

      <div class="alert-box alert-info" style="margin-top: 25px;">
        <strong>📅 Keep Your Credentials Current</strong><br>
        Remember to upload updated documents before they expire to maintain your active status.
        We'll send you reminders when documents are approaching expiration.
      </div>

      <p style="margin-top: 25px; font-size: 16px; color: #333;">
        Welcome to the TherapyConnect provider network! We're excited to have you on board.
      </p>
    </div>
  `;
  return wrapTemplate(content);
}

// 6. Alert Notification
export function renderAlertTemplate(data: AlertEmailData): string {
  const alertClasses = {
    critical: "alert-critical",
    warning: "alert-warning",
    info: "alert-info",
  };

  const alertEmojis = {
    critical: "🚨",
    warning: "⚠️",
    info: "ℹ️",
  };

  const content = `
    <div class="content">
      <h2>${alertEmojis[data.severity]} ${data.alertType}</h2>
      <p>Hello <strong>${data.providerName}</strong>,</p>

      <div class="alert-box ${alertClasses[data.severity]}">
        <strong>${data.severity.toUpperCase()}: ${data.alertType}</strong><br>
        ${data.alertMessage}
      </div>

      ${
        data.actionRequired
          ? `
      <div class="info-box">
        <strong>Action Required:</strong><br>
        ${data.actionRequired}
      </div>
      `
          : ""
      }

      <p>
        Please review this alert and take appropriate action to ensure your credentialing
        status remains in good standing.
      </p>

      <a href="${data.portalLink}" class="button">View Alert Details</a>

      ${
        data.severity === "critical"
          ? `
      <div class="divider"></div>
      <p style="color: #dc2626; font-weight: 600;">
        ⚠️ This is a critical alert that requires immediate attention. Failure to address
        this issue may impact your ability to accept new clients.
      </p>
      `
          : ""
      }
    </div>
  `;
  return wrapTemplate(content);
}

// 7. Welcome Email
export function renderWelcomeTemplate(data: WelcomeEmailData): string {
  const content = `
    <div class="content">
      <h2>Welcome to TherapyConnect Credentialing! 👋</h2>
      <p>Hello <strong>${data.providerName}</strong>,</p>
      <p>
        Welcome to TherapyConnect! We're excited to begin the credentialing process with you.
      </p>

      <p>
        Credentialing ensures that all providers on our platform meet the highest standards
        of professional qualifications and compliance. This process typically takes 2-4 weeks
        to complete.
      </p>

      <div class="info-box">
        <strong>Your Account Details:</strong>
        <ul style="margin: 10px 0 0 0;">
          <li><strong>Email:</strong> ${data.email}</li>
          <li><strong>Support Contact:</strong> ${data.supportEmail}</li>
        </ul>
      </div>

      <div class="divider"></div>

      <h3 style="color: #333; font-size: 18px;">Getting Started - Next Steps:</h3>
      <ol style="padding-left: 20px;">
        ${data.nextSteps.map((step) => `<li style="margin: 12px 0;">${step}</li>`).join("")}
      </ol>

      <a href="${data.portalLink}" class="button">Access Your Credentialing Portal</a>

      <div class="alert-box alert-info" style="margin-top: 25px;">
        <strong>💡 Pro Tip</strong><br>
        Upload all required documents at once to expedite your credentialing process.
        Make sure all documents are current and have at least 60 days before expiration.
      </div>

      <div class="divider"></div>

      <h3 style="color: #333; font-size: 18px;">Required Documents:</h3>
      <ul>
        <li>Professional License</li>
        <li>Graduate Transcript</li>
        <li>Diploma/Degree</li>
        <li>Government ID</li>
        <li>Liability Insurance</li>
        <li>DEA Certificate (if applicable)</li>
        <li>Board Certification (if applicable)</li>
      </ul>

      <p style="margin-top: 25px;">
        If you have any questions during the credentialing process, don't hesitate to reach out
        to our support team at <a href="mailto:${data.supportEmail}" style="color: #667eea;">${data.supportEmail}</a>.
      </p>

      <p style="margin-top: 25px; font-size: 16px; color: #333;">
        We look forward to having you as part of the TherapyConnect provider network!
      </p>
    </div>
  `;
  return wrapTemplate(content);
}
