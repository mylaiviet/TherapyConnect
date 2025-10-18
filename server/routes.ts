import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import session from "express-session";
import { insertTherapistSchema, insertUserSchema } from "@shared/schema";
import type { TherapistFilters } from "./storage";

declare module 'express-session' {
  interface SessionData {
    userId: string;
    role: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "therapyconnect-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
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
  // PUBLIC ROUTES
  // ============================================

  // Get all approved therapists with filters
  app.get("/api/therapists", async (req: Request, res: Response) => {
    try {
      const filters: TherapistFilters = {
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

      const updated = await storage.updateTherapist(req.params.id, req.body);
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

  const httpServer = createServer(app);

  return httpServer;
}
