/**
 * AWS Secrets Manager Integration
 *
 * Fetches sensitive configuration from AWS Secrets Manager in production (AWS ECS)
 * Falls back to environment variables for local development
 *
 * HIPAA Compliance: Secrets are never logged or exposed in error messages
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandOutput
} from "@aws-sdk/client-secrets-manager";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

/**
 * Application secrets structure
 * All sensitive configuration values
 */
export interface AppSecrets {
  DATABASE_URL: string;
  ENCRYPTION_KEY: string;
  SESSION_SECRET: string;
  AWS_REGION?: string;
  NODE_ENV: string;
}

/**
 * Secrets Manager client singleton
 */
let secretsClient: SecretsManagerClient | null = null;

/**
 * SSM (Systems Manager Parameter Store) client singleton
 */
let ssmClient: SSMClient | null = null;

/**
 * Initialize AWS Secrets Manager client
 * Only created when running in AWS (not local development)
 */
function getSecretsClient(): SecretsManagerClient {
  if (!secretsClient) {
    secretsClient = new SecretsManagerClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
  }
  return secretsClient;
}

/**
 * Initialize AWS SSM client for Parameter Store
 */
function getSSMClient(): SSMClient {
  if (!ssmClient) {
    ssmClient = new SSMClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
  }
  return ssmClient;
}

/**
 * Check if running in AWS environment
 * AWS ECS sets these environment variables automatically
 */
function isAWSEnvironment(): boolean {
  return !!(
    process.env.AWS_EXECUTION_ENV ||
    process.env.ECS_CONTAINER_METADATA_URI ||
    process.env.AWS_SECRET_NAME
  );
}

/**
 * Fetch parameter from AWS Systems Manager Parameter Store
 * @param paramName - Name of the parameter (e.g., /karematch/database-url)
 * @returns Parameter value or null on error
 */
