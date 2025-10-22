/**
 * NPI Verification Service
 * Uses free CMS NPI Registry API to verify National Provider Identifiers
 * API Documentation: https://npiregistry.cms.hhs.gov/api-page
 */

interface NPIAddress {
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country_code?: string;
  telephone_number?: string;
}

interface NPITaxonomy {
  code: string;
  desc: string;
  primary: boolean;
  state?: string;
  license?: string;
}

interface NPIBasic {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  credential?: string;
  sole_proprietor?: string;
  gender?: string;
  enumeration_date?: string;
  last_updated?: string;
  status?: string;
  name?: string; // For organizations
  organization_name?: string;
}

interface NPIProvider {
  number: string;
  enumeration_type: string;
  basic: NPIBasic;
  taxonomies?: NPITaxonomy[];
  addresses?: NPIAddress[];
  identifiers?: Array<{
    code?: string;
    desc?: string;
    issuer?: string;
    identifier?: string;
    state?: string;
  }>;
  other_names?: Array<{
    type?: string;
    code?: string;
    credential?: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
  }>;
}

interface NPIAPIResponse {
  result_count: number;
  results?: NPIProvider[];
}

export interface NPIVerificationResult {
  valid: boolean;
  npiNumber?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  credentials?: string;
  specialty?: string;
  specialtyDescription?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  enumerationType?: 'Individual' | 'Organization';
  enumerationDate?: string;
  lastUpdated?: string;
  status?: string;
  taxonomies?: Array<{
    code: string;
    description: string;
    primary: boolean;
    license?: string;
    state?: string;
  }>;
  error?: string;
}

const NPI_API_BASE = 'https://npiregistry.cms.hhs.gov/api/';
const API_VERSION = '2.1';

/**
 * Verify an NPI number
 * @param npiNumber - 10-digit NPI number
 * @returns Verification result with provider details
 */
