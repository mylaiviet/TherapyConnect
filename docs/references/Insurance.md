Perfect! Now I have comprehensive research on insurance billing for therapy. Let me present you with a detailed plan for implementing payment processing with insurance billing support for TherapyConnect.
💳 INSURANCE BILLING & PAYMENT PROCESSING - COMPREHENSIVE RESEARCH & PLAN
Based on my research, here's what I've learned about implementing insurance billing for mental health therapy:
🏥 INSURANCE BILLING COMPLEXITY - THE REALITY
Insurance billing for therapy is SIGNIFICANTLY MORE COMPLEX than simple credit card processing. Here's why:
What Insurance Billing Requires:
Regulatory Compliance:
HIPAA compliance (patient data protection)
EDI (Electronic Data Interchange) standards
State-specific insurance regulations
Provider credentialing and NPI (National Provider Identifier) numbers
Technical Requirements:
EDI 837 format (standard healthcare claims format)
EDI 835 format (electronic remittance advice - payment response)
Clearinghouse integration (Availity, Change Healthcare, Office Ally)
Real-time eligibility verification (EDI 270/271)
Claims status checking
Clinical Documentation:
CPT codes (Current Procedural Terminology) - billing codes for services
90834: Psychotherapy, 45 minutes
90837: Psychotherapy, 60 minutes
90846: Family therapy
90853: Group therapy
ICD-10 codes (diagnosis codes) - what condition is being treated
F41.1: Generalized anxiety disorder
F32.A: Major depressive disorder with anxious distress
F43.10: PTSD
Progress notes with measurable outcomes
Treatment plans linked to diagnoses
Session duration tracking
Modifiers (-95 for telehealth, -59 for multiple services, etc.)
Business Operations:
Eligibility verification BEFORE each session
Prior authorization for certain services
Claims submission (can take 30-90 days for payment)
Claim denial management and resubmission
Payment reconciliation (matching payments to claims)
Patient responsibility calculation (copays, deductibles, coinsurance)
💰 COST ANALYSIS - Build vs Buy
Option 1: Build In-House (NOT RECOMMENDED)
Estimated Cost: $150,000 - $500,000 Timeline: 12-24 months Requirements:
EDI integration developer ($100-200/hr × 6-12 months)
Healthcare compliance expert ($150-300/hr consulting)
Clearinghouse API integration ($5,000-15,000/year)
HIPAA compliance infrastructure ($10,000-50,000)
Legal/regulatory review ($20,000-50,000)
Ongoing maintenance (2-3 developers full-time)
Risks:
❌ Extremely complex regulatory landscape
❌ High liability if HIPAA violations occur ($100-$50,000 per violation)
❌ Insurance companies constantly change requirements
❌ Takes years to become credentialed with all payers
Option 2: Integrate with Existing Billing Platform (⭐ RECOMMENDED)
Estimated Cost: $0 - $5,000 setup + monthly fees Timeline: 2-4 weeks integration Top Solutions:
A. SimplePractice API Integration
Cost: $49/month base + 6% of insurance collections (min $750/month)
Features: Full insurance billing, eligibility verification, claims submission
API: Yes, REST API available
Pros: All-in-one solution, popular with therapists, handles everything
Cons: Higher commission fees, locked into their platform
B. TherapyNotes API Integration
Cost: $59/month base + $0.14 per electronic claim
Features: Basic billing, claims processing, direct insurance payouts
API: Limited API, primarily for data export
Pros: Lower cost per claim, simple pricing
Cons: Less robust automation
C. Availity Clearinghouse Direct Integration
Cost: $0-50/month + $0.15-0.50 per claim
Features: EDI 837 claims submission, eligibility checking, ERA (payment) processing
API: Yes, robust REST API
Pros: Industry standard, connects to all payers, low cost
Cons: Requires you to handle CPT/ICD-10 codes, clinical documentation, more complex
D. Office Ally (Free Option)
Cost: FREE for up to 50 claims/month, then $0.50/claim
Features: Claims submission, eligibility, ERA
API: Basic API available
Pros: Completely free to start, good for small practices
Cons: Less robust features, basic interface
E. Stripe + Self-Pay Only (Simplest)
Cost: 2.9% + $0.30 per transaction
Features: Credit card processing only, NO insurance
API: Excellent API, well-documented
Pros: Very easy to implement (1-2 weeks), standard payment processing
Cons: Doesn't handle insurance at all
🎯 MY RECOMMENDATION: Hybrid Approach
Phase 1: Self-Pay with Stripe (2-3 weeks)
Start with credit card processing for patients paying out-of-pocket:
Immediate payment at booking
Simple, secure, fast
Gets revenue flowing quickly
2.9% + $0.30 per transaction
Phase 2: "Superbills" for Insurance (1 week)
Generate printable superbills (detailed receipts) that patients can submit to insurance themselves:
Include all required info: CPT codes, ICD-10 codes, NPI, dates of service
Patient handles insurance reimbursement
Zero additional cost to platform
Common practice for out-of-network therapists
Phase 3: Direct Insurance Billing via Availity (4-8 weeks)
Once you have users and revenue, integrate with Availity clearinghouse:
Submit claims electronically (EDI 837)
Check eligibility in real-time
Receive payments via ERA (EDI 835)
$0.15-0.50 per claim
Positions you as premium solution
📋 IMPLEMENTATION PLAN - HYBRID APPROACH
Phase 1: Self-Pay Payment Processing with Stripe
Database Schema (4 new tables):
// payments table
- id, appointmentId, amount, currency
- paymentMethod, stripePaymentIntentId
- status (pending, succeeded, failed, refunded)
- createdAt, processedAt

