import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import multer from "multer";
import {
  insertTherapistSchema,
  insertUserSchema,
  chatMessages,
  chatConversations,
  chatEscalations,
  therapists,
  credentialingVerifications,
  credentialingNotes,
  credentialingAlerts,
  credentialingDocuments,
} from "@shared/schema";
import type { TherapistFilters } from "./storage";
import { initializeConversation, processUserResponse, getConversationContext } from "./services/stateMachine";
import { getSavedMatches } from "./services/therapistMatcher";
import { db } from "./db";
import { eq, desc, or, and } from "drizzle-orm";
import { trackingHelpers } from "./middleware/analyticsMiddleware";
import { getLocationFromRequest } from "./services/ipGeolocation";
import { trackPageView, trackLocationSearch } from "./services/analytics";
import * as analyticsQueries from "./services/analyticsQueries";
import * as therapistAnalytics from "./services/therapistAnalytics";
import * as businessIntelligence from "./services/businessIntelligence";
import { verifyNPI, searchNPI } from "./services/npiVerification";
import { validateDEANumber } from "./services/deaValidation";
import { checkOIGExclusion, updateOIGDatabase, getOIGStats } from "./services/oigSamCheck";
import {
  initializeCredentialing,
  runAutomatedVerifications,
  getCredentialingProgress,
  completeCredentialingPhase,
} from "./services/credentialingService";
import { documentStorage, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "./services/documentStorage";
import * as credentialingNotifications from "./services/credentialingNotifications";
import blogRoutes from "./routes/blog";

declare module 'express-session' {
  interface SessionData {
    userId: string;
    role: string;
  }
}

export function registerRoutes(app: Express): void {
  // Session store configuration
  const PgSession = connectPgSimple(session);

  // Check if running in AWS (requires SSL for RDS HIPAA compliance)
  const isAWSEnvironment = !!(
    process.env.AWS_EXECUTION_ENV ||
    process.env.ECS_CONTAINER_METADATA_URI ||
    process.env.AWS_SECRET_NAME
  );

  // Lazy session store initialization
  let sessionStore: session.Store | undefined;
  let sessionStoreInitialized = false;

  const getSessionStore = (): session.Store | undefined => {
    if (process.env.NODE_ENV !== "production") {
      return undefined; // Use MemoryStore in development
    }

    if (!sessionStoreInitialized) {
      try {
        console.log("Initializing PostgreSQL session store...");

        sessionStore = new PgSession({
          conObject: {
            connectionString: process.env.DATABASE_URL,
            ssl: isAWSEnvironment ? { rejectUnauthorized: false } : false,
            // Connection pool settings for session store
            max: 3,                     // Max 3 connections for session store
            min: 1,
            idleTimeoutMillis: 60000,   // 60s
            connectionTimeoutMillis: 10000,
          },
          tableName: 'session',
          createTableIfMissing: true,
          // Error handling
          errorLog: (error: Error) => {
            console.error("Session store error:", error.message);
          },
        });

        sessionStoreInitialized = true;
        console.log("✅ Session store initialized");

      } catch (error) {
        console.error("❌ Failed to initialize session store:", error);
        // Fall back to MemoryStore (will work but won't persist across restarts)
        console.warn("⚠️  Falling back to MemoryStore - sessions won't persist!");
        sessionStore = undefined;
        sessionStoreInitialized = true;  // Don't retry
      }
    }

    return sessionStore;
  };

  // Session middleware with lazy store initialization
  app.use(
    session({
      store: getSessionStore(),
      secret: process.env.SESSION_SECRET || "karematch-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );

  // Middleware to check if user is authenticated
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  // Middleware to check if user is admin
  const requireAdmin = async (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const isAdmin = await storage.isAdmin(req.session.userId);
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }
    next();
  };

  // ============================================
  // DIAGNOSTIC TEST ROUTE
  // ============================================
  app.get("/api/test-scheduling-routes", (req: Request, res: Response) => {
    res.json({
      success: true,
      message: "Scheduling routes are loaded and working!",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown"
    });
  });

  // ============================================
  // PUBLIC ROUTES
  // ============================================

  // Get all approved therapists with filters
  app.get("/api/therapists", async (req: Request, res: Response) => {
    try {
      console.log('[THERAPIST SEARCH] Query params:', JSON.stringify(req.query));

      const filters: TherapistFilters = {
        // New separate location fields
        street: req.query.street as string,
        city: req.query.city as string,
        state: req.query.state as string,
        zipCode: req.query.zipCode as string,
        // Old location field for backward compatibility
        location: req.query.location as string,
        radius: req.query.radius ? parseInt(req.query.radius as string) : undefined,
        specialties: req.query.specialties ? (req.query.specialties as string).split(',') : undefined,
        sessionTypes: req.query.sessionTypes ? (req.query.sessionTypes as string).split(',') : undefined,
        modalities: req.query.modalities ? (req.query.modalities as string).split(',') : undefined,
        ageGroups: req.query.ageGroups ? (req.query.ageGroups as string).split(',') : undefined,
        insurance: req.query.insurance ? (req.query.insurance as string).split(',') : undefined,
        communities: req.query.communities ? (req.query.communities as string).split(',') : undefined,
        priceMin: req.query.priceMin ? parseInt(req.query.priceMin as string) : undefined,
        priceMax: req.query.priceMax ? parseInt(req.query.priceMax as string) : undefined,
        acceptingNewClients: req.query.acceptingNewClients === 'true',

        // NEW FILTERS - Phase 1: Core Matching
        gender: req.query.gender ? (req.query.gender as string).split(',') : undefined,
        certifications: req.query.certifications ? (req.query.certifications as string).split(',') : undefined,
        sessionLengths: req.query.sessionLengths ? (req.query.sessionLengths as string).split(',') : undefined,
        availableImmediately: req.query.availableImmediately === 'true',

        // NEW FILTERS - Phase 2: Accessibility
        wheelchairAccessible: req.query.wheelchairAccessible === 'true',
        aslCapable: req.query.aslCapable === 'true',
        serviceAnimalFriendly: req.query.serviceAnimalFriendly === 'true',
        virtualPlatforms: req.query.virtualPlatforms ? (req.query.virtualPlatforms as string).split(',') : undefined,

        // NEW FILTERS - Phase 3: Financial
        consultationOffered: req.query.consultationOffered === 'true',
        superbillProvided: req.query.superbillProvided === 'true',
        fsaHsaAccepted: req.query.fsaHsaAccepted === 'true',

        sortBy: req.query.sortBy as string,
      };

      const therapists = await storage.getAllTherapists(filters);
      res.json(therapists);
    } catch (error) {
      console.error("Error fetching therapists:", error);
      res.status(500).json({ error: "Failed to fetch therapists" });
    }
  });

  // Get single therapist profile
  app.get("/api/therapists/:id", async (req: Request, res: Response) => {
    try {
      const therapist = await storage.getTherapistById(req.params.id);

      if (!therapist) {
        return res.status(404).json({ error: "Therapist not found" });
      }

      // Only return approved profiles to public
      if (therapist.profileStatus !== 'approved') {
        return res.status(404).json({ error: "Therapist not found" });
      }

      // Increment profile views
      await storage.incrementProfileViews(req.params.id);

      res.json(therapist);
    } catch (error) {
      console.error("Error fetching therapist:", error);
      res.status(500).json({ error: "Failed to fetch therapist" });
    }
  });

  // Location autocomplete search
  app.get("/api/locations/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      const stateFilter = req.query.state as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      console.log('[LOCATION SEARCH] Query:', query, 'State:', stateFilter, 'Limit:', limit);

      if (!query || query.length < 2) {
        console.log('[LOCATION SEARCH] Query too short, returning empty');
        return res.json([]);
      }

      // Search therapist locations directly (cities where we have therapists)
      const { sql } = await import('drizzle-orm');
      const lowerQuery = `%${query.toLowerCase()}%`;

      let sqlQuery;
      if (stateFilter && stateFilter.length === 2) {
        sqlQuery = sql`
          SELECT DISTINCT city, state, zip_code as zip
          FROM therapists
          WHERE LOWER(city) LIKE ${lowerQuery}
          AND state = ${stateFilter}
          ORDER BY city
          LIMIT ${limit}
        `;
      } else {
        sqlQuery = sql`
          SELECT DISTINCT city, state, zip_code as zip
          FROM therapists
          WHERE LOWER(city) LIKE ${lowerQuery}
          ORDER BY city
          LIMIT ${limit}
        `;
      }

      const results = await db.execute(sqlQuery);
      console.log('[LOCATION SEARCH] Results type:', typeof results, 'Keys:', Object.keys(results).join(','));
      console.log('[LOCATION SEARCH] Has rows?', !!results.rows, 'Length:', results.rows?.length || 0);

      res.json(results.rows || results);
    } catch (error) {
      console.error("Error searching locations:", error);
      res.status(500).json({ error: "Failed to search locations" });
    }
  });

  // ============================================
  // IP GEOLOCATION ROUTES
  // ============================================

  // Get user location from IP address (no permission required)
  app.get("/api/ip-location", async (req: Request, res: Response) => {
    try {
      const result = await getLocationFromRequest(req);

      if (!result.success) {
        // Return 200 with success: false for client-side fallback handling
        return res.json(result);
      }

      res.json(result);
    } catch (error) {
      console.error("[API] Error in /api/ip-location:", error);
      res.status(500).json({
        success: false,
        method: 'ip_geolocation',
        error: "Internal server error",
      });
    }
  });

  // ============================================
  // AUTHENTICATION ROUTES
  // ============================================

  // Signup
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        role: 'therapist',
      });

      // Set session
      req.session.userId = user.id;
      req.session.role = user.role;

      // Track registration event (non-blocking)
      trackingHelpers.trackRegistration(user.id, user.role).catch(error => {
        console.error("Failed to track registration:", error);
      });

      res.json({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      console.error("Error during signup:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Set session
      req.session.userId = user.id;
      req.session.role = user.role;

      // Track login event (non-blocking)
      trackingHelpers.trackLogin(user.id, user.role).catch(error => {
        console.error("Failed to track login:", error);
      });

      res.json({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ error: "Failed to log in" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const userId = req.session.userId;

    // Track logout event before destroying session (non-blocking)
    if (userId) {
      trackingHelpers.trackLogout(userId).catch(error => {
        console.error("Failed to track logout:", error);
      });
    }

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUserById(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, newPassword } = req.body;

      // Validate input
      if (!email || !newPassword) {
        return res.status(400).json({ error: "Email and new password are required" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User with this email not found" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await storage.updateUserPassword(user.id, hashedPassword);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // ============================================
  // THERAPIST ROUTES (Authenticated)
  // ============================================

  // Get own profile
  app.get("/api/therapist/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      const therapist = await storage.getTherapistByUserId(req.session.userId!);
      
      if (!therapist) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.json(therapist);
    } catch (error) {
      console.error("Error fetching therapist profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Create profile
  app.post("/api/therapist/profile", requireAuth, async (req: Request, res: Response) => {
    try {
      // Check if profile already exists
      const existingProfile = await storage.getTherapistByUserId(req.session.userId!);
      if (existingProfile) {
        return res.status(400).json({ error: "Profile already exists" });
      }

      const therapist = await storage.createTherapist({
        ...req.body,
        userId: req.session.userId!,
        profileStatus: 'pending',
      });

      res.json(therapist);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  // Update profile
  app.put("/api/therapist/profile/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const therapist = await storage.getTherapistById(req.params.id);

      if (!therapist) {
        return res.status(404).json({ error: "Profile not found" });
      }

      // Check ownership
      if (therapist.userId !== req.session.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Sanitize the request body - remove timestamp fields that should not be updated by client
      const { createdAt, updatedAt, lastLogin, id, userId, ...updateData } = req.body;

      const updated = await storage.updateTherapist(req.params.id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Submit profile for review
  app.post("/api/therapist/profile/submit", requireAuth, async (req: Request, res: Response) => {
    try {
      const therapist = await storage.getTherapistByUserId(req.session.userId!);
      
      if (!therapist) {
        return res.status(404).json({ error: "Profile not found" });
      }

      // Validate required fields
      if (!therapist.firstName || !therapist.lastName || !therapist.email || 
          !therapist.city || !therapist.state || !therapist.zipCode || 
          !therapist.licenseNumber || !therapist.licenseState) {
        return res.status(400).json({ error: "Please complete all required fields" });
      }

      const updated = await storage.updateTherapist(therapist.id, {
        profileStatus: 'pending',
      });

      res.json(updated);
    } catch (error) {
      console.error("Error submitting profile:", error);
      res.status(500).json({ error: "Failed to submit profile" });
    }
  });

  // ============================================
  // ADMIN ROUTES
  // ============================================

  // Get all therapists (admin only)
  app.get("/api/admin/therapists", requireAdmin, async (req: Request, res: Response) => {
    try {
      const therapists = await storage.getAllTherapists({});
      res.json(therapists);
    } catch (error) {
      console.error("Error fetching therapists:", error);
      res.status(500).json({ error: "Failed to fetch therapists" });
    }
  });

  // Get pending therapists (admin only)
  app.get("/api/admin/therapists/pending", requireAdmin, async (req: Request, res: Response) => {
    try {
      const therapists = await storage.getPendingTherapists();
      res.json(therapists);
    } catch (error) {
      console.error("Error fetching pending therapists:", error);
      res.status(500).json({ error: "Failed to fetch pending therapists" });
    }
  });

  // Approve therapist (admin only)
  app.post("/api/admin/therapists/:id/approve", requireAdmin, async (req: Request, res: Response) => {
    try {
      const therapist = await storage.approveTherapist(req.params.id);

      // Send credentialing approved email (non-blocking)
      credentialingNotifications.sendCredentialingApprovedNotification(
        therapist.id
      ).catch(err => console.error("Error sending approval notification:", err));

      res.json(therapist);
    } catch (error) {
      console.error("Error approving therapist:", error);
      res.status(500).json({ error: "Failed to approve therapist" });
    }
  });

  // Reject therapist (admin only)
  app.post("/api/admin/therapists/:id/reject", requireAdmin, async (req: Request, res: Response) => {
    try {
      const therapist = await storage.rejectTherapist(req.params.id);
      res.json(therapist);
    } catch (error) {
      console.error("Error rejecting therapist:", error);
      res.status(500).json({ error: "Failed to reject therapist" });
    }
  });

  // ============================================
  // CREDENTIALING ROUTES
  // ============================================

  // PUBLIC CREDENTIALING ROUTES (for provider self-service)

  // Verify NPI (public - providers can verify their NPI before signup)
  app.post("/api/credentialing/verify-npi", async (req: Request, res: Response) => {
    try {
      const { npiNumber } = req.body;

      if (!npiNumber) {
        return res.status(400).json({ error: "NPI number is required" });
      }

      const result = await verifyNPI(npiNumber);
      res.json(result);
    } catch (error) {
      console.error("Error verifying NPI:", error);
      res.status(500).json({ error: "Failed to verify NPI" });
    }
  });

  // Save verified NPI to therapist profile (authenticated therapist only)
  app.post("/api/therapist/credentialing/save-npi", requireAuth, async (req: Request, res: Response) => {
    console.log("[SAVE-NPI] Route handler called!");
    console.log("[SAVE-NPI] Session userId:", req.session.userId);
    console.log("[SAVE-NPI] Request body:", req.body);

    try {
      const userId = req.session.userId;
      if (!userId) {
        console.log("[SAVE-NPI] ERROR: No userId in session");
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { npiNumber, verificationData } = req.body;

      if (!npiNumber) {
        return res.status(400).json({ error: "NPI number is required" });
      }

      // First verify the NPI
      const verificationResult = await verifyNPI(npiNumber);

      if (!verificationResult.valid) {
        return res.status(400).json({
          error: verificationResult.error || "NPI verification failed"
        });
      }

      // Get therapist record
      const therapist = await db.query.therapists.findFirst({
        where: eq(therapists.userId, userId),
      });

      if (!therapist) {
        return res.status(404).json({ error: "Therapist profile not found" });
      }

      // Update therapist NPI
      await db
        .update(therapists)
        .set({
          npiNumber: npiNumber,
          updatedAt: new Date(),
        })
        .where(eq(therapists.userId, userId));

      // Save verification record
      await db.insert(credentialingVerifications).values({
        therapistId: therapist.id,
        verificationType: 'npi',
        status: 'verified',
        verificationDate: new Date(),
        verificationSource: 'CMS NPI Registry',
        verificationData: JSON.stringify(verificationResult),
        notes: `Verified: ${verificationResult.name}`,
      });

      // Initialize credentialing if not started
      console.log('[SAVE-NPI] Checking credentialing status:', therapist.credentialingStatus);
      if (!therapist.credentialingStatus || therapist.credentialingStatus === 'not_started') {
        console.log('[SAVE-NPI] Initializing credentialing...');
        await initializeCredentialing(therapist.id);
        console.log('[SAVE-NPI] ✅ Credentialing initialized');
      }

      // Mark NPI verification phase as complete
      console.log('[SAVE-NPI] Marking NPI phase as complete...');
      await completeCredentialingPhase(
        therapist.id,
        'npi_verification',
        `NPI ${npiNumber} verified successfully: ${verificationResult.name}`
      );
      console.log('[SAVE-NPI] ✅ NPI phase completed');

      // Update therapist credentialing status
      console.log('[SAVE-NPI] Updating status to in_progress...');
      await db
        .update(therapists)
        .set({
          credentialingStatus: 'in_progress',
          lastCredentialingUpdate: new Date(),
        })
        .where(eq(therapists.id, therapist.id));
      console.log('[SAVE-NPI] ✅ Status updated');

      res.json({
        success: true,
        message: "NPI saved successfully",
        npiNumber,
        verificationResult
      });
    } catch (error) {
      console.error("Error saving NPI:", error);
      res.status(500).json({ error: "Failed to save NPI" });
    }
  });

  // Search NPI by name (public)
  app.get("/api/credentialing/search-npi", async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, city, state } = req.query;

      const results = await searchNPI({
        firstName: firstName as string,
        lastName: lastName as string,
        city: city as string,
        state: state as string,
        limit: 10,
      });

      res.json(results);
    } catch (error) {
      console.error("Error searching NPI:", error);
      res.status(500).json({ error: "Failed to search NPI" });
    }
  });

  // Validate DEA format (public)
  app.post("/api/credentialing/validate-dea", async (req: Request, res: Response) => {
    try {
      const { deaNumber, lastName } = req.body;

      if (!deaNumber) {
        return res.status(400).json({ error: "DEA number is required" });
      }

      const result = validateDEANumber(deaNumber, lastName);
      res.json(result);
    } catch (error) {
      console.error("Error validating DEA:", error);
      res.status(500).json({ error: "Failed to validate DEA" });
    }
  });

  // PROVIDER CREDENTIALING ROUTES (authenticated providers only)

  // Get own credentialing status
  app.get("/api/therapist/credentialing/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const therapist = await storage.getTherapistByUserId(req.session.userId!);

      if (!therapist) {
        return res.status(404).json({ error: "Therapist profile not found" });
      }

      const progress = await getCredentialingProgress(therapist.id);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching credentialing status:", error);
      res.status(500).json({ error: "Failed to fetch credentialing status" });
    }
  });

  // Initialize credentialing for own profile
  app.post("/api/therapist/credentialing/initialize", requireAuth, async (req: Request, res: Response) => {
    try {
      const therapist = await storage.getTherapistByUserId(req.session.userId!);

      if (!therapist) {
        return res.status(404).json({ error: "Therapist profile not found" });
      }

      // Check if already initialized
      if (therapist.credentialingStatus && therapist.credentialingStatus !== 'not_started') {
        return res.status(400).json({ error: "Credentialing already initialized" });
      }

      await initializeCredentialing(therapist.id);
      const progress = await getCredentialingProgress(therapist.id);

      res.json(progress);
    } catch (error) {
      console.error("Error initializing credentialing:", error);
      res.status(500).json({ error: "Failed to initialize credentialing" });
    }
  });

  // Configure multer for file uploads (memory storage for processing before saving)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_FILE_TYPES[file.mimetype as keyof typeof ALLOWED_FILE_TYPES]) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Allowed: PDF, JPG, PNG, GIF, DOC, DOCX'));
      }
    },
  });

  // Upload credentialing document
  app.post("/api/therapist/credentialing/upload", requireAuth, upload.single('document'), async (req: Request, res: Response) => {
    try {
      const therapist = await storage.getTherapistByUserId(req.session.userId!);

      if (!therapist) {
        return res.status(404).json({ error: "Therapist profile not found" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { documentType, expirationDate, notes } = req.body;

      if (!documentType) {
        return res.status(400).json({ error: "Document type is required" });
      }

      // Upload file to storage
      const uploadResult = await documentStorage.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        therapist.id
      );

      // Save document record to database
      const [document] = await db.insert(credentialingDocuments).values({
        therapistId: therapist.id,
        documentType,
        fileName: req.file.originalname,
        fileUrl: uploadResult.fileUrl,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        uploadedBy: req.session.userId!,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        notes: notes || null,
      }).returning();

      // Send upload confirmation email (non-blocking)
      credentialingNotifications.sendDocumentUploadNotification(
        therapist.id,
        documentType,
        req.file.originalname
      ).catch(err => console.error("Error sending upload notification:", err));

      // Check if credentialing should be initialized
      // If therapist has uploaded documents but credentialing hasn't started, update status
      const uploadedDocs = await db
        .select()
        .from(credentialingDocuments)
        .where(eq(credentialingDocuments.therapistId, therapist.id));

      if (uploadedDocs.length >= 1 && (!therapist.credentialingStatus || therapist.credentialingStatus === 'not_started')) {
        console.log(`[Document Upload] Therapist ${therapist.id} has uploaded ${uploadedDocs.length} documents. Updating status to documents_pending.`);
        await db
          .update(therapists)
          .set({
            credentialingStatus: 'documents_pending',
            lastCredentialingUpdate: new Date(),
          })
          .where(eq(therapists.id, therapist.id));
      }

      res.json({
        success: true,
        document,
        message: "Document uploaded successfully",
      });
    } catch (error: any) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: error.message || "Failed to upload document" });
    }
  });

  // List own credentialing documents
  app.get("/api/therapist/credentialing/documents", requireAuth, async (req: Request, res: Response) => {
    try {
      const therapist = await storage.getTherapistByUserId(req.session.userId!);

      if (!therapist) {
        return res.status(404).json({ error: "Therapist profile not found" });
      }

      const documents = await db
        .select()
        .from(credentialingDocuments)
        .where(eq(credentialingDocuments.therapistId, therapist.id))
        .orderBy(desc(credentialingDocuments.uploadedAt));

      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Delete own credentialing document
  app.delete("/api/therapist/credentialing/documents/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const therapist = await storage.getTherapistByUserId(req.session.userId!);

      if (!therapist) {
        return res.status(404).json({ error: "Therapist profile not found" });
      }

      const documentId = req.params.id;

      // Get document to verify ownership and get file URL
      const [document] = await db
        .select()
        .from(credentialingDocuments)
        .where(
          and(
            eq(credentialingDocuments.id, documentId),
            eq(credentialingDocuments.therapistId, therapist.id)
          )
        );

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Don't allow deletion of verified documents
      if (document.verified) {
        return res.status(403).json({ error: "Cannot delete verified documents" });
      }

      // Delete file from storage
      await documentStorage.deleteFile(document.fileUrl, therapist.id);

      // Delete database record
      await db
        .delete(credentialingDocuments)
        .where(eq(credentialingDocuments.id, documentId));

      res.json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Download/view credentialing document
  app.get("/api/credentialing/documents/:id/download", requireAuth, async (req: Request, res: Response) => {
    try {
      const documentId = req.params.id;

      // Get document
      const [document] = await db
        .select()
        .from(credentialingDocuments)
        .where(eq(credentialingDocuments.id, documentId));

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Check authorization: therapist can download own documents, admin can download any
      const isAdmin = req.session.role === 'admin' || req.session.role === 'super_admin';
      const therapist = await storage.getTherapistByUserId(req.session.userId!);
      const isOwner = therapist && therapist.id === document.therapistId;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({ error: "Unauthorized to access this document" });
      }

      // Get file from storage
      const fileBuffer = await documentStorage.getFile(document.fileUrl);

      // Set headers for download
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Content-Length', fileBuffer.length);

      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ error: "Failed to download document" });
    }
  });

  // ADMIN CREDENTIALING ROUTES

  // Get all providers pending credentialing
  app.get("/api/admin/credentialing/pending", requireAdmin, async (req: Request, res: Response) => {
    try {
      const pendingProviders = await db
        .select()
        .from(therapists)
        .where(
          or(
            eq(therapists.credentialingStatus, 'documents_pending'),
            eq(therapists.credentialingStatus, 'under_review')
          )
        );

      res.json(pendingProviders);
    } catch (error) {
      console.error("Error fetching pending credentialing:", error);
      res.status(500).json({ error: "Failed to fetch pending providers" });
    }
  });

  // Get credentialing details for a provider
  app.get("/api/admin/credentialing/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const therapist = await storage.getTherapistById(req.params.id);

      if (!therapist) {
        return res.status(404).json({ error: "Therapist not found" });
      }

      const progress = await getCredentialingProgress(req.params.id);

      // Get all verifications
      const verifications = await db
        .select()
        .from(credentialingVerifications)
        .where(eq(credentialingVerifications.therapistId, req.params.id));

      // Get all notes
      const notes = await db
        .select()
        .from(credentialingNotes)
        .where(eq(credentialingNotes.therapistId, req.params.id))
        .orderBy(desc(credentialingNotes.createdAt));

      // Get all alerts
      const alerts = await db
        .select()
        .from(credentialingAlerts)
        .where(eq(credentialingAlerts.therapistId, req.params.id))
        .orderBy(desc(credentialingAlerts.createdAt));

      res.json({
        therapist,
        progress,
        verifications,
        notes,
        alerts,
      });
    } catch (error) {
      console.error("Error fetching credentialing details:", error);
      res.status(500).json({ error: "Failed to fetch credentialing details" });
    }
  });

  // Run automated verifications for a provider
  app.post("/api/admin/credentialing/:id/verify-automated", requireAdmin, async (req: Request, res: Response) => {
    try {
      const results = await runAutomatedVerifications(req.params.id);
      res.json(results);
    } catch (error) {
      console.error("Error running automated verifications:", error);
      res.status(500).json({ error: "Failed to run verifications" });
    }
  });

  // Manually verify NPI for a provider
  app.post("/api/admin/credentialing/:id/verify-npi", requireAdmin, async (req: Request, res: Response) => {
    try {
      const therapist = await storage.getTherapistById(req.params.id);

      if (!therapist || !therapist.npiNumber) {
        return res.status(400).json({ error: "Provider has no NPI number" });
      }

      const result = await verifyNPI(therapist.npiNumber);

      // Save verification result
      if (result.valid) {
        await db.insert(credentialingVerifications).values({
          therapistId: req.params.id,
          verificationType: 'npi',
          status: 'verified',
          verificationDate: new Date(),
          verifiedBy: req.session.userId!,
          verificationSource: 'CMS NPI Registry API',
          verificationData: JSON.stringify(result),
          notes: `Manually verified by admin: ${result.name}`,
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Error verifying NPI:", error);
      res.status(500).json({ error: "Failed to verify NPI" });
    }
  });

  // Complete a credentialing phase
  app.post("/api/admin/credentialing/:id/complete-phase", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { phase, notes } = req.body;

      if (!phase) {
        return res.status(400).json({ error: "Phase is required" });
      }

      await completeCredentialingPhase(req.params.id, phase, notes);
      const progress = await getCredentialingProgress(req.params.id);

      // Send phase completed email (non-blocking)
      const phaseOrder = [
        'document_review', 'npi_verification', 'license_verification',
        'education_verification', 'background_check', 'insurance_verification',
        'oig_sam_check', 'final_review'
      ];
      const currentPhaseIndex = phaseOrder.indexOf(phase);
      const nextPhase = currentPhaseIndex >= 0 && currentPhaseIndex < phaseOrder.length - 1
        ? phaseOrder[currentPhaseIndex + 1]
        : null;

      const progressPercentage = progress.completedPhases && progress.totalPhases
        ? Math.round((progress.completedPhases / progress.totalPhases) * 100)
        : 0;

      credentialingNotifications.sendPhaseCompletedNotification(
        req.params.id,
        phase,
        nextPhase,
        progressPercentage
      ).catch(err => console.error("Error sending phase completed notification:", err));

      res.json(progress);
    } catch (error) {
      console.error("Error completing phase:", error);
      res.status(500).json({ error: "Failed to complete phase" });
    }
  });

  // Add a credentialing note
  app.post("/api/admin/credentialing/:id/notes", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { note, noteType, isInternal } = req.body;

      if (!note) {
        return res.status(400).json({ error: "Note content is required" });
      }

      const newNote = await db.insert(credentialingNotes).values({
        therapistId: req.params.id,
        authorId: req.session.userId!,
        note,
        noteType: noteType || 'general',
        isInternal: isInternal !== false, // default true
      }).returning();

      res.json(newNote[0]);
    } catch (error) {
      console.error("Error adding note:", error);
      res.status(500).json({ error: "Failed to add note" });
    }
  });

  // Get documents for a specific provider (admin can view any provider's documents)
  app.get("/api/admin/credentialing/:id/documents", requireAdmin, async (req: Request, res: Response) => {
    try {
      const therapistId = req.params.id;

      // Verify therapist exists
      const therapist = await storage.getTherapistById(therapistId);
      if (!therapist) {
        return res.status(404).json({ error: "Therapist not found" });
      }

      const documents = await db
        .select()
        .from(credentialingDocuments)
        .where(eq(credentialingDocuments.therapistId, therapistId))
        .orderBy(desc(credentialingDocuments.uploadedAt));

      res.json(documents);
    } catch (error) {
      console.error("Error fetching provider documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Verify/approve a document (admin only)
  app.post("/api/admin/credentialing/documents/:id/verify", requireAdmin, async (req: Request, res: Response) => {
    try {
      const documentId = req.params.id;
      const { verified, notes } = req.body;

      const [updatedDocument] = await db
        .update(credentialingDocuments)
        .set({
          verified: verified !== false,
          verifiedAt: verified !== false ? new Date() : null,
          verifiedBy: verified !== false ? req.session.userId! : null,
          notes: notes || null,
        })
        .where(eq(credentialingDocuments.id, documentId))
        .returning();

      if (!updatedDocument) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Send document verified email (non-blocking, only if verified)
      if (verified !== false) {
        const admin = await storage.getUserById(req.session.userId!);
        const adminName = admin ? `${admin.email}` : "Admin Team";

        credentialingNotifications.sendDocumentVerifiedNotification(
          updatedDocument.therapistId,
          updatedDocument.documentType,
          updatedDocument.fileName,
          adminName
        ).catch(err => console.error("Error sending verification notification:", err));
      }

      res.json({
        success: true,
        document: updatedDocument,
        message: verified !== false ? "Document verified" : "Document verification removed",
      });
    } catch (error) {
      console.error("Error verifying document:", error);
      res.status(500).json({ error: "Failed to verify document" });
    }
  });

  // Get all credentialing alerts (admin overview)
  app.get("/api/admin/credentialing/alerts", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { resolved, severity } = req.query;

      let query = db.select().from(credentialingAlerts);

      if (resolved !== undefined) {
        query = query.where(eq(credentialingAlerts.resolved, resolved === 'true'));
      }

      if (severity) {
        query = query.where(eq(credentialingAlerts.severity, severity as string));
      }

      const alerts = await query.orderBy(desc(credentialingAlerts.createdAt)).limit(100);

      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // Resolve an alert
  app.post("/api/admin/credentialing/alerts/:id/resolve", requireAdmin, async (req: Request, res: Response) => {
    try {
      await db
        .update(credentialingAlerts)
        .set({
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: req.session.userId!,
        })
        .where(eq(credentialingAlerts.id, req.params.id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ error: "Failed to resolve alert" });
    }
  });

  // OIG Database Management

  // Get OIG database stats
  app.get("/api/admin/credentialing/oig/stats", requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await getOIGStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching OIG stats:", error);
      res.status(500).json({ error: "Failed to fetch OIG stats" });
    }
  });

  // Manually trigger OIG database update
  app.post("/api/admin/credentialing/oig/update", requireAdmin, async (req: Request, res: Response) => {
    try {
      console.log("[Admin] Manually triggered OIG database update");
      const result = await updateOIGDatabase();
      res.json(result);
    } catch (error) {
      console.error("Error updating OIG database:", error);
      res.status(500).json({ error: "Failed to update OIG database" });
    }
  });

  // Check a specific provider against OIG
  app.post("/api/admin/credentialing/:id/check-oig", requireAdmin, async (req: Request, res: Response) => {
    try {
      const therapist = await storage.getTherapistById(req.params.id);

      if (!therapist) {
        return res.status(404).json({ error: "Therapist not found" });
      }

      const result = await checkOIGExclusion(
        therapist.firstName,
        therapist.lastName,
        therapist.npiNumber || undefined
      );

      // Save result
      await db.insert(credentialingVerifications).values({
        therapistId: req.params.id,
        verificationType: 'oig',
        status: result.matched ? 'failed' : 'verified',
        verificationDate: new Date(),
        verifiedBy: req.session.userId!,
        verificationSource: 'OIG LEIE Database',
        verificationData: JSON.stringify(result),
        nextCheckDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        notes: result.matched
          ? `EXCLUDED: ${result.exclusion?.exclusionType}`
          : 'No match found in OIG exclusion list',
      });

      res.json(result);
    } catch (error) {
      console.error("Error checking OIG:", error);
      res.status(500).json({ error: "Failed to check OIG exclusion" });
    }
  });

  // ============================================
  // ANALYTICS ROUTES (Admin Only)
  // ============================================

  // Get summary statistics
  app.get("/api/admin/analytics/summary", requireAdmin, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const stats = await analyticsQueries.getSummaryStats(dateRange);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching summary stats:", error);
      res.status(500).json({ error: "Failed to fetch summary statistics" });
    }
  });

  // Get top cities
  app.get("/api/admin/analytics/top-cities", requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const cities = await analyticsQueries.getTopCities(limit, dateRange);
      res.json(cities);
    } catch (error) {
      console.error("Error fetching top cities:", error);
      res.status(500).json({ error: "Failed to fetch top cities" });
    }
  });

  // Get location method stats
  app.get("/api/admin/analytics/location-methods", requireAdmin, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const stats = await analyticsQueries.getLocationMethodStats(dateRange);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching location method stats:", error);
      res.status(500).json({ error: "Failed to fetch location method statistics" });
    }
  });

  // Get underserved markets
  app.get("/api/admin/analytics/underserved-markets", requireAdmin, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const markets = await analyticsQueries.getUnderservedMarkets(dateRange);
      res.json(markets);
    } catch (error) {
      console.error("Error fetching underserved markets:", error);
      res.status(500).json({ error: "Failed to fetch underserved markets" });
    }
  });

  // Get daily visitor trends
  app.get("/api/admin/analytics/visitor-trends", requireAdmin, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const trends = await analyticsQueries.getDailyVisitorTrends({ startDate, endDate });
      res.json(trends);
    } catch (error) {
      console.error("Error fetching visitor trends:", error);
      res.status(500).json({ error: "Failed to fetch visitor trends" });
    }
  });

  // Get daily search trends
  app.get("/api/admin/analytics/search-trends", requireAdmin, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const trends = await analyticsQueries.getDailySearchTrends({ startDate, endDate });
      res.json(trends);
    } catch (error) {
      console.error("Error fetching search trends:", error);
      res.status(500).json({ error: "Failed to fetch search trends" });
    }
  });

  // Get search patterns by city
  app.get("/api/admin/analytics/search-patterns", requireAdmin, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const patterns = await analyticsQueries.getSearchPatternsByCity(dateRange);
      res.json(patterns);
    } catch (error) {
      console.error("Error fetching search patterns:", error);
      res.status(500).json({ error: "Failed to fetch search patterns" });
    }
  });

  // Get device and browser stats
  app.get("/api/admin/analytics/devices", requireAdmin, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const stats = await analyticsQueries.getDeviceStats(dateRange);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching device stats:", error);
      res.status(500).json({ error: "Failed to fetch device statistics" });
    }
  });

  // Get traffic sources
  app.get("/api/admin/analytics/traffic-sources", requireAdmin, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const sources = await analyticsQueries.getTrafficSources(dateRange);
      res.json(sources);
    } catch (error) {
      console.error("Error fetching traffic sources:", error);
      res.status(500).json({ error: "Failed to fetch traffic sources" });
    }
  });

  // Get geographic distribution
  app.get("/api/admin/analytics/geography", requireAdmin, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const geography = await analyticsQueries.getVisitorsByGeography(dateRange);
      res.json(geography);
    } catch (error) {
      console.error("Error fetching geography data:", error);
      res.status(500).json({ error: "Failed to fetch geography data" });
    }
  });

  // Get filter usage stats
  app.get("/api/admin/analytics/filter-usage", requireAdmin, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const stats = await analyticsQueries.getFilterUsageStats(dateRange);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching filter usage stats:", error);
      res.status(500).json({ error: "Failed to fetch filter usage statistics" });
    }
  });

  // ============================================
  // THERAPIST ANALYTICS ROUTES
  // ============================================

  // Get therapist distribution by state/city
  app.get("/api/admin/analytics/therapists/distribution", requireAdmin, async (req: Request, res: Response) => {
    try {
      const state = req.query.state as string;
      const city = req.query.city as string;
      const distribution = await therapistAnalytics.getTherapistDistribution(state, city);
      const totalCount = distribution.reduce((sum, d) => sum + Number(d.totalTherapists), 0);
      console.error(`[DIST-API] Returned ${distribution.length} groups, ${totalCount} total therapists`);
      res.json(distribution);
    } catch (error) {
      console.error("[DIST-API] Error:", error);
      res.status(500).json({ error: "Failed to fetch therapist distribution" });
    }
  });

  // Get therapy types breakdown
  app.get("/api/admin/analytics/therapists/therapy-types", requireAdmin, async (req: Request, res: Response) => {
    try {
      const breakdown = await therapistAnalytics.getTherapyTypeBreakdown();
      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching therapy types:", error);
      res.status(500).json({ error: "Failed to fetch therapy types" });
    }
  });

  // Get specializations breakdown
  app.get("/api/admin/analytics/therapists/specializations", requireAdmin, async (req: Request, res: Response) => {
    try {
      const breakdown = await therapistAnalytics.getSpecializationBreakdown();
      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching specializations:", error);
      res.status(500).json({ error: "Failed to fetch specializations" });
    }
  });

  // Get top performing therapists
  app.get("/api/admin/analytics/therapists/top-performers", requireAdmin, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const performers = await therapistAnalytics.getTopPerformers(dateRange, limit);
      res.json(performers);
    } catch (error) {
      console.error("Error fetching top performers:", error);
      res.status(500).json({ error: "Failed to fetch top performers" });
    }
  });

  // Get low engagement therapists
  app.get("/api/admin/analytics/therapists/low-engagement", requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const therapists = await therapistAnalytics.getLowEngagementTherapists(limit);
      res.json(therapists);
    } catch (error) {
      console.error("Error fetching low engagement therapists:", error);
      res.status(500).json({ error: "Failed to fetch low engagement therapists" });
    }
  });

  // Get booking performance
  app.get("/api/admin/analytics/therapists/booking-performance", requireAdmin, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const performance = await therapistAnalytics.getBookingPerformance(dateRange);
      res.json(performance);
    } catch (error) {
      console.error("Error fetching booking performance:", error);
      res.status(500).json({ error: "Failed to fetch booking performance" });
    }
  });

  // Get growth metrics
  app.get("/api/admin/analytics/therapists/growth", requireAdmin, async (req: Request, res: Response) => {
    try {
      const metrics = await therapistAnalytics.getGrowthMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching growth metrics:", error);
      res.status(500).json({ error: "Failed to fetch growth metrics" });
    }
  });

  // Get therapists by region (drill-down)
  app.get("/api/admin/analytics/therapists/by-region", requireAdmin, async (req: Request, res: Response) => {
    try {
      const state = req.query.state as string;
      const city = req.query.city as string;

      if (!state) {
        return res.status(400).json({ error: "State is required" });
      }

      const therapists = await therapistAnalytics.getTherapistsByRegion(state, city);
      res.json(therapists);
    } catch (error) {
      console.error("Error fetching therapists by region:", error);
      res.status(500).json({ error: "Failed to fetch therapists by region" });
    }
  });

  // ============================================
  // BUSINESS INTELLIGENCE ROUTES
  // ============================================

  // Get supply vs demand analysis
  app.get("/api/admin/analytics/business/supply-demand", requireAdmin, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const analysis = await businessIntelligence.getSupplyDemandAnalysis(dateRange);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching supply demand analysis:", error);
      res.status(500).json({ error: "Failed to fetch supply demand analysis" });
    }
  });

  // Get insurance coverage gaps
  app.get("/api/admin/analytics/business/insurance-gaps", requireAdmin, async (req: Request, res: Response) => {
    try {
      const gaps = await businessIntelligence.getInsuranceCoverageGaps();
      res.json(gaps);
    } catch (error) {
      console.error("Error fetching insurance gaps:", error);
      res.status(500).json({ error: "Failed to fetch insurance coverage gaps" });
    }
  });

  // Get conversion funnel
  app.get("/api/admin/analytics/business/conversion-funnel", requireAdmin, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const funnel = await businessIntelligence.getConversionFunnel(dateRange);
      res.json(funnel);
    } catch (error) {
      console.error("Error fetching conversion funnel:", error);
      res.status(500).json({ error: "Failed to fetch conversion funnel" });
    }
  });

  // Get search effectiveness
  app.get("/api/admin/analytics/business/search-effectiveness", requireAdmin, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const effectiveness = await businessIntelligence.getSearchEffectiveness(dateRange);
      res.json(effectiveness);
    } catch (error) {
      console.error("Error fetching search effectiveness:", error);
      res.status(500).json({ error: "Failed to fetch search effectiveness" });
    }
  });

  // Get pricing insights
  app.get("/api/admin/analytics/business/pricing", requireAdmin, async (req: Request, res: Response) => {
    try {
      const insights = await businessIntelligence.getPricingInsights();
      res.json(insights);
    } catch (error) {
      console.error("Error fetching pricing insights:", error);
      res.status(500).json({ error: "Failed to fetch pricing insights" });
    }
  });

  // Get user behavior patterns
  app.get("/api/admin/analytics/business/user-behavior", requireAdmin, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const dateRange = startDate && endDate ? { startDate, endDate } : undefined;

      const patterns = await businessIntelligence.getUserBehaviorPatterns(dateRange);
      res.json(patterns);
    } catch (error) {
      console.error("Error fetching user behavior patterns:", error);
      res.status(500).json({ error: "Failed to fetch user behavior patterns" });
    }
  });

  // ============================================
  // APPOINTMENT SCHEDULING ROUTES
  // ============================================

  // Therapist Availability Management (Authenticated)
  app.get("/api/therapist/availability", requireAuth, async (req: Request, res: Response) => {
    try {
      const availability = await storage.getAvailability(req.session.userId!);
      res.json(availability);
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ error: "Failed to fetch availability" });
    }
  });

  app.post("/api/therapist/availability", requireAuth, async (req: Request, res: Response) => {
    try {
      const availability = await storage.createAvailability({
        therapistId: req.session.userId!,
        ...req.body
      });
      res.json(availability);
    } catch (error) {
      console.error("Error creating availability:", error);
      res.status(500).json({ error: "Failed to create availability" });
    }
  });

  app.put("/api/therapist/availability/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const availability = await storage.updateAvailability(req.params.id, req.body);
      res.json(availability);
    } catch (error) {
      console.error("Error updating availability:", error);
      res.status(500).json({ error: "Failed to update availability" });
    }
  });

  app.delete("/api/therapist/availability/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteAvailability(req.params.id);
      res.json({ message: "Availability deleted successfully" });
    } catch (error) {
      console.error("Error deleting availability:", error);
      res.status(500).json({ error: "Failed to delete availability" });
    }
  });

  // Therapist Booking Settings (Authenticated)
  app.get("/api/therapist/booking-settings", requireAuth, async (req: Request, res: Response) => {
    try {
      let settings = await storage.getBookingSettings(req.session.userId!);

      // Create default settings if they don't exist
      if (!settings) {
        settings = await storage.createBookingSettings({
          therapistId: req.session.userId!,
          bookingMode: 'instant'
        });
      }

      res.json(settings);
    } catch (error) {
      console.error("Error fetching booking settings:", error);
      res.status(500).json({ error: "Failed to fetch booking settings" });
    }
  });

  app.put("/api/therapist/booking-settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const settings = await storage.updateBookingSettings(req.session.userId!, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating booking settings:", error);
      res.status(500).json({ error: "Failed to update booking settings" });
    }
  });

  // Therapist Appointments Management (Authenticated)
  app.get("/api/therapist/appointments", requireAuth, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const appointments = await storage.getAppointments(req.session.userId!, status);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.put("/api/therapist/appointments/:id/approve", requireAuth, async (req: Request, res: Response) => {
    try {
      const appointment = await storage.updateAppointmentStatus(req.params.id, 'confirmed');
      res.json(appointment);
    } catch (error) {
      console.error("Error approving appointment:", error);
      res.status(500).json({ error: "Failed to approve appointment" });
    }
  });

  app.put("/api/therapist/appointments/:id/reject", requireAuth, async (req: Request, res: Response) => {
    try {
      const appointment = await storage.updateAppointmentStatus(req.params.id, 'cancelled');
      res.json(appointment);
    } catch (error) {
      console.error("Error rejecting appointment:", error);
      res.status(500).json({ error: "Failed to reject appointment" });
    }
  });

  app.put("/api/therapist/appointments/:id/cancel", requireAuth, async (req: Request, res: Response) => {
    try {
      const appointment = await storage.cancelAppointment(req.params.id);
      res.json(appointment);
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      res.status(500).json({ error: "Failed to cancel appointment" });
    }
  });

  // Therapist Blocked Time Management (Authenticated)
  app.post("/api/therapist/blocked-time", requireAuth, async (req: Request, res: Response) => {
    try {
      const blocked = await storage.createBlockedTime({
        therapistId: req.session.userId!,
        ...req.body
      });
      res.json(blocked);
    } catch (error) {
      console.error("Error creating blocked time:", error);
      res.status(500).json({ error: "Failed to create blocked time" });
    }
  });

  app.get("/api/therapist/blocked-time", requireAuth, async (req: Request, res: Response) => {
    try {
      const blocked = await storage.getBlockedTimes(req.session.userId!);
      res.json(blocked);
    } catch (error) {
      console.error("Error fetching blocked times:", error);
      res.status(500).json({ error: "Failed to fetch blocked times" });
    }
  });

  app.delete("/api/therapist/blocked-time/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteBlockedTime(req.params.id);
      res.json({ message: "Blocked time deleted successfully" });
    } catch (error) {
      console.error("Error deleting blocked time:", error);
      res.status(500).json({ error: "Failed to delete blocked time" });
    }
  });

  // Public Appointment Booking Routes (for patients)
  app.get("/api/therapists/:id/available-slots", async (req: Request, res: Response) => {
    try {
      const { date } = req.query;

      if (!date || typeof date !== 'string') {
        return res.status(400).json({ error: "Date parameter is required (YYYY-MM-DD)" });
      }

      const slots = await storage.getAvailableSlots(req.params.id, date);
      res.json(slots);
    } catch (error) {
      console.error("Error fetching available slots:", error);
      res.status(500).json({ error: "Failed to fetch available slots" });
    }
  });

  app.post("/api/therapists/:id/book", async (req: Request, res: Response) => {
    try {
      const therapistId = req.params.id;
      const { patientName, patientEmail, patientPhone, appointmentDate, startTime, endTime, notes } = req.body;

      // Validate required fields
      if (!patientName || !patientEmail || !appointmentDate || !startTime || !endTime) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get therapist's booking settings
      const settings = await storage.getBookingSettings(therapistId);
      const bookingMode = settings?.bookingMode || 'instant';

      // Determine appointment status based on booking mode
      const status = bookingMode === 'instant' ? 'confirmed' : 'pending';

      // Create appointment
      const appointment = await storage.createAppointment({
        therapistId,
        patientName,
        patientEmail,
        patientPhone,
        appointmentDate,
        startTime,
        endTime,
        notes,
        status,
        bookingType: bookingMode
      });

      res.json(appointment);
    } catch (error) {
      console.error("Error booking appointment:", error);
      res.status(500).json({ error: "Failed to book appointment" });
    }
  });

  app.get("/api/appointments/:id", async (req: Request, res: Response) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);

      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      res.json(appointment);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({ error: "Failed to fetch appointment" });
    }
  });

  // ============================================
  // CHATBOT API ROUTES
  // ============================================

  /**
   * Initialize a new chat conversation
   * POST /api/chat/start
   */
  app.post("/api/chat/start", async (req: Request, res: Response) => {
    try {
      const sessionId = req.sessionID;
      const userId = req.session.userId; // Optional - user may not be logged in

      const conversationId = await initializeConversation(sessionId, userId);

      // Get initial messages
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, conversationId))
        .orderBy(chatMessages.createdAt);

      res.json({
        conversationId,
        messages,
        stage: 'welcome',
      });
    } catch (error) {
      console.error("Error starting conversation:", error);
      res.status(500).json({ error: "Failed to start conversation" });
    }
  });

  /**
   * Send a message in the conversation
   * POST /api/chat/message
   */
  app.post("/api/chat/message", async (req: Request, res: Response) => {
    try {
      const { conversationId, content } = req.body;

      if (!conversationId || !content) {
        return res.status(400).json({ error: "conversationId and content are required" });
      }

      // Get current conversation
      const [conversation] = await db
        .select()
        .from(chatConversations)
        .where(eq(chatConversations.id, conversationId))
        .limit(1);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Save user message
      await db.insert(chatMessages).values({
        conversationId,
        sender: 'user',
        content,
      });

      // Process message and get bot response
      const result = await processUserResponse(conversationId, content, conversation.stage);

      // Save bot response
      const [botMessage] = await db.insert(chatMessages).values(result.botResponse).returning();

      res.json({
        userMessage: { conversationId, sender: 'user', content },
        botMessage,
        nextStage: result.nextStage || conversation.stage,
        crisisDetected: result.crisisDetected,
        shouldEscalate: result.shouldEscalate,
      });
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  /**
   * Get conversation history
   * GET /api/chat/conversation/:id
   */
  app.get("/api/chat/conversation/:id", async (req: Request, res: Response) => {
    try {
      const conversationId = req.params.id;

      const [conversation] = await db
        .select()
        .from(chatConversations)
        .where(eq(chatConversations.id, conversationId))
        .limit(1);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, conversationId))
        .orderBy(chatMessages.createdAt);

      const context = await getConversationContext(conversationId);

      // Get therapist matches if conversation reached matching stage
      let therapistMatches = [];
      if (conversation.stage === 'matching') {
        try {
          therapistMatches = await getSavedMatches(conversationId);
        } catch (error) {
          console.error("Error fetching therapist matches:", error);
          // Don't fail the whole request if matches fail
        }
      }

      res.json({
        conversation,
        messages,
        preferences: context.preferences,
        therapistMatches,
      });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  /**
   * Request human escalation
   * POST /api/chat/escalate
   */
  app.post("/api/chat/escalate", async (req: Request, res: Response) => {
    try {
      const { conversationId, reason } = req.body;

      if (!conversationId) {
        return res.status(400).json({ error: "conversationId is required" });
      }

      // Log escalation
      await db.insert(chatEscalations).values({
        conversationId,
        escalationType: 'human_request',
        triggerMessage: reason || 'User requested human assistance',
        actionTaken: 'notified_staff',
        staffNotified: true,
        staffNotifiedAt: new Date(),
      });

      // Update conversation
      await db
        .update(chatConversations)
        .set({ escalationRequested: true, updatedAt: new Date() })
        .where(eq(chatConversations.id, conversationId));

      // TODO: Send email/Slack notification to staff
      console.log(`[ESCALATION] Conversation ${conversationId} escalated to human staff`);

      res.json({
        success: true,
        message: 'A team member has been notified and will reach out shortly.',
      });
    } catch (error) {
      console.error("Error escalating conversation:", error);
      res.status(500).json({ error: "Failed to escalate conversation" });
    }
  });

  /**
   * Get escalations (admin only)
   * GET /api/chat/escalations
   */
  app.get("/api/chat/escalations", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const escalations = await db
        .select()
        .from(chatEscalations)
        .orderBy(desc(chatEscalations.createdAt))
        .limit(100);

      res.json(escalations);
    } catch (error) {
      console.error("Error fetching escalations:", error);
      res.status(500).json({ error: "Failed to fetch escalations" });
    }
  });

  // ============================================
  // BLOG ROUTES
  // ============================================
  app.use("/api/blog", blogRoutes);
}
