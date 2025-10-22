# Credentialing Automation Guide
**Free & Open Source APIs for Credential Verification**

**TherapyConnect Platform**
**Version:** 1.0
**Created:** 2025-10-21

---

## Table of Contents
1. [Automation Feasibility Overview](#automation-feasibility-overview)
2. [Free APIs Available](#free-apis-available)
3. [Paid APIs (Worth Considering)](#paid-apis-worth-considering)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Code Examples](#code-examples)
6. [What Remains Manual](#what-remains-manual)
7. [Hybrid Automation Strategy](#hybrid-automation-strategy)

---

## Automation Feasibility Overview

### ✅ Can Be Fully Automated (Free APIs)

| Verification Type | Automation Level | API Available | Cost |
|------------------|-----------------|---------------|------|
| **NPI Number Verification** | ✅ 100% | Yes - CMS NPI Registry | FREE |
| **OIG Exclusion Check** | ✅ 100% | Yes - OIG LEIE Database | FREE |
| **SAM Exclusion Check** | ✅ 100% | Yes - SAM.gov API | FREE |
| **DEA Number Format Validation** | ✅ 100% | Algorithm-based | FREE |
| **License Expiration Alerts** | ✅ 100% | Date comparison | FREE |
| **Document Upload & Storage** | ✅ 100% | AWS S3, Supabase Storage | FREE tier available |

### ⚠️ Partially Automated (Free with limitations)

| Verification Type | Automation Level | Method | Cost |
|------------------|-----------------|--------|------|
| **State License Verification** | ⚠️ 30-50% | Web scraping (some states) | FREE but fragile |
| **Board Certification** | ⚠️ 20-30% | Web scraping (some boards) | FREE but limited |
| **Nursing License (Nursys)** | ⚠️ 60% | Nursys QuickConfirm (limited free lookups) | FREE tier limited |

### ❌ Requires Manual or Paid Services

| Verification Type | Automation Level | Why | Alternative |
|------------------|-----------------|-----|-------------|
| **Criminal Background Check** | ❌ 0% | Regulated, requires FCRA compliance | Paid: Checkr ($35-50) |
| **Education Verification** | ❌ 0% | No public APIs | Paid: National Student Clearinghouse |
| **Comprehensive License Verification** | ❌ 0% | State boards don't provide APIs | Paid: Verisys, Medallion ($10-30/verification) |
| **DEA Registry Verification** | ❌ 0% | No public API | Manual or Paid service |

---

## Free APIs Available

### 1. NPI Registry API (CMS) ✅ FREE

**What it does:**
- Verifies National Provider Identifier (NPI) numbers
- Returns provider name, credentials, taxonomy, practice locations
- Available for all healthcare providers (physicians, NPs, PAs, therapists)

**API Endpoint:**
```
https://npiregistry.cms.hhs.gov/api/?version=2.1
```

**API Documentation:**
https://npiregistry.cms.hhs.gov/api-page

**Request Example:**
```bash
GET https://npiregistry.cms.hhs.gov/api/?version=2.1&number=1234567890
```

**Response Fields:**
- NPI number
- Provider name (first, last)
- Credentials (MD, DO, LCSW, etc.)
- Taxonomy (specialty)
- Primary practice address
- Other practice locations
- Enumeration date

**Use Cases:**
- Verify provider NPI is valid
- Confirm provider name matches NPI
- Get provider specialty/taxonomy code
- Get practice addresses

**Limitations:**
- Does NOT verify license status (only that NPI exists)
- Does NOT show if provider is actively licensed
- No license expiration dates

**Implementation Priority:** ⭐⭐⭐⭐⭐ HIGH (Easy to implement, very useful)

---

### 2. OIG LEIE Exclusion List ✅ FREE

**What it does:**
- Checks if provider is excluded from federal healthcare programs (Medicare/Medicaid)
- **REQUIRED by federal law** to check monthly
- Downloadable database + monthly updates

**Download URL:**
```
https://oig.hhs.gov/exclusions/downloadables/UPDATED.csv
```

**API Alternative:**
Third-party wrapper: https://github.com/chriscohen/oig-leie (unofficial)

**Data Format:**
- CSV file with all excluded individuals
- Fields: Name, NPI, DOB, Address, Exclusion Date, Reinstatement Date

**Implementation Options:**

**Option 1: Download Database Monthly**
```bash
# Cron job to download monthly
0 0 1 * * wget https://oig.hhs.gov/exclusions/downloadables/UPDATED.csv
```

Then load into your database and query:
```sql
SELECT * FROM oig_exclusions
WHERE lastname = 'Smith' AND firstname = 'John'
```

**Option 2: Use Third-Party API Wrapper**
Some developers have created free API wrappers around the OIG data.

**Use Cases:**
- Check providers during initial credentialing
- Monthly automated re-check of all active providers
- Alert if provider appears on list

**Implications:**
- **Exclusion = Immediate rejection** (federal requirement)
- **Must check monthly** for all active providers

**Implementation Priority:** ⭐⭐⭐⭐⭐ CRITICAL (Legally required)

---

### 3. SAM.gov Exclusions API ✅ FREE

**What it does:**
- Checks System for Award Management (SAM) exclusions
- Federal contractors and healthcare providers
- Free API access (requires registration)

**API Documentation:**
https://open.gsa.gov/api/entity-api/

**Registration:**
https://sam.gov/content/entity-information (Free API key)

**API Endpoint:**
```
https://api.sam.gov/entity-information/v3/exclusions
```

**Request Example:**
```bash
GET https://api.sam.gov/entity-information/v3/exclusions?firstName=John&lastName=Smith&api_key=YOUR_KEY
```

**Response:**
- Exclusion status
- Exclusion type
- Exclusion dates
- Reasons

**Use Cases:**
- Check providers during credentialing
- Monthly automated checks
- Federal contract compliance

**Implementation Priority:** ⭐⭐⭐⭐⭐ CRITICAL (Federal requirement)

---

### 4. Nursys QuickConfirm ⚠️ LIMITED FREE

**What it does:**
- Multi-state nurse license verification
- Verifies RN, LPN, APRN licenses
- Limited free lookups per month

**URL:**
https://www.nursys.com/

**Free Tier:**
- Limited number of free verifications per month
- Web-based lookup (no API)
- Can export results

**Paid Tier:**
- Unlimited lookups
- Bulk verification
- API access (varies by plan)

**Use Cases:**
- Verify nurse practitioner (PMHNP) licenses
- Multi-state license verification
- Initial credentialing

**Limitations:**
- Not all states participate
- Limited free tier
- No official API (web scraping possible but against TOS)

**Implementation Priority:** ⭐⭐⭐ MEDIUM (Useful for NPs, but limited)

---

### 5. State Board Web Scraping ⚠️ FREE but FRAGILE

**What it does:**
- Automate lookups on state licensing board websites
- Extract license status, expiration dates, discipline info

**Method:**
- Use web scraping libraries (Puppeteer, Playwright, BeautifulSoup)
- Simulate searches on state board websites
- Parse HTML results

**Example - California Board of Behavioral Sciences:**
```javascript
// Using Puppeteer
const puppeteer = require('puppeteer');

async function verifyCaliforniaLicense(licenseNumber) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://search.dca.ca.gov/');

  // Fill in search form
  await page.type('#licenseNumber', licenseNumber);
  await page.click('#searchButton');

  // Wait for results
  await page.waitForSelector('.results');

  // Extract data
  const data = await page.evaluate(() => {
    return {
      name: document.querySelector('.licensee-name').textContent,
      status: document.querySelector('.license-status').textContent,
      expiration: document.querySelector('.expiration-date').textContent,
    };
  });

  await browser.close();
  return data;
}
```

**Pros:**
- Free
- Can verify licenses in real-time
- Works for many states

**Cons:**
- **Fragile** - breaks when websites change
- **Slow** - requires launching browser
- **May violate Terms of Service** for some sites
- **Maintenance heavy** - need to update scraper when sites change
- **Not reliable** for production use

**States with Scraper-Friendly Designs:**
- California (DCA search portal)
- Texas (public license lookup)
- Florida (MQA portal)
- Illinois (IDFPR lookup)

**Implementation Priority:** ⭐⭐ LOW (Fragile, not recommended for production)

---

### 6. DEA Number Validation (Algorithm) ✅ FREE

**What it does:**
- Validates DEA number format using check digit algorithm
- Does NOT verify registration is active

**DEA Number Format:**
- 2 letters + 7 digits
- First letter: Registrant type (A, B, F, etc.)
- Second letter: First letter of last name
- Last digit: Check digit (calculated from other digits)

**Validation Algorithm:**
```javascript
function validateDEANumber(dea, lastName) {
  // Format check
  if (!/^[A-Z]{2}\d{7}$/.test(dea)) {
    return false;
  }

  // Check second letter matches last name initial
  if (dea[1].toUpperCase() !== lastName[0].toUpperCase()) {
    return false;
  }

  // Check digit validation
  const digits = dea.substring(2, 8);
  const checkDigit = parseInt(dea[8]);

  const sum1 = parseInt(digits[0]) + parseInt(digits[2]) + parseInt(digits[4]);
  const sum2 = parseInt(digits[1]) + parseInt(digits[3]) + parseInt(digits[5]);
  const total = sum1 + (sum2 * 2);
  const calculatedCheck = total % 10;

  return calculatedCheck === checkDigit;
}

// Example
validateDEANumber('AB1234563', 'Brown'); // true or false
```

**Use Cases:**
- Catch typos in DEA numbers
- Validate format before manual verification
- Quick sanity check

**Limitations:**
- **Does NOT verify registration is active**
- **Does NOT check expiration date**
- Only validates format
- Still need manual DEA verification

**Implementation Priority:** ⭐⭐⭐ MEDIUM (Easy win, catches errors)

---

## Paid APIs (Worth Considering)

These paid services can significantly reduce manual work:

### 1. Checkr Background Checks 💰 ~$35-50/check

**What it does:**
- FCRA-compliant background checks
- Criminal records (federal, state, county)
- Sex offender registry
- National credit check (optional)

**API:** Yes, full REST API
**Integration:** Easy
**Turnaround:** 1-3 business days

**URL:** https://checkr.com/
**Pricing:** $35-50 per check (volume discounts available)

**Implementation Priority:** ⭐⭐⭐⭐⭐ CRITICAL (Legally required, no free alternative)

---

### 2. Verisys License Verification 💰 ~$10-30/verification

**What it does:**
- Automated license verification across all 50 states
- Real-time status checks
- Expiration monitoring
- Disciplinary action alerts

**API:** Yes
**Coverage:** All state boards, DEA, board certifications

**URL:** https://www.verisys.com/
**Pricing:** $10-30 per verification + monthly fee

**Pros:**
- Saves huge amount of time
- Reliable (doesn't break like web scrapers)
- Real-time alerts for license changes

**Cons:**
- Ongoing cost
- May still require manual verification for edge cases

**Implementation Priority:** ⭐⭐⭐⭐ HIGH (Expensive but saves significant time)

---

### 3. National Student Clearinghouse 💰 Variable pricing

**What it does:**
- Verify degrees from 98% of US institutions
- Enrollment verification
- Degree dates

**API:** Yes
**Coverage:** 3,600+ institutions

**URL:** https://www.studentclearinghouse.org/
**Pricing:** Per-verification fees + annual subscription

**Implementation Priority:** ⭐⭐⭐ MEDIUM (Helpful for education verification)

---

### 4. Medallion (Credentialing Platform) 💰 ~$50-100/provider/year

**What it does:**
- Full credentialing automation
- Provider maintains credentials
- Automated monitoring
- Insurance credentialing

**All-in-one solution:**
- License verification
- Background checks
- Education verification
- Expiration monitoring
- Insurance credentialing

**URL:** https://www.medallion.co/
**Pricing:** ~$50-100 per provider per year

**Pros:**
- Turnkey solution
- Minimal development needed
- Ongoing monitoring included

**Cons:**
- Expensive at scale
- Less control
- May not fit all workflows

**Implementation Priority:** ⭐⭐⭐ MEDIUM (Alternative to building in-house)

---

## Implementation Roadmap

### Phase 1: Quick Wins (Week 1) - FREE

**Implement these immediately:**

1. **NPI Verification API**
   - Integrate CMS NPI Registry API
   - Auto-verify NPI on provider sign-up
   - Display provider name, credentials, specialty

2. **OIG/SAM Exclusion Checks**
   - Download OIG LEIE CSV monthly
   - Import into database
   - Check all providers automatically
   - Alert if match found

3. **DEA Format Validation**
   - Implement check digit algorithm
   - Validate on form submission
   - Catch typos immediately

4. **Automated Expiration Reminders**
   - Track license expiration dates
   - Send email reminders 60/30/10 days before
   - Auto-inactivate expired licenses

**Estimated Development Time:** 1-2 weeks
**Cost:** $0
**Impact:** Medium - catches errors, required compliance

---

### Phase 2: Document Management (Week 2-3) - FREE

**Implement secure document handling:**

1. **Document Upload System**
   - Supabase Storage (free tier: 1GB)
   - Or AWS S3 (free tier: 5GB)
   - Client-side upload with progress bar
   - File type validation (PDF, JPG, PNG only)

2. **Document Viewer**
   - In-browser PDF viewer
   - Image zoom/pan for license photos
   - Annotation tools for credentialing team

3. **Document Checklist**
   - Track which documents received
   - Auto-check document completeness
   - Email provider for missing docs

**Estimated Development Time:** 1-2 weeks
**Cost:** $0 (free tiers sufficient)
**Impact:** High - streamlines workflow

---

### Phase 3: Background Check Integration (Week 4) - PAID

**Integrate Checkr or Sterling:**

1. **Set up Checkr account**
2. **Integrate Checkr API**
   - Submit background check requests
   - Receive webhooks when complete
   - Display results in dashboard
3. **FCRA Compliance**
   - Pre-adverse action notices
   - 5-day waiting period
   - Adverse action letters

**Estimated Development Time:** 1 week
**Cost:** $35-50 per check
**Impact:** CRITICAL - legally required

---

### Phase 4: License Verification (Month 2) - HYBRID

**Choose approach:**

**Option A: Manual with Assist (Recommended)**
- Credentialing team manually verifies
- System provides direct links to state boards
- System validates data entry (format checks)
- Screenshot upload for documentation

**Option B: Web Scraping (Not Recommended)**
- Build scrapers for high-volume states
- Very fragile, high maintenance
- Use as supplement only

**Option C: Paid Service (Best for Scale)**
- Integrate Verisys or similar
- Automated verification
- Ongoing monitoring

**Recommended:** Start with Option A, evaluate Option C if volume exceeds 50 providers/month

**Estimated Development Time:** Option A: 1 week, Option C: 2 weeks
**Cost:** Option A: $0, Option C: $10-30/verification
**Impact:** High - biggest time saver

---

### Phase 5: Ongoing Monitoring (Month 3) - AUTOMATED

**Set up automated re-credentialing:**

1. **Monthly OIG/SAM Checks**
   - Cron job downloads latest CSVs
   - Checks all active providers
   - Alerts if any match found

2. **Quarterly License Checks**
   - If using paid service: automated
   - If manual: reminder to credentialing team

3. **Expiration Monitoring**
   - Track all credential expiration dates
   - Automated email reminders
   - Auto-deactivate expired credentials

4. **Annual Re-Credentialing**
   - Email provider 30 days before anniversary
   - Request updated documents
   - Track compliance

**Estimated Development Time:** 2 weeks
**Cost:** $0 (except if using paid verification)
**Impact:** CRITICAL - compliance requirement

---

## Code Examples

### Example 1: NPI Verification

```typescript
// server/services/npiVerification.ts

interface NPIResult {
  valid: boolean;
  name?: string;
  credentials?: string;
  specialty?: string;
  address?: string;
}

export async function verifyNPI(npiNumber: string): Promise<NPIResult> {
  const response = await fetch(
    `https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${npiNumber}`
  );

  const data = await response.json();

  if (data.result_count === 0) {
    return { valid: false };
  }

  const provider = data.results[0];
  const basic = provider.basic;

  return {
    valid: true,
    name: `${basic.first_name} ${basic.last_name}`,
    credentials: basic.credential || '',
    specialty: provider.taxonomies?.[0]?.desc || '',
    address: provider.addresses?.[0]?.address_1 || '',
  };
}

// Usage in route
app.post('/api/credentialing/verify-npi', async (req, res) => {
  const { npiNumber } = req.body;
  const result = await verifyNPI(npiNumber);

  if (!result.valid) {
    return res.status(404).json({ error: 'NPI not found' });
  }

  res.json(result);
});
```

---

### Example 2: OIG Exclusion Check

```typescript
// server/services/oigCheck.ts

import { db } from './db';
import { oigExclusions } from './schema';
import { eq, and } from 'drizzle-orm';

// Run monthly to download OIG data
export async function updateOIGDatabase() {
  const response = await fetch(
    'https://oig.hhs.gov/exclusions/downloadables/UPDATED.csv'
  );

  const csvText = await response.text();
  const rows = parseCSV(csvText); // Use csv-parser library

  // Clear old data
  await db.delete(oigExclusions);

  // Insert new data
  await db.insert(oigExclusions).values(rows);

  console.log(`OIG database updated: ${rows.length} exclusions`);
}

// Check if provider is excluded
export async function checkOIGExclusion(
  firstName: string,
  lastName: string,
  npi?: string
): Promise<boolean> {
  const results = await db
    .select()
    .from(oigExclusions)
    .where(
      and(
        eq(oigExclusions.firstName, firstName.toUpperCase()),
        eq(oigExclusions.lastName, lastName.toUpperCase())
      )
    );

  // If NPI provided, also check by NPI
  if (npi && results.length === 0) {
    const npiResults = await db
      .select()
      .from(oigExclusions)
      .where(eq(oigExclusions.npi, npi));

    return npiResults.length > 0;
  }

  return results.length > 0;
}

// Cron job - run monthly
import cron from 'node-cron';

// Run on 1st of each month at 2 AM
cron.schedule('0 2 1 * *', async () => {
  console.log('Running monthly OIG update...');
  await updateOIGDatabase();

  // Check all active providers
  await checkAllProviders();
});

async function checkAllProviders() {
  const providers = await db.select().from(therapists);

  for (const provider of providers) {
    const excluded = await checkOIGExclusion(
      provider.firstName,
      provider.lastName,
      provider.npiNumber
    );

    if (excluded) {
      // Alert credentialing team
      await sendAlert({
        subject: 'URGENT: Provider on OIG Exclusion List',
        provider: provider.id,
        action: 'Immediate suspension required',
      });

      // Auto-suspend profile
      await db.update(therapists)
        .set({ profileStatus: 'inactive' })
        .where(eq(therapists.id, provider.id));
    }
  }
}
```

---

### Example 3: DEA Validation

```typescript
// server/services/deaValidation.ts

export function validateDEANumber(
  deaNumber: string,
  lastName: string
): { valid: boolean; error?: string } {
  // Format check: 2 letters + 7 digits
  const deaPattern = /^[A-Z]{2}\d{7}$/;

  if (!deaPattern.test(deaNumber)) {
    return {
      valid: false,
      error: 'Invalid DEA format. Must be 2 letters + 7 digits (e.g., AB1234563)',
    };
  }

  // Check second letter matches last name initial
  const lastNameInitial = lastName.charAt(0).toUpperCase();
  const deaInitial = deaNumber.charAt(1).toUpperCase();

  if (deaInitial !== lastNameInitial) {
    return {
      valid: false,
      error: `Second letter of DEA (${deaInitial}) must match last name initial (${lastNameInitial})`,
    };
  }

  // Check digit validation
  const digits = deaNumber.substring(2, 8);
  const checkDigit = parseInt(deaNumber.charAt(8));

  const sum1 =
    parseInt(digits[0]) + parseInt(digits[2]) + parseInt(digits[4]);
  const sum2 =
    parseInt(digits[1]) + parseInt(digits[3]) + parseInt(digits[5]);
  const total = sum1 + sum2 * 2;
  const calculatedCheck = total % 10;

  if (calculatedCheck !== checkDigit) {
    return {
      valid: false,
      error: 'DEA check digit is invalid. Please verify the number.',
    };
  }

  return { valid: true };
}

// Usage
app.post('/api/credentialing/validate-dea', (req, res) => {
  const { deaNumber, lastName } = req.body;
  const result = validateDEANumber(deaNumber, lastName);

  res.json(result);
});
```

---

### Example 4: License Expiration Monitoring

```typescript
// server/services/expirationMonitoring.ts

import { db } from './db';
import { therapists } from './schema';
import { lt } from 'drizzle-orm';
import { sendEmail } from './email';

// Check for expiring licenses - run daily
export async function checkExpiringLicenses() {
  const today = new Date();

  // 60 days warning
  const sixtyDays = new Date();
  sixtyDays.setDate(today.getDate() + 60);

  const expiringProviders = await db
    .select()
    .from(therapists)
    .where(lt(therapists.licenseExpiration, sixtyDays));

  for (const provider of expiringProviders) {
    const daysUntilExpiration = Math.floor(
      (provider.licenseExpiration.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiration === 60 ||
        daysUntilExpiration === 30 ||
        daysUntilExpiration === 10) {
      // Send reminder
      await sendEmail({
        to: provider.email,
        subject: `License Expiring in ${daysUntilExpiration} Days`,
        template: 'license-expiration-reminder',
        data: {
          name: provider.firstName,
          daysRemaining: daysUntilExpiration,
          expirationDate: provider.licenseExpiration,
        },
      });
    }

    // Auto-deactivate if expired
    if (daysUntilExpiration < 0) {
      await db.update(therapists)
        .set({ profileStatus: 'inactive' })
        .where(eq(therapists.id, provider.id));

      await sendEmail({
        to: provider.email,
        subject: 'Profile Deactivated - License Expired',
        template: 'license-expired',
        data: { name: provider.firstName },
      });
    }
  }
}

// Cron job - run daily at 8 AM
cron.schedule('0 8 * * *', async () => {
  console.log('Checking for expiring licenses...');
  await checkExpiringLicenses();
});
```

---

## What Remains Manual

Even with all automation, these tasks still require human verification:

### Always Manual

1. **Document Quality Review**
   - Check if documents are legible
   - Verify documents haven't been altered
   - Ensure signatures are present
   - Cross-reference information across documents

2. **Professional Judgment**
   - Reviewing disciplinary actions (context matters)
   - Evaluating malpractice claims
   - Assessing gaps in employment history
   - Character references

3. **License Verification (without paid service)**
   - Accessing state board websites
   - Taking verification screenshots
   - Documenting source and date

4. **Education Verification (without paid service)**
   - Requesting transcripts from universities
   - Verifying accreditation
   - Checking for diploma mills

5. **Identity Verification**
   - Comparing photos across documents
   - Verifying signatures match
   - Checking for name discrepancies

6. **Final Approval Decision**
   - Weighing all factors
   - Edge case review
   - Appeal considerations

---

## Hybrid Automation Strategy (Recommended)

### Best Approach for TherapyConnect

**Combine free automation + smart manual processes:**

#### Tier 1: Fully Automated (FREE)
- ✅ NPI verification
- ✅ OIG/SAM exclusion checks (monthly)
- ✅ DEA format validation
- ✅ License expiration monitoring
- ✅ Document upload and organization
- ✅ Email reminders and notifications

**Development Time:** 3-4 weeks
**Ongoing Cost:** $0

#### Tier 2: Manual with Tech Assist (FREE)
- ⚡ License verification (credentialing team uses direct links)
- ⚡ Board certification check (team uses verification websites)
- ⚡ Document quality review (team uses in-app viewer)
- ⚡ Education verification (team requests transcripts)

**Development Time:** 2 weeks (build assist tools)
**Ongoing Cost:** Staff time

#### Tier 3: Paid Services (REQUIRED)
- 💰 Background checks: Checkr ($35-50/check)
- 💰 Optional: Verisys license verification ($10-30/verification) - for scale

**Ongoing Cost:** ~$40-80 per provider initially, ~$40/year ongoing

---

## Cost Analysis

### Scenario: 100 Providers Per Year

**Option A: Maximum Automation (Recommended)**
- Initial credentialing: 100 × $50 (background check) = $5,000/year
- Ongoing monitoring: $0 (automated OIG/SAM)
- License verification: Manual with assist = $0
- **Total: ~$5,000/year**

**Option B: Full Paid Services**
- Initial credentialing: 100 × ($50 background + $20 license verification) = $7,000/year
- Ongoing monitoring: 100 × $10/year = $1,000/year
- **Total: ~$8,000/year**

**Option C: Enterprise Platform (Medallion)**
- 100 × $75/provider/year = $7,500/year
- **Total: ~$7,500/year**

**Recommendation:** Start with Option A, upgrade to Option B when volume exceeds 200 providers/year

---

## Implementation Checklist

### Week 1-2: Core Free Automation
- [ ] Integrate NPI Registry API
- [ ] Set up OIG/SAM database downloads
- [ ] Implement DEA validation algorithm
- [ ] Build license expiration monitoring
- [ ] Create email notification system

### Week 3-4: Document Management
- [ ] Set up Supabase Storage or AWS S3
- [ ] Build document upload interface
- [ ] Create document viewer with annotations
- [ ] Build credentialing checklist tracker
- [ ] Add automated completeness checks

### Month 2: Background Checks
- [ ] Create Checkr account
- [ ] Integrate Checkr API
- [ ] Build FCRA compliance workflow
- [ ] Test background check flow end-to-end

### Month 3: Monitoring & Alerts
- [ ] Set up cron jobs for automated checks
- [ ] Build alert system for expirations
- [ ] Create provider dashboard
- [ ] Implement re-credentialing workflow

### Optional: Paid Verification Services
- [ ] Evaluate Verisys, Medallion, etc.
- [ ] Integrate if volume justifies cost
- [ ] Build fallback to manual if API fails

---

## Conclusion

**The Bottom Line:**

- **60% of credentialing CAN be automated for FREE** (NPI, OIG/SAM, expiration tracking, document management)
- **Background checks REQUIRE paid service** ($35-50/provider) - no free alternative
- **License verification can be manual** until volume justifies paid service ($10-30/provider)
- **Total cost for startup: ~$50 per provider** (just background checks)

**ROI Calculation:**
- Manual credentialing: ~4-6 hours per provider
- With automation: ~1-2 hours per provider
- Time savings: ~4 hours × $30/hour = **$120 saved per provider**
- Investment in automation: ~6 weeks development
- Break-even: ~15-20 providers

**Recommended Approach:**
1. Build all free automation (Weeks 1-4)
2. Integrate Checkr for background checks (Week 5)
3. Start with manual license verification
4. Evaluate paid services after 100 providers

---

**Questions? Need help implementing?**
Contact: credentialing@therapyconnect.com

---

**END OF AUTOMATION GUIDE**