export async function verifyNPI(npiNumber: string): Promise<NPIVerificationResult> {
  try {
    // Validate format: 10 digits
    if (!/^\d{10}$/.test(npiNumber)) {
      return {
        valid: false,
        error: 'Invalid NPI format. Must be exactly 10 digits.',
      };
    }

    // Query the NPI Registry API
    const url = `${NPI_API_BASE}?version=${API_VERSION}&number=${npiNumber}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`NPI API error: ${response.status} ${response.statusText}`);
      return {
        valid: false,
        error: `NPI Registry API error: ${response.statusText}`,
      };
    }

    const data: NPIAPIResponse = await response.json();

    // No results found
    if (data.result_count === 0 || !data.results || data.results.length === 0) {
      return {
        valid: false,
        error: 'NPI number not found in registry',
      };
    }

    const provider = data.results[0];
    const basic = provider.basic;
    const primaryTaxonomy = provider.taxonomies?.find(t => t.primary) || provider.taxonomies?.[0];
    const primaryAddress = provider.addresses?.find(a => (a as any).address_purpose === 'LOCATION')
                        || provider.addresses?.[0];

    // Determine enumeration type
    const isIndividual = provider.enumeration_type === 'NPI-1';
    const enumerationType = isIndividual ? 'Individual' : 'Organization';

    // Build result
    const result: NPIVerificationResult = {
      valid: true,
      npiNumber: provider.number,
      enumerationType,
      enumerationDate: basic.enumeration_date,
      lastUpdated: basic.last_updated,
      status: basic.status,
    };

    // Individual provider
    if (isIndividual) {
      result.firstName = basic.first_name;
      result.lastName = basic.last_name;
      result.name = `${basic.first_name || ''} ${basic.middle_name || ''} ${basic.last_name || ''}`.trim();
      result.credentials = basic.credential;
    } else {
      // Organization
      result.name = basic.organization_name || basic.name;
    }

    // Primary specialty
    if (primaryTaxonomy) {
      result.specialty = primaryTaxonomy.code;
      result.specialtyDescription = primaryTaxonomy.desc;
    }

    // Address information
    if (primaryAddress) {
      result.address = [primaryAddress.address_1, primaryAddress.address_2]
        .filter(Boolean)
        .join(', ');
      result.city = primaryAddress.city;
      result.state = primaryAddress.state;
      result.zipCode = primaryAddress.postal_code;
      result.phone = primaryAddress.telephone_number;
    }

    // All taxonomies
    if (provider.taxonomies && provider.taxonomies.length > 0) {
      result.taxonomies = provider.taxonomies.map(t => ({
        code: t.code,
        description: t.desc,
        primary: t.primary,
        license: t.license,
        state: t.state,
      }));
    }

    return result;

  } catch (error) {
    console.error('NPI verification error:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error during NPI verification',
    };
  }
}

/**
 * Search for providers by name and location
 * Useful for finding NPIs if provider doesn't know theirs
 */
export async function searchNPI(params: {
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  taxonomyDescription?: string;
  limit?: number;
}): Promise<NPIVerificationResult[]> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('version', API_VERSION);

    if (params.firstName) queryParams.append('first_name', params.firstName);
    if (params.lastName) queryParams.append('last_name', params.lastName);
    if (params.organizationName) queryParams.append('organization_name', params.organizationName);
    if (params.city) queryParams.append('city', params.city);
    if (params.state) queryParams.append('state', params.state);
    if (params.postalCode) queryParams.append('postal_code', params.postalCode);
    if (params.taxonomyDescription) queryParams.append('taxonomy_description', params.taxonomyDescription);

    queryParams.append('limit', String(params.limit || 10));

    const url = `${NPI_API_BASE}?${queryParams.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`NPI search API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: NPIAPIResponse = await response.json();

    if (data.result_count === 0 || !data.results) {
      return [];
    }

    // Convert each result to NPIVerificationResult
    const results: NPIVerificationResult[] = [];

    for (const provider of data.results) {
      const basic = provider.basic;
      const primaryTaxonomy = provider.taxonomies?.find(t => t.primary) || provider.taxonomies?.[0];
      const primaryAddress = provider.addresses?.find(a => (a as any).address_purpose === 'LOCATION')
                          || provider.addresses?.[0];

      const isIndividual = provider.enumeration_type === 'NPI-1';

      const result: NPIVerificationResult = {
        valid: true,
        npiNumber: provider.number,
        enumerationType: isIndividual ? 'Individual' : 'Organization',
        enumerationDate: basic.enumeration_date,
        status: basic.status,
      };

      if (isIndividual) {
        result.firstName = basic.first_name;
        result.lastName = basic.last_name;
        result.name = `${basic.first_name || ''} ${basic.last_name || ''}`.trim();
        result.credentials = basic.credential;
      } else {
        result.name = basic.organization_name || basic.name;
      }

      if (primaryTaxonomy) {
        result.specialty = primaryTaxonomy.code;
        result.specialtyDescription = primaryTaxonomy.desc;
      }

      if (primaryAddress) {
        result.city = primaryAddress.city;
        result.state = primaryAddress.state;
        result.zipCode = primaryAddress.postal_code;
      }

      results.push(result);
    }

    return results;

  } catch (error) {
    console.error('NPI search error:', error);
    return [];
  }
}

/**
 * Validate NPI checksum using Luhn algorithm (mod 10)
 * This validates the NPI format is correct but doesn't verify it exists
 */
export function validateNPIChecksum(npiNumber: string): boolean {
  if (!/^\d{10}$/.test(npiNumber)) {
    return false;
  }

  // NPI uses Luhn algorithm with constant prefix "80840"
  const fullNumber = '80840' + npiNumber;

  let sum = 0;
  let isEven = false;

  // Process from right to left (skip last digit which is the check digit)
  for (let i = fullNumber.length - 2; i >= 0; i--) {
    let digit = parseInt(fullNumber[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  const npiCheckDigit = parseInt(npiNumber[9]);

  return checkDigit === npiCheckDigit;
}