async function fetchParameterFromSSM(paramName: string): Promise<string | null> {
  try {
    const client = getSSMClient();
    const command = new GetParameterCommand({
      Name: paramName,
      WithDecryption: true,
    });

    const response = await client.send(command);
    return response.Parameter?.Value || null;
  } catch (error) {
    console.error(`Failed to fetch parameter ${paramName}:`, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

/**
 * Fetch secret from AWS Secrets Manager
 * @param secretName - Name of the secret in AWS Secrets Manager
 * @returns Parsed secret object or null on error
 */
async function fetchSecretFromAWS(secretName: string): Promise<Record<string, string> | null> {
  try {
    const client = getSecretsClient();
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    const response: GetSecretValueCommandOutput = await client.send(command);

    // Secrets can be stored as SecretString (JSON) or SecretBinary
    if (response.SecretString) {
      return JSON.parse(response.SecretString);
    } else if (response.SecretBinary) {
      // Decode binary secret (rare, but supported)
      const buff = Buffer.from(response.SecretBinary);
      const decodedBinarySecret = buff.toString("utf-8");
      return JSON.parse(decodedBinarySecret);
    }

    console.error("Secret has no SecretString or SecretBinary");
    return null;
  } catch (error) {
    // HIPAA: Do NOT log secret values or detailed error messages in production
    console.error("Failed to fetch secret from AWS Secrets Manager:", {
      secretName,
      error: error instanceof Error ? error.message : "Unknown error",
      isAWS: isAWSEnvironment(),
    });
    return null;
  }
}

/**
 * Load secrets from environment variables (local development)
 * @returns Secrets object from process.env
 */
function loadSecretsFromEnv(): AppSecrets {
  return {
    DATABASE_URL: process.env.DATABASE_URL || "",
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || "",
    SESSION_SECRET: process.env.SESSION_SECRET || "",
    AWS_REGION: process.env.AWS_REGION,
    NODE_ENV: process.env.NODE_ENV || "development",
  };
}

/**
 * Validate that all required secrets are present
 * @param secrets - Secrets object to validate
 * @throws Error if required secrets are missing
 */
function validateSecrets(secrets: AppSecrets): void {
  const required: (keyof AppSecrets)[] = [
    "DATABASE_URL",
    "ENCRYPTION_KEY",
    "SESSION_SECRET",
  ];

  const missing = required.filter((key) => !secrets[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required secrets: ${missing.join(", ")}. ` +
      `Check AWS Secrets Manager or .env file.`
    );
  }

  // Validate encryption key length (must be 32 bytes for AES-256)
  if (secrets.ENCRYPTION_KEY.length < 32) {
    throw new Error(
      "ENCRYPTION_KEY must be at least 32 characters for AES-256-GCM encryption"
    );
  }
}

/**
 * Main function: Load application secrets
 *
 * Decision tree:
 * 1. If USE_PARAMETER_STORE is true → Fetch from AWS Parameter Store
 * 2. Else if AWS_SECRET_NAME is set → Fetch from AWS Secrets Manager
 * 3. Else → Load from process.env (local development)
 *
 * @returns Application secrets
 * @throws Error if secrets are invalid or missing
 */
export async function loadSecrets(): Promise<AppSecrets> {
  const secretName = process.env.AWS_SECRET_NAME;
  const useParameterStore = process.env.USE_PARAMETER_STORE === "true";
  const isAWS = isAWSEnvironment();

  console.log("Loading secrets...", {
    environment: process.env.NODE_ENV,
    isAWS,
    useParameterStore,
    hasSecretName: !!secretName,
  });

  let secrets: AppSecrets;

  if (isAWS && useParameterStore) {
    // OPTION 1: AWS Parameter Store (Lightsail setup)
    console.log("Fetching secrets from AWS Systems Manager Parameter Store");

    const [databaseUrl, sessionSecret, encryptionKey] = await Promise.all([
      fetchParameterFromSSM("/karematch/database-url"),
      fetchParameterFromSSM("/karematch/session-secret"),
      fetchParameterFromSSM("/karematch/encryption-key"),
    ]);

    if (!databaseUrl || !sessionSecret || !encryptionKey) {
      throw new Error(
        "Failed to load one or more parameters from Parameter Store. " +
        "Check IAM permissions and parameter names."
      );
    }

    secrets = {
      DATABASE_URL: databaseUrl,
      SESSION_SECRET: sessionSecret,
      ENCRYPTION_KEY: encryptionKey,
      AWS_REGION: process.env.AWS_REGION,
      NODE_ENV: process.env.NODE_ENV || "production",
    };

    console.log("✅ Successfully loaded secrets from Parameter Store");

  } else if (isAWS && secretName) {
    // OPTION 2: AWS Secrets Manager (original code)
    console.log(`Fetching secrets from AWS Secrets Manager: ${secretName}`);
    const awsSecrets = await fetchSecretFromAWS(secretName);

    if (!awsSecrets) {
      throw new Error(
        "Failed to load secrets from AWS Secrets Manager. " +
        "Application cannot start without valid configuration."
      );
    }

    secrets = {
      DATABASE_URL: awsSecrets.DATABASE_URL || "",
      ENCRYPTION_KEY: awsSecrets.ENCRYPTION_KEY || "",
      SESSION_SECRET: awsSecrets.SESSION_SECRET || "",
      AWS_REGION: awsSecrets.AWS_REGION || process.env.AWS_REGION,
      NODE_ENV: process.env.NODE_ENV || "production",
    };

    console.log("✅ Successfully loaded secrets from Secrets Manager");

  } else {
    // Local development: Use environment variables
    console.log("Loading secrets from environment variables (local mode)");
    secrets = loadSecretsFromEnv();
  }

  // Validate all required secrets are present and valid
  validateSecrets(secrets);

  // Set process.env so other modules can access
  process.env.DATABASE_URL = secrets.DATABASE_URL;
  process.env.SESSION_SECRET = secrets.SESSION_SECRET;
  process.env.ENCRYPTION_KEY = secrets.ENCRYPTION_KEY;

  console.log("✅ Secrets loaded and validated");

  return secrets;
}