// invoices table  
- id, appointmentId, therapistId, patientId
- subtotal, platformFee, therapistPayout
- invoiceNumber, dueDate, paidAt

// refunds table
- id, paymentId, amount, reason
- status, processedAt

// therapist_payout_accounts table
- id, therapistId, stripeAccountId
- accountStatus, onboardingComplete
API Endpoints (12 new routes):
POST   /api/payments/create-intent          # Create Stripe payment intent
POST   /api/payments/:id/confirm             # Confirm payment
GET    /api/payments/:id                     # Get payment status
POST   /api/payments/:id/refund              # Process refund

GET    /api/therapist/payouts                # View payout history
POST   /api/therapist/setup-payouts          # Connect Stripe account

GET    /api/invoices/:id                     # Get invoice
GET    /api/patient/invoices                 # List patient invoices
GET    /api/therapist/invoices               # List therapist invoices

POST   /api/webhooks/stripe                  # Stripe webhook handler
React Components (5 new components):
PaymentForm.tsx - Stripe Elements credit card form
BookingCheckout.tsx - Payment step in booking flow
InvoiceView.tsx - Display invoice/receipt
RefundModal.tsx - Therapist can issue refunds
PayoutDashboard.tsx - Therapist earnings & payout management
Key Features: ✅ Pay at time of booking (hold appointment slot) ✅ Platform commission (e.g., 10% fee) ✅ Direct payouts to therapists via Stripe Connect ✅ Automatic refunds if cancelled 24+ hours before ✅ Receipt generation ✅ Payment history for patients & therapists Estimated Timeline: 2-3 weeks Cost: $0 upfront, 2.9% + $0.30 per transaction
Phase 2: Superbill Generation (Insurance Receipts)
Database Schema (2 new tables):
// therapist_insurance_info table
- id, therapistId, npiNumber
- taxId, licenseNumber, licenseState
- caqhId, medicareId

// superbills table
- id, appointmentId, patientId, therapistId
- cptCode, icd10Code, diagnosisDescription
- sessionDate, sessionDuration, amountBilled
- superbillNumber, generatedAt
API Endpoints (4 new routes):
POST   /api/superbills/generate/:appointmentId  # Generate superbill PDF
GET    /api/superbills/:id                      # Get superbill
GET    /api/patient/superbills                  # List patient superbills
PUT    /api/therapist/insurance-info            # Update NPI, tax ID, etc.
React Components (3 new components):
SuperbillGenerator.tsx - Therapist fills CPT/ICD-10 codes after session
SuperbillPDF.tsx - Formatted printable PDF receipt
InsuranceInfoForm.tsx - Therapist enters NPI, license, tax ID
Key Features: ✅ Professional PDF with all required insurance info ✅ CPT code selector (90834, 90837, 90846, etc.) ✅ ICD-10 code selector (F41.1, F32.A, F43.10, etc.) ✅ Includes therapist NPI, tax ID, license number ✅ Patient downloads and submits to insurance themselves ✅ Out-of-network therapists can use this Estimated Timeline: 1 week Cost: $0 (just PDF generation)
Phase 3: Direct Insurance Billing via Availity (Optional - Future)
Requirements:
Therapists must be credentialed with insurance companies (6-12 months process)
Platform needs Availity developer account ($0-50/month)
EDI 837 claim generation
EDI 271 eligibility verification
EDI 835 payment reconciliation
Database Schema (6 new tables):
// insurance_claims table
- id, appointmentId, claimNumber
- payerId, claimStatus, submittedAt
- adjudicatedAt, paidAmount, denialReason

// insurance_verifications table
- id, patientId, insuranceCompany
- policyNumber, groupNumber, verified At
- copay, deductible, coinsurance

// insurance_companies table
- id, name, payerId, ediPayerId
- supportedCptCodes, priorAuthRequired

// claim_line_items table
- id, claimId, cptCode, icd10Code
- units, chargeAmount, allowedAmount

// remittance_advice table (ERA - payment details)
- id, claimId, checkNumber, checkDate
- paidAmount, adjustments, patientResponsibility

// prior_authorizations table
- id, patientId, insuranceId
- authNumber, approvedSessions, expiresAt
API Endpoints (15+ new routes):
POST   /api/insurance/verify-eligibility        # Check if patient covered
POST   /api/insurance/submit-claim               # Submit EDI 837 claim
GET    /api/insurance/claim-status/:id           # Check claim status
POST   /api/insurance/resubmit-claim/:id         # Resubmit denied claim

GET    /api/therapist/claims                     # List all claims
GET    /api/therapist/denials                    # Claims needing attention
PUT    /api/therapist/credentialing-info         # Update insurance credentialing
Estimated Timeline: 6-8 weeks Cost: $0.15-0.50 per claim + development time Complexity: HIGH - requires healthcare billing expertise
❓ QUESTIONS FOR YOU
Before I present the final implementation plan, I need to know:
Which approach do you want to start with?
Option A: Phase 1 only (Stripe self-pay) - simplest, fastest
Option B: Phase 1 + 2 (Stripe + superbills) - good middle ground
Option C: All 3 phases (full insurance billing) - most complex
Platform business model?
Take commission on payments (e.g., 10% platform fee)?
Subscription model (therapists pay monthly, no commission)?
Free platform (therapists keep 100%)?
Payment timing?
Charge patient at time of booking?
Charge after session completes?
Hold funds until session, then process?
Refund policy?
Full refund if cancelled 24+ hours before?
No refunds, but credit toward future sessions?
Therapist decides case-by-case?
Insurance priority?
Is insurance billing a "must have" or "nice to have"?
How many of your therapists are in-network with insurance?
Would superbills (patient submits to insurance) be acceptable initially?
Please answer these questions so I can create a focused implementation plan tailored to your specific needs!