import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { loadSecrets } from "./lib/secrets";
import { initializeGeoIP } from "./services/ipGeolocation";

const app = express();

// Trust proxy - required for Render to handle HTTPS correctly
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files (credentialing documents)
// Note: In production with S3/Supabase, files are served directly from storage
if (process.env.STORAGE_BACKEND === 'local' || !process.env.STORAGE_BACKEND) {
  const uploadsPath = process.env.UPLOADS_PATH || './uploads';
  app.use('/uploads', express.static(uploadsPath));
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log("=== KareMatch Container Starting ===");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("PORT:", process.env.PORT);
    console.log("AWS_REGION:", process.env.AWS_REGION);
    console.log("USE_PARAMETER_STORE:", process.env.USE_PARAMETER_STORE);
    console.log("Has DATABASE_URL:", !!process.env.DATABASE_URL);
    console.log("Has SESSION_SECRET:", !!process.env.SESSION_SECRET);
    console.log("Has ENCRYPTION_KEY:", !!process.env.ENCRYPTION_KEY);
    console.log("");

    // Load secrets from AWS Parameter Store/Secrets Manager or .env
    // This must happen before any database connections or route registration
    await loadSecrets();
    console.log("✅ Secrets loaded");

    // Initialize IP Geolocation service (non-blocking)
    // Will log warning if database file not found, but won't crash
    initializeGeoIP().catch(err => {
      console.warn("⚠️  GeoIP initialization failed (non-critical):", err.message);
    });

    // Health check endpoint for AWS ECS/ALB and Docker
    // Must respond quickly without database dependencies
    app.get("/health", (_req: Request, res: Response) => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        memory: {
          heapUsed: `${heapUsedMB}MB`,
          heapTotal: `${heapTotalMB}MB`,
          percentage: Math.round((heapUsedMB / 384) * 100) + "%",
        },
      });
    });
    console.log("✅ Health endpoint registered");

  // Register all API routes
  registerRoutes(app);
  console.log("✅ Routes registered");

  // Initialize credentialing automated jobs (cron)
  if (process.env.NODE_ENV === "production" || process.env.ENABLE_CRON_JOBS === "true") {
    const { initializeCredentialingJobs } = await import("./jobs/credentialingJobs");
    initializeCredentialingJobs();
    console.log("✅ Credentialing cron jobs initialized");
  } else {
    console.log("ℹ️  Credentialing cron jobs disabled (set ENABLE_CRON_JOBS=true to enable in dev)");
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Create HTTP server
  const server = createServer(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
    console.log("✅ Vite development server configured");
  } else {
    serveStatic(app);
    console.log("✅ Static files configured");
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });

  // ========== GRACEFUL SHUTDOWN HANDLING ==========

  let isShuttingDown = false;

  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) {
      console.log("Shutdown already in progress...");
      return;
    }

    isShuttingDown = true;
    console.log(`\n${signal} received - starting graceful shutdown`);

    // Stop accepting new requests
    server.close(() => {
      console.log("✅ HTTP server closed");
    });

    try {
      // Close database connections
      const dbClient = (global as any).__dbClient;
      if (dbClient && typeof dbClient.end === 'function') {
        await dbClient.end({ timeout: 5 });
        console.log("✅ Database connections closed");
      }

      console.log("✅ Graceful shutdown complete");
      process.exit(0);

    } catch (error) {
      console.error("❌ Error during shutdown:", error);
      process.exit(1);
    }
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
  });

  } catch (error) {
    console.error("❌ FATAL STARTUP ERROR:", error);
    console.error("Stack:", error instanceof Error ? error.stack : "No stack");
    console.log("Waiting 60s before exit to allow log viewing...");
    setTimeout(() => process.exit(1), 60000);
  }
})();
