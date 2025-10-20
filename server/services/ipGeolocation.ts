/**
 * IP Geolocation Service using MaxMind GeoLite2
 * Detects user location from IP address (city-level accuracy)
 * Fallback for browser geolocation when permission denied
 */

import maxmind, { CityResponse, Reader } from 'maxmind';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

export interface IPLocationResult {
  success: boolean;
  method: 'ip_geolocation';
  location?: {
    country: string;
    country_code: string;
    region: string;
    city: string;
    postal_code?: string;
    latitude: number;
    longitude: number;
    timezone?: string;
    accuracy: 'city';
  };
  error?: string;
  ip?: string;
}

let geoipReader: Reader<CityResponse> | null = null;
let initializationError: Error | null = null;

/**
 * Initialize MaxMind GeoIP2 database reader
 * Should be called once on server startup
 */
export async function initializeGeoIP(): Promise<void> {
  try {
    const dbPath = process.env.GEOIP_DATABASE_PATH ||
                   path.join(process.cwd(), 'server', 'data', 'GeoLite2-City.mmdb');

    console.log('[GeoIP] Initializing MaxMind GeoLite2 database...');
    console.log('[GeoIP] Database path:', dbPath);

    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      const error = new Error(
        `GeoLite2 database not found at ${dbPath}. ` +
        'Please download from MaxMind (see docs/setup/GEOIP_SETUP.md)'
      );
      console.error('[GeoIP] ❌', error.message);
      initializationError = error;
      return;
    }

    // Open the database
    geoipReader = await maxmind.open<CityResponse>(dbPath);
    console.log('[GeoIP] ✅ Database loaded successfully');
    initializationError = null;

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[GeoIP] ❌ Failed to initialize:', err.message);
    initializationError = err;
    geoipReader = null;
  }
}

/**
 * Extract real IP address from request
 * Handles proxies, load balancers, and Cloudflare
 */
export function extractIPFromRequest(req: Request): string {
  // Check common headers in order of preference
  const headers = [
    'cf-connecting-ip',      // Cloudflare
    'x-real-ip',             // Nginx proxy
    'x-forwarded-for',       // Standard proxy header
    'x-client-ip',           // Apache
    'x-cluster-client-ip',   // Rackspace LB
    'x-forwarded',
    'forwarded-for',
    'forwarded',
  ];

  for (const header of headers) {
    const value = req.headers[header];
    if (value) {
      // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2)
      // First IP is the original client
      const ip = Array.isArray(value) ? value[0] : value.split(',')[0].trim();
      if (ip && !isPrivateIP(ip)) {
        return ip;
      }
    }
  }

  // Fallback to socket address
  const socketIP = req.socket.remoteAddress || req.ip || '';

  // Remove IPv6 prefix if present (::ffff:192.168.1.1 -> 192.168.1.1)
  const cleanIP = socketIP.replace(/^::ffff:/, '');

  return cleanIP;
}

/**
 * Check if IP is private/local (not routable on internet)
 */
function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  const privateRanges = [
    /^127\./,                    // Loopback
    /^10\./,                     // Private Class A
    /^172\.(1[6-9]|2\d|3[01])\./, // Private Class B
    /^192\.168\./,               // Private Class C
    /^169\.254\./,               // Link-local
    /^::1$/,                     // IPv6 loopback
    /^fe80:/,                    // IPv6 link-local
    /^fc00:/,                    // IPv6 private
    /^fd00:/,                    // IPv6 private
  ];

  return privateRanges.some(range => range.test(ip));
}

/**
 * Lookup location for an IP address
 */
export async function lookupIP(ip: string): Promise<IPLocationResult> {
  // Check if GeoIP is initialized
  if (!geoipReader) {
    if (initializationError) {
      return {
        success: false,
        method: 'ip_geolocation',
        error: 'GeoIP database not available. Please contact administrator.',
        ip,
      };
    }

    // Try to initialize if not already attempted
    await initializeGeoIP();

    if (!geoipReader) {
      return {
        success: false,
        method: 'ip_geolocation',
        error: 'GeoIP service not initialized',
        ip,
      };
    }
  }

  // Validate IP format
  if (!ip || ip === '' || isPrivateIP(ip)) {
    return {
      success: false,
      method: 'ip_geolocation',
      error: 'Invalid or private IP address',
      ip,
    };
  }

  try {
    // Query the database
    const result = geoipReader.get(ip);

    if (!result || !result.city || !result.location) {
      console.log(`[GeoIP] No data found for IP: ${ip}`);
      return {
        success: false,
        method: 'ip_geolocation',
        error: 'Location not found for this IP address',
        ip,
      };
    }

    // Extract location data
    const location = {
      country: result.country?.names?.en || 'Unknown',
      country_code: result.country?.iso_code || 'XX',
      region: result.subdivisions?.[0]?.names?.en || result.subdivisions?.[0]?.iso_code || '',
      city: result.city.names.en || '',
      postal_code: result.postal?.code,
      latitude: result.location.latitude || 0,
      longitude: result.location.longitude || 0,
      timezone: result.location.time_zone,
      accuracy: 'city' as const,
    };

    console.log(`[GeoIP] ✅ Location found for ${ip}: ${location.city}, ${location.region}`);

    return {
      success: true,
      method: 'ip_geolocation',
      location,
      ip,
    };

  } catch (error) {
    console.error('[GeoIP] Error looking up IP:', error);
    return {
      success: false,
      method: 'ip_geolocation',
      error: error instanceof Error ? error.message : 'Unknown error',
      ip,
    };
  }
}

/**
 * Get location from HTTP request
 * Main entry point for API endpoints
 */
export async function getLocationFromRequest(req: Request): Promise<IPLocationResult> {
  const ip = extractIPFromRequest(req);
  console.log(`[GeoIP] Processing request from IP: ${ip}`);

  return await lookupIP(ip);
}

/**
 * Check if GeoIP service is ready
 */
export function isGeoIPReady(): boolean {
  return geoipReader !== null;
}

/**
 * Get initialization error if any
 */
export function getInitializationError(): Error | null {
  return initializationError;
}
