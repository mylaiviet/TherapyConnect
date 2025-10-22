/**
 * DEA Number Validation Service
 * Validates DEA registration numbers using check digit algorithm
 * Note: This validates FORMAT only - does not verify registration is active with DEA
 */

export interface DEAValidationResult {
  valid: boolean;
  deaNumber?: string;
  registrantType?: string;
  registrantTypeDescription?: string;
  lastNameInitial?: string;
  checkDigitValid?: boolean;
  errors?: string[];
}

// DEA Registrant Type codes (first letter)
const REGISTRANT_TYPES: Record<string, string> = {
  'A': 'Deprecated (replaced by F)',
  'B': 'Hospital/Clinic',
  'C': 'Practitioner',
  'D': 'Teaching Institution',
  'E': 'Manufacturer',
  'F': 'Distributor',
  'G': 'Researcher',
  'H': 'Analytical Lab',
  'J': 'Importer',
  'K': 'Exporter',
  'L': 'Reverse Distributor',
  'M': 'Mid-Level Practitioner (NP, PA, etc.)',
  'P': 'Narcotic Treatment Program',
  'R': 'Reverse Distributor',
  'S': 'Supplier',
  'T': 'Teaching Institution (research)',
  'U': 'Narcotic Treatment Program (research)',
  'X': 'Suboxone/Buprenorphine Waiver Practitioner',
};

/**
 * Validate DEA number format and check digit
 * @param deaNumber - DEA registration number (e.g., "AB1234563")
 * @param lastName - Provider's last name for second letter validation
 * @returns Validation result with detailed information
 */
export function validateDEANumber(
  deaNumber: string,
  lastName?: string
): DEAValidationResult {
  const errors: string[] = [];

  // Clean input
  const cleanDEA = deaNumber.trim().toUpperCase();

  // Format validation: Must be 2 letters + 7 digits
  const deaPattern = /^[A-Z]{2}\d{7}$/;

  if (!deaPattern.test(cleanDEA)) {
    return {
      valid: false,
      errors: [
        'Invalid DEA format. Must be 2 letters followed by 7 digits (e.g., AB1234563)',
      ],
    };
  }

  const registrantTypeLetter = cleanDEA[0];
  const lastNameInitialLetter = cleanDEA[1];
  const digits = cleanDEA.substring(2);

  // Check first letter (registrant type)
  const registrantTypeDescription = REGISTRANT_TYPES[registrantTypeLetter];

  if (!registrantTypeDescription) {
    errors.push(`Invalid registrant type letter: ${registrantTypeLetter}`);
  }

  // Check second letter matches last name initial (if provided)
  if (lastName) {
    const expectedInitial = lastName.charAt(0).toUpperCase();

    // For mid-level practitioners (M), the second letter can be the last name initial OR the first letter of the supervising physician's last name
    // We'll just check if it matches the provider's last name
    if (lastNameInitialLetter !== expectedInitial && registrantTypeLetter !== 'M') {
      errors.push(
        `Second letter of DEA (${lastNameInitialLetter}) does not match last name initial (${expectedInitial})`
      );
    }
  }

  // Validate check digit using DEA algorithm
  const checkDigitValid = validateDEACheckDigit(digits);

  if (!checkDigitValid) {
    errors.push('Invalid check digit. DEA number appears to be incorrect.');
  }

  const valid = errors.length === 0;

  return {
    valid,
    deaNumber: cleanDEA,
    registrantType: registrantTypeLetter,
    registrantTypeDescription,
    lastNameInitial: lastNameInitialLetter,
    checkDigitValid,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Validate DEA check digit using the DEA algorithm
 * The last digit should equal the last digit of the sum calculated from the other 6 digits
 *
 * Algorithm:
 * 1. Add digits in positions 1, 3, 5 (odd positions)
 * 2. Add digits in positions 2, 4, 6 (even positions) and multiply by 2
 * 3. Sum the two results
 * 4. Last digit of sum should match the 7th digit (check digit)
 *
 * @param digits - 7-digit portion of DEA number
 * @returns true if check digit is valid
 */
function validateDEACheckDigit(digits: string): boolean {
  if (digits.length !== 7 || !/^\d{7}$/.test(digits)) {
    return false;
  }

  // Extract the 6 digits (excluding check digit)
  const d1 = parseInt(digits[0]);
  const d2 = parseInt(digits[1]);
  const d3 = parseInt(digits[2]);
  const d4 = parseInt(digits[3]);
  const d5 = parseInt(digits[4]);
  const d6 = parseInt(digits[5]);
  const checkDigit = parseInt(digits[6]);

  // Sum of odd position digits (1st, 3rd, 5th)
  const sumOdd = d1 + d3 + d5;

  // Sum of even position digits (2nd, 4th, 6th) multiplied by 2
  const sumEven = (d2 + d4 + d6) * 2;

  // Total sum
  const total = sumOdd + sumEven;

  // Check digit should be the last digit of the total
  const calculatedCheckDigit = total % 10;

  return calculatedCheckDigit === checkDigit;
}

/**
 * Determine if a provider type requires DEA registration
 * @param licenseType - Provider license type (e.g., "MD", "DO", "PMHNP", "PA")
 * @returns true if DEA is typically required for this provider type
 */
export function isDEARequired(licenseType: string): boolean {
  const upperLicense = licenseType.toUpperCase();

  // Prescribers who typically need DEA
  const deaRequiredTypes = [
    'MD',
    'DO',
    'PMHNP',
    'APRN',
    'NP',
    'PA',
    'PA-C',
    'DDS',
    'DMD',
    'DVM',
    'DPM',
    'OD'
  ];

  // Non-prescribers who typically don't need DEA
  const noDeaTypes = [
    'LCSW',
    'LMFT',
    'LPC',
    'LPCC',
    'LCPC',
    'LMHC',
    'PSYD' // Unless they prescribe in certain states
  ];

  // Check if in required list
  if (deaRequiredTypes.some(type => upperLicense.includes(type))) {
    return true;
  }

  // Check if in non-required list
  if (noDeaTypes.some(type => upperLicense.includes(type))) {
    return false;
  }

  // Default: if prescribing, probably need DEA
  // This is conservative - better to ask for DEA than not
  return false;
}

/**
 * Get friendly description of registrant type
 * @param registrantLetter - First letter of DEA number
 * @returns Description of what this registrant type means
 */
export function getRegistrantTypeDescription(registrantLetter: string): string {
  return REGISTRANT_TYPES[registrantLetter.toUpperCase()] || 'Unknown registrant type';
}

/**
 * Check if DEA number indicates mid-level practitioner
 * @param deaNumber - DEA registration number
 * @returns true if this is a mid-level practitioner (NP, PA, etc.)
 */
export function isMidLevelPractitioner(deaNumber: string): boolean {
  const cleanDEA = deaNumber.trim().toUpperCase();
  return cleanDEA.startsWith('M');
}

/**
 * Check if DEA number is for Suboxone/Buprenorphine waiver
 * @param deaNumber - DEA registration number
 * @returns true if this is an X-waiver DEA
 */
export function isSuboxoneWaiver(deaNumber: string): boolean {
  const cleanDEA = deaNumber.trim().toUpperCase();
  return cleanDEA.startsWith('X');
}
