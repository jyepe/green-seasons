/**
 * Validates if an address is within Miami-Dade County using the Census Geocoder API.
 * https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress
 */

const MIAMI_DADE_COUNTY_FIPS = '12086';
const CENSUS_GEOCODER_ENDPOINT =
  'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress';
const API_TIMEOUT_MS = 10000;

export interface AddressValidationResult {
  isValid: boolean;
  isMiamiDade: boolean;
  countyName?: string;
  errorMessage?: string;
}

interface CensusGeocoderResponse {
  result?: {
    addressMatches?: {
      geographies?: {
        Counties?: {
          GEOID?: string;
          NAME?: string;
        }[];
      };
    }[];
  };
}

/**
 * Validates if the given address is within Miami-Dade County.
 *
 * @param addressLine1 - Street address (e.g., "111 NW 1st Street")
 * @param city - City name (e.g., "Miami")
 * @param postalCode - ZIP code (e.g., "33128")
 * @param state - State abbreviation (defaults to "FL")
 * @returns Promise resolving to validation result
 */
export async function validateMiamiDadeAddress(
  addressLine1: string,
  city: string,
  postalCode: string,
  state: string = 'FL'
): Promise<AddressValidationResult> {
  const fullAddress = `${addressLine1}, ${city}, ${state} ${postalCode}`;

  try {
    const params = new URLSearchParams({
      address: fullAddress,
      benchmark: 'Public_AR_Current',
      vintage: 'Current_Current',
      format: 'json',
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(`${CENSUS_GEOCODER_ENDPOINT}?${params}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        isValid: false,
        isMiamiDade: false,
        errorMessage: 'Address verification failed. Please try again.',
      };
    }

    const data: CensusGeocoderResponse = await response.json();

    // Check if we got any address matches
    const matches = data?.result?.addressMatches;
    if (!matches || matches.length === 0) {
      return {
        isValid: false,
        isMiamiDade: false,
        errorMessage:
          'Address could not be found. Please verify the address and try again.',
      };
    }

    // Get county information from the first match
    const counties = matches[0]?.geographies?.Counties;
    if (!counties || counties.length === 0) {
      return {
        isValid: false,
        isMiamiDade: false,
        errorMessage:
          'Could not determine county for this address. Please try again.',
      };
    }

    const county = counties[0];
    const countyName = county.NAME || 'Unknown';
    const countyFips = county.GEOID;

    // Check if it's Miami-Dade County
    if (countyFips === MIAMI_DADE_COUNTY_FIPS) {
      return {
        isValid: true,
        isMiamiDade: true,
        countyName,
      };
    }

    // Address is valid but not in Miami-Dade
    return {
      isValid: true,
      isMiamiDade: false,
      countyName,
      errorMessage: `We currently only service the Miami-Dade County area. Your address appears to be in ${countyName} County.`,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        isValid: false,
        isMiamiDade: false,
        errorMessage:
          'Address verification timed out. Please check your connection and try again.',
      };
    }

    return {
      isValid: false,
      isMiamiDade: false,
      errorMessage:
        'Unable to verify address. Please check your connection and try again.',
    };
  }
}
