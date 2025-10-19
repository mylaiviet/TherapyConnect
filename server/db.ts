import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

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
 * PostgreSQL connection configuration
 * - AWS RDS: Requires SSL with certificate validation
 * - Local: No SSL required
 */
const client = postgres(process.env.DATABASE_URL, {
  ssl: isAWSEnvironment
    ? {
        // Require SSL for AWS RDS
        rejectUnauthorized: true,
        // AWS RDS CA certificates are trusted by default in Node.js
        // No need to specify ca cert file
      }
    : false, // Local development: no SSL
});

export const db = drizzle(client, { schema });
