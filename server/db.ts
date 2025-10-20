import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

/**
 * Check if running in AWS environment
 * AWS RDS requires SSL connections for HIPAA compliance
 */
const isAWSEnvironment = !!(
  process.env.AWS_EXECUTION_ENV ||
  process.env.ECS_CONTAINER_METADATA_URI ||
  process.env.AWS_SECRET_NAME
);

/**
 * Database client and connection state
 */
let client: postgres.Sql | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

/**
 * Get or create database connection
 * This delays connection until first use, preventing startup crashes
 */
export function getDb() {
  if (!dbInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    console.log("Initializing database connection...");
    console.log("AWS Environment:", isAWSEnvironment);

    /**
     * PostgreSQL connection configuration
     * - AWS RDS: Use SSL without strict certificate validation
     * - Local: No SSL required
     */
    client = postgres(process.env.DATABASE_URL, {
      ssl: isAWSEnvironment
        ? {
            // Use SSL for AWS RDS but don't reject self-signed certs
            rejectUnauthorized: false,
          }
        : false, // Local development: no SSL

      // Connection pool settings optimized for db.t4g.micro
      max: 5,                    // Max 5 connections per container
      idle_timeout: 60,          // Close idle connections after 60s
      max_lifetime: 60 * 30,     // Recycle connections every 30 min
      connect_timeout: 10,       // 10s connection timeout

      // Performance optimizations
      fetch_types: false,        // Faster startup
      prepare: false,            // Disable prepared statements (more resilient)

      // Connection health checks
      connection: {
        application_name: 'karematch',
      },

      // Error handling
      onnotice: () => {},        // Suppress NOTICE messages
      debug: false,

      // Reconnection callback
      onclose: async function(conn_id) {
        console.warn(`Database connection ${conn_id} closed, will reconnect automatically`);
      },
    });

    dbInstance = drizzle(client, { schema });

    // Store client reference for graceful shutdown
    (global as any).__dbClient = client;

    console.log("✅ Database connection initialized");
  }

  return dbInstance;
}

/**
 * Get the raw postgres client for graceful shutdown
 */
export function getDbClient() {
  return client;
}

/**
 * Backward compatible export using Proxy
 * This allows existing code to work while delaying actual connection
 */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  }
});
