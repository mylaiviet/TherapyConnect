import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// Email configuration interface
interface EmailConfig {
  provider: "smtp" | "sendgrid" | "ses";
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from: string;
  fromName: string;
}

// Email options interface
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
}

// Email template data interfaces
export interface DocumentUploadEmailData {
  providerName: string;
  documentType: string;
  fileName: string;
  uploadDate: string;
  portalLink: string;
}

export interface DocumentVerifiedEmailData {
  providerName: string;
  documentType: string;
  fileName: string;
  verifiedDate: string;
  verifiedBy: string;
  portalLink: string;
}

export interface DocumentExpiringEmailData {
  providerName: string;
  documentType: string;
  fileName: string;
  expirationDate: string;
  daysUntilExpiration: number;
  uploadLink: string;
}

export interface PhaseCompletedEmailData {
  providerName: string;
  phaseName: string;
  completedDate: string;
  nextPhase?: string;
  progressPercentage: number;
  portalLink: string;
}

export interface CredentialingApprovedEmailData {
  providerName: string;
  approvalDate: string;
  nextSteps: string[];
  dashboardLink: string;
}

export interface AlertEmailData {
  providerName: string;
  alertType: string;
  alertMessage: string;
  severity: "critical" | "warning" | "info";
  actionRequired?: string;
  portalLink: string;
}

export interface WelcomeEmailData {
  providerName: string;
  email: string;
  portalLink: string;
  supportEmail: string;
  nextSteps: string[];
}

class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.EMAIL_ENABLED === "true";

    this.config = {
      provider: (process.env.EMAIL_PROVIDER as "smtp" | "sendgrid" | "ses") || "smtp",
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASSWORD || "",
      },
      from: process.env.EMAIL_FROM || "noreply@therapyconnect.com",
      fromName: process.env.EMAIL_FROM_NAME || "TherapyConnect Credentialing",
    };

    if (this.isEnabled) {
      this.initializeTransporter();
    } else {
      console.log("[Email] Email service is disabled (set EMAIL_ENABLED=true to enable)");
    }
  }

  private initializeTransporter(): void {
    try {
      if (this.config.provider === "sendgrid") {
        // SendGrid configuration
        this.transporter = nodemailer.createTransport({
          host: "smtp.sendgrid.net",
          port: 587,
          secure: false,
          auth: {
            user: "apikey",
            pass: this.config.auth.pass, // SendGrid API key
          },
        });
      } else if (this.config.provider === "ses") {
        // AWS SES configuration
        this.transporter = nodemailer.createTransport({
          host: `email-smtp.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com`,
          port: 587,
          secure: false,
          auth: {
            user: this.config.auth.user, // AWS SES SMTP username
            pass: this.config.auth.pass, // AWS SES SMTP password
          },
        });
      } else {
        // Generic SMTP configuration
        this.transporter = nodemailer.createTransport({
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure,
          auth: this.config.auth,
        });
      }

      console.log(`[Email] Email service initialized (provider: ${this.config.provider})`);
    } catch (error) {
      console.error("[Email] Failed to initialize email transporter:", error);
      this.transporter = null;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`[Email] Email disabled - would have sent to ${options.to}: ${options.subject}`);
      return false;
    }

    if (!this.transporter) {
      console.error("[Email] Email transporter not initialized");
      return false;
    }

    try {
      const mailOptions = {
        from: `"${this.config.fromName}" <${this.config.from}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[Email] Sent email to ${options.to}: ${options.subject} (ID: ${info.messageId})`);
      return true;
    } catch (error) {
      console.error(`[Email] Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.isEnabled || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log("[Email] Email service connection verified");
      return true;
    } catch (error) {
      console.error("[Email] Email service connection failed:", error);
      return false;
    }
  }

  // Template-specific email methods
  async sendDocumentUploadEmail(to: string, data: DocumentUploadEmailData): Promise<boolean> {
    const { renderDocumentUploadTemplate } = await import("./emailTemplates");
    const html = renderDocumentUploadTemplate(data);

    return this.sendEmail({
      to,
      subject: `Document Uploaded: ${data.documentType}`,
      html,
    });
  }

  async sendDocumentVerifiedEmail(to: string, data: DocumentVerifiedEmailData): Promise<boolean> {
    const { renderDocumentVerifiedTemplate } = await import("./emailTemplates");
    const html = renderDocumentVerifiedTemplate(data);

    return this.sendEmail({
      to,
      subject: `Document Verified: ${data.documentType}`,
      html,
    });
  }

  async sendDocumentExpiringEmail(to: string, data: DocumentExpiringEmailData): Promise<boolean> {
    const { renderDocumentExpiringTemplate } = await import("./emailTemplates");
    const html = renderDocumentExpiringTemplate(data);

    const urgency = data.daysUntilExpiration <= 30 ? "URGENT" : "REMINDER";

    return this.sendEmail({
      to,
      subject: `${urgency}: ${data.documentType} Expiring in ${data.daysUntilExpiration} Days`,
      html,
    });
  }

  async sendPhaseCompletedEmail(to: string, data: PhaseCompletedEmailData): Promise<boolean> {
    const { renderPhaseCompletedTemplate } = await import("./emailTemplates");
    const html = renderPhaseCompletedTemplate(data);

    return this.sendEmail({
      to,
      subject: `Credentialing Phase Completed: ${data.phaseName}`,
      html,
    });
  }

  async sendCredentialingApprovedEmail(to: string, data: CredentialingApprovedEmailData): Promise<boolean> {
    const { renderCredentialingApprovedTemplate } = await import("./emailTemplates");
    const html = renderCredentialingApprovedTemplate(data);

    return this.sendEmail({
      to,
      subject: "🎉 Credentialing Approved - Welcome to TherapyConnect!",
      html,
    });
  }

  async sendAlertEmail(to: string, data: AlertEmailData): Promise<boolean> {
    const { renderAlertTemplate } = await import("./emailTemplates");
    const html = renderAlertTemplate(data);

    const severityPrefix = data.severity === "critical" ? "URGENT" : data.severity === "warning" ? "ACTION REQUIRED" : "NOTICE";

    return this.sendEmail({
      to,
      subject: `${severityPrefix}: ${data.alertType}`,
      html,
    });
  }

  async sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<boolean> {
    const { renderWelcomeTemplate } = await import("./emailTemplates");
    const html = renderWelcomeTemplate(data);

    return this.sendEmail({
      to,
      subject: "Welcome to TherapyConnect Credentialing",
      html,
    });
  }
}

// Singleton instance
export const emailService = new EmailService();
