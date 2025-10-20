# MaxMind GeoLite2 Setup Guide

This guide explains how to set up IP geolocation using MaxMind's free GeoLite2 database.

## Overview

The application uses MaxMind GeoLite2 to automatically detect user location from their IP address. This provides:
- **City-level location accuracy** without requiring browser permission
- **Fallback when GPS is unavailable** or denied
- **Immediate location detection** on page load
- **Free and open-source** solution

## Prerequisites

- Node.js 20+ installed
- Application installed with `npm install`
- Free MaxMind account (no credit card required)

## Step 1: Create MaxMind Account

1. Go to [MaxMind GeoLite2 Signup](https://www.maxmind.com/en/geolite2/signup)
2. Fill out the registration form (free account, no credit card)
3. Verify your email address
4. Log in to your MaxMind account

## Step 2: Generate License Key

1. Once logged in, navigate to "My License Key" in the left sidebar
2. Click "Generate new license key"
3. Name it something like "TherapyConnect Production"
4. Select "No" for "Will this key be used for GeoIP Update?"
5. Click "Confirm"
6. **Save the license key** - you won't be able to see it again!

## Step 3: Download GeoLite2-City Database

### Option A: Manual Download (Recommended for first setup)

1. Go to [Download GeoLite2](https://www.maxmind.com/en/accounts/current/geoip/downloads)
2. Find "GeoLite2 City" in the list
3. Click "Download GZIP" next to "GeoIP2 Binary (.mmdb)"
4. Extract the `.tar.gz` file
5. Inside, you'll find `GeoLite2-City.mmdb` (about 70MB)

### Option B: Using wget/curl (Linux/Mac)

```bash
# Replace YOUR_LICENSE_KEY with your actual license key
wget "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=YOUR_LICENSE_KEY&suffix=tar.gz" -O GeoLite2-City.tar.gz

# Extract the database
tar -xzf GeoLite2-City.tar.gz

# Move to server/data directory
mkdir -p server/data
cp GeoLite2-City_*/GeoLite2-City.mmdb server/data/
```

## Step 4: Place Database File

Move the `GeoLite2-City.mmdb` file to one of these locations:

### Option A: Default location (Recommended)
```bash
# Windows
mkdir server\data
move GeoLite2-City.mmdb server\data\

# Linux/Mac
mkdir -p server/data
mv GeoLite2-City.mmdb server/data/
```

### Option B: Custom location
If you want to store the database elsewhere, set the environment variable:

```bash
# .env file
GEOIP_DATABASE_PATH=/path/to/GeoLite2-City.mmdb
```

## Step 5: Verify Installation

Start your development server:

```bash
npm run dev
```

Look for this log message:
```
[GeoIP] ✅ Database loaded successfully
```

If you see an error instead:
```
[GeoIP] ❌ GeoLite2 database not found at /path/to/file
```

Check that:
1. The file exists at the correct path
2. The filename is exactly `GeoLite2-City.mmdb`
3. The file has read permissions

## Step 6: Test the Endpoint

Once the server is running, test the IP location endpoint:

```bash
# Test from localhost (will return error for private IP)
curl http://localhost:5000/api/ip-location

# Expected response:
{
  "success": false,
  "method": "ip_geolocation",
  "error": "Invalid or private IP address",
  "ip": "127.0.0.1"
}
```

This is expected for localhost! In production with real user IPs, you'll get:

```json
{
  "success": true,
  "method": "ip_geolocation",
  "location": {
    "country": "United States",
    "country_code": "US",
    "region": "California",
    "city": "San Francisco",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "timezone": "America/Los_Angeles",
    "accuracy": "city"
  },
  "ip": "8.8.8.8"
}
```

## Database Updates

MaxMind updates GeoLite2 databases monthly. To stay current:

### Manual Update

1. Download the latest database from MaxMind (see Step 3)
2. Replace the old `GeoLite2-City.mmdb` file
3. Restart the server

### Automated Update (Optional)

Create a script to automate monthly updates:

```bash
#!/bin/bash
# scripts/update-geoip.sh

LICENSE_KEY="YOUR_LICENSE_KEY"
DOWNLOAD_URL="https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=${LICENSE_KEY}&suffix=tar.gz"

# Download latest database
wget -O /tmp/GeoLite2-City.tar.gz "$DOWNLOAD_URL"

# Extract
tar -xzf /tmp/GeoLite2-City.tar.gz -C /tmp

# Replace old database
cp /tmp/GeoLite2-City_*/GeoLite2-City.mmdb server/data/

# Clean up
rm -rf /tmp/GeoLite2-City*

# Restart application (adjust for your deployment)
pm2 restart therapyconnect
```

Add to crontab (runs first day of each month at 2 AM):

```bash
crontab -e

# Add this line:
0 2 1 * * /path/to/scripts/update-geoip.sh
```

## Production Deployment

### AWS/Cloud Deployment

**Option 1: Bake into Docker image**
```dockerfile
# In Dockerfile
COPY server/data/GeoLite2-City.mmdb /app/server/data/
```

**Option 2: Mount as volume**
```yaml
# docker-compose.yml
volumes:
  - ./server/data/GeoLite2-City.mmdb:/app/server/data/GeoLite2-City.mmdb:ro
```

**Option 3: Download on startup**
Add to your deployment script:
```bash
#!/bin/bash
wget "${GEOIP_DOWNLOAD_URL}" -O /tmp/geoip.tar.gz
tar -xzf /tmp/geoip.tar.gz -C /tmp
cp /tmp/GeoLite2-City_*/GeoLite2-City.mmdb /app/server/data/
npm start
```

### Environment Variables

```bash
# Optional: Override default database path
GEOIP_DATABASE_PATH=/custom/path/GeoLite2-City.mmdb
```

## Troubleshooting

### "GeoLite2 database not found"

**Cause:** Database file not at expected location

**Fix:**
1. Verify file exists: `ls -l server/data/GeoLite2-City.mmdb`
2. Check file permissions: `chmod 644 server/data/GeoLite2-City.mmdb`
3. Set custom path in `.env` if needed

### "Invalid or private IP address"

**Cause:** Testing from localhost or internal network

**Fix:** This is expected behavior. In production with real user IPs, it will work correctly.

### "Location not found for this IP address"

**Cause:** IP not in MaxMind database (rare, new IPs)

**Fix:** Application will automatically fall back to manual location entry

### TypeScript errors after installation

**Cause:** Type definitions not loaded

**Fix:**
```bash
npm install --save-dev @types/maxmind
```

## Testing with Real IP Addresses

To test with public IP addresses during development:

1. Use a public IP testing service
2. Or deploy to a staging environment
3. Or use ngrok/localtunnel to expose your dev server

Example test IPs:
- `8.8.8.8` - Google DNS (Mountain View, CA)
- `1.1.1.1` - Cloudflare DNS (Los Angeles, CA)
- `208.67.222.222` - OpenDNS (San Francisco, CA)

## Attribution Requirements

MaxMind requires attribution when using GeoLite2. Add to your footer:

```html
<p>IP geolocation by <a href="https://www.maxmind.com">MaxMind</a></p>
```

Or in your Privacy Policy/About page.

## Privacy & HIPAA Compliance

- IP addresses are **not stored** in the database
- Location data is **session-only** (stored in sessionStorage)
- No PHI linkage unless user books appointment
- Compliant with HIPAA when properly configured

See [docs/compliance/HIPAA_GEOLOCATION.md](../compliance/HIPAA_GEOLOCATION.md) for details.

## License

GeoLite2 is provided under the [Creative Commons Attribution-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/).

## Additional Resources

- [MaxMind GeoLite2 Documentation](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data)
- [MaxMind npm package](https://www.npmjs.com/package/maxmind)
- [GeoIP Update Program](https://github.com/maxmind/geoipupdate) (advanced)

## Support

If you encounter issues:

1. Check MaxMind's [FAQ](https://support.maxmind.com/hc/en-us/categories/1260801446650-GeoLite2-Free-Geolocation-Data)
2. Review application logs: Look for `[GeoIP]` prefixed messages
3. Open an issue in the TherapyConnect repository
