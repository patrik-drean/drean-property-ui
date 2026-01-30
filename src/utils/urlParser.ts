/**
 * URL Parser Utility
 * Parses property listing URLs from various real estate sites and extracts address information.
 * Ported from leads-lambda/src/services/urlParserService.ts
 */

export interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  fullAddress: string;
}

export interface UrlParseResult {
  success: boolean;
  source: 'zillow' | 'redfin' | 'har' | 'realtor' | 'trulia' | 'unknown';
  originalUrl: string;
  address?: ParsedAddress;
  error?: string;
}

/**
 * Parse a property listing URL from any supported site.
 * Extracts address components from URL patterns.
 *
 * Supported sites:
 * - Zillow: zillow.com/homedetails/{address-slug}/{zpid}_zpid/
 * - Redfin: redfin.com/{ST}/{City}/{Street-ZIP}/home/{id}
 * - HAR: har.com/homedetail/{street-city-state-zip}/{id}
 * - Realtor: realtor.com/realestateandhomes-detail/{Street}_{City}_{ST}_{ZIP}_...
 * - Trulia: trulia.com/home/{address-city-state-zip-id}
 */
export function parseListingUrl(url: string): UrlParseResult {
  if (!url || typeof url !== 'string') {
    return {
      success: false,
      source: 'unknown',
      originalUrl: url || '',
      error: 'URL is required',
    };
  }

  const trimmedUrl = url.trim();

  // Validate URL format
  try {
    new URL(trimmedUrl);
  } catch {
    return {
      success: false,
      source: 'unknown',
      originalUrl: trimmedUrl,
      error: 'Invalid URL format. Please provide a valid property listing URL.',
    };
  }

  const normalizedUrl = trimmedUrl.toLowerCase();

  // Try Zillow
  if (normalizedUrl.includes('zillow.com')) {
    const zillowResult = parseZillowUrl(trimmedUrl);
    if (zillowResult) {
      return {
        success: true,
        source: 'zillow',
        originalUrl: trimmedUrl,
        address: zillowResult,
      };
    }
  }

  // Try Redfin
  if (normalizedUrl.includes('redfin.com')) {
    const redfinResult = parseRedfinUrl(trimmedUrl);
    if (redfinResult) {
      return {
        success: true,
        source: 'redfin',
        originalUrl: trimmedUrl,
        address: redfinResult,
      };
    }
  }

  // Try HAR
  if (normalizedUrl.includes('har.com')) {
    const harResult = parseHarUrl(trimmedUrl);
    if (harResult) {
      return {
        success: true,
        source: 'har',
        originalUrl: trimmedUrl,
        address: harResult,
      };
    }
  }

  // Try Realtor.com
  if (normalizedUrl.includes('realtor.com')) {
    const realtorResult = parseRealtorUrl(trimmedUrl);
    if (realtorResult) {
      return {
        success: true,
        source: 'realtor',
        originalUrl: trimmedUrl,
        address: realtorResult,
      };
    }
  }

  // Try Trulia
  if (normalizedUrl.includes('trulia.com')) {
    const truliaResult = parseTruliaUrl(trimmedUrl);
    if (truliaResult) {
      return {
        success: true,
        source: 'trulia',
        originalUrl: trimmedUrl,
        address: truliaResult,
      };
    }
  }

  // Try generic extraction as fallback
  const genericResult = tryGenericExtraction(trimmedUrl);
  if (genericResult) {
    return {
      success: true,
      source: 'unknown',
      originalUrl: trimmedUrl,
      address: genericResult,
    };
  }

  return {
    success: false,
    source: 'unknown',
    originalUrl: trimmedUrl,
    error: 'Could not extract property address from this URL. Please enter the address manually.',
  };
}

/**
 * Parse Zillow URL
 * Format: zillow.com/homedetails/8811-Dale-Valley-Dr-San-Antonio-TX-78227/25941656_zpid/
 */
function parseZillowUrl(url: string): ParsedAddress | null {
  // Pattern: /homedetails/street-city-state-zip/zpid
  const pattern = /zillow\.com\/homedetails\/([^/]+)-([A-Z]{2})-(\d{5})\/\d+_zpid/i;
  const match = url.match(pattern);

  if (!match) {
    // Try alternative pattern without zpid suffix
    const altPattern = /zillow\.com\/homedetails\/([^/]+)-([A-Z]{2})-(\d{5})/i;
    const altMatch = url.match(altPattern);
    if (!altMatch) return null;

    const [, addressPart, state, zip] = altMatch;
    return parseZillowAddressPart(addressPart, state, zip);
  }

  const [, addressPart, state, zip] = match;
  return parseZillowAddressPart(addressPart, state, zip);
}

/**
 * Parse the address part from Zillow URL
 */
function parseZillowAddressPart(addressPart: string, state: string, zip: string): ParsedAddress | null {
  // addressPart: "8811-Dale-Valley-Dr-San-Antonio"
  const parts = addressPart.split('-');

  if (parts.length < 3) return null;

  // Find where street ends and city begins
  const { street, city } = splitStreetAndCity(parts);

  if (!street || !city) return null;

  return buildAddress(street, city, state.toUpperCase(), zip);
}

/**
 * Parse Redfin URL
 * Format: redfin.com/TX/San-Antonio/2011-Cincinnati-Ave-78228/home/48735187
 */
function parseRedfinUrl(url: string): ParsedAddress | null {
  // Pattern: /STATE/City-Name/Street-Address-ZIP/home/ID
  const pattern = /redfin\.com\/([A-Z]{2})\/([^/]+)\/([^/]+)-(\d{5})\/home/i;
  const match = url.match(pattern);

  if (!match) return null;

  const [, state, cityRaw, streetRaw, zip] = match;

  const street = normalizeStreet(streetRaw);
  const city = normalizeCity(cityRaw);

  if (!street || !city || !state) return null;

  return buildAddress(street, city, state.toUpperCase(), zip);
}

/**
 * Parse HAR URL
 * Format: har.com/homedetail/4543-wrangler-run-san-antonio-tx-78223/12168263
 */
function parseHarUrl(url: string): ParsedAddress | null {
  // Pattern: /homedetail/street-city-state-zip/id
  const pattern = /har\.com\/homedetail\/([^/]+)-([a-z]{2})-(\d{5})\/\d+/i;
  const match = url.match(pattern);

  if (!match) return null;

  const [, addressPart, state, zip] = match;

  // addressPart contains street-city, need to split
  const parts = addressPart.split('-');

  if (parts.length < 3) return null;

  // Find where street ends and city begins
  const { street, city } = splitStreetAndCity(parts);

  if (!street || !city) return null;

  return buildAddress(street, city, state.toUpperCase(), zip);
}

/**
 * Parse Realtor.com URL
 * Format: realtor.com/realestateandhomes-detail/4543-Wrangler-Run_San-Antonio_TX_78223_M82382-81760
 */
function parseRealtorUrl(url: string): ParsedAddress | null {
  // Pattern: /realestateandhomes-detail/Street_City_ST_ZIP_M...
  const pattern = /realtor\.com\/realestateandhomes-detail\/([^_]+)_([^_]+)_([A-Z]{2})_(\d{5})/i;
  const match = url.match(pattern);

  if (!match) return null;

  const [, streetRaw, cityRaw, state, zip] = match;

  const street = normalizeStreet(streetRaw);
  const city = normalizeCity(cityRaw);

  if (!street || !city || !state) return null;

  return buildAddress(street, city, state.toUpperCase(), zip);
}

/**
 * Parse Trulia URL
 * Format: trulia.com/home/2011-cincinnati-ave-san-antonio-tx-78228-168908058
 */
function parseTruliaUrl(url: string): ParsedAddress | null {
  // Pattern: /home/address-parts-state-zip-id
  const pattern = /trulia\.com\/home\/(.+)-([a-z]{2})-(\d{5})-\d+$/i;
  const match = url.match(pattern);

  if (!match) return null;

  const [, addressPart, state, zip] = match;

  // addressPart: "2011-cincinnati-ave-san-antonio"
  const parts = addressPart.split('-');

  if (parts.length < 4) return null;

  // Find where street ends and city begins
  const { street, city } = splitStreetAndCity(parts);

  if (!street || !city) return null;

  return buildAddress(street, city, state.toUpperCase(), zip);
}

/**
 * Try generic extraction from URL path
 * Looks for patterns like: street-city-state-zip
 */
function tryGenericExtraction(url: string): ParsedAddress | null {
  let path = '';
  try {
    const urlObj = new URL(url);
    path = decodeURIComponent(urlObj.pathname);
  } catch {
    return null;
  }

  // Pattern: anything-city-XX-XXXXX (state and zip at end)
  const genericPattern = /([a-z0-9-]+)-([a-z]{2})-(\d{5})/i;
  const match = path.match(genericPattern);

  if (!match) return null;

  const [, addressPart, state, zip] = match;
  const parts = addressPart.split('-');

  if (parts.length < 3) return null;

  const { street, city } = splitStreetAndCity(parts);

  if (!street || !city) return null;

  return buildAddress(street, city, state.toUpperCase(), zip);
}

/**
 * Split address parts into street and city
 * Heuristic: Street typically starts with a number
 * City is usually 1-3 parts after the street
 */
function splitStreetAndCity(parts: string[]): { street: string; city: string } {
  if (parts.length < 3) {
    return { street: '', city: '' };
  }

  // If first part starts with a number, it's likely the street number
  const startsWithNumber = /^\d/.test(parts[0]);

  if (startsWithNumber) {
    // Find where street ends
    // Street typically includes: number, street name, street type (ave, st, blvd, etc.)
    const streetTypes = [
      'ave', 'avenue', 'st', 'street', 'blvd', 'boulevard', 'dr', 'drive',
      'rd', 'road', 'ln', 'lane', 'ct', 'court', 'way', 'pl', 'place',
      'cir', 'circle', 'run', 'loop', 'trail', 'trl', 'pkwy', 'parkway',
      'ter', 'terrace', 'hwy', 'highway', 'pass', 'path', 'xing', 'crossing'
    ];

    let streetEndIndex = 1; // At minimum, include the number and one more part

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].toLowerCase();
      if (streetTypes.includes(part)) {
        streetEndIndex = i;
        break;
      }
      // If we find a number after the first part, it might be part of street (e.g., "123 Main St")
      // But if it's later, it might be something else
      if (i < parts.length - 2) {
        streetEndIndex = i;
      }
    }

    // Ensure we leave at least one part for city
    if (streetEndIndex >= parts.length - 1) {
      streetEndIndex = Math.max(1, parts.length - 2);
    }

    const streetParts = parts.slice(0, streetEndIndex + 1);
    const cityParts = parts.slice(streetEndIndex + 1);

    const street = streetParts.map(p => capitalize(p)).join(' ');
    const city = cityParts.map(p => capitalize(p)).join(' ');

    return { street, city };
  }

  // If doesn't start with number, assume first 2/3 are street, rest is city
  const midPoint = Math.ceil(parts.length / 2);
  const streetParts = parts.slice(0, midPoint);
  const cityParts = parts.slice(midPoint);

  const street = streetParts.map(p => capitalize(p)).join(' ');
  const city = cityParts.map(p => capitalize(p)).join(' ');

  return { street, city };
}

/**
 * Normalize street name
 * Replace hyphens with spaces, capitalize each word
 */
function normalizeStreet(street: string): string {
  return street
    .replace(/-/g, ' ')
    .split(' ')
    .map(p => capitalize(p))
    .join(' ');
}

/**
 * Normalize city name
 * Replace hyphens with spaces, capitalize each word
 */
function normalizeCity(city: string): string {
  return city
    .replace(/-/g, ' ')
    .split(' ')
    .map(p => capitalize(p))
    .join(' ');
}

/**
 * Capitalize first letter of a word
 */
function capitalize(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Build a ParsedAddress object
 */
function buildAddress(street: string, city: string, state: string, zip: string): ParsedAddress {
  const fullAddress = zip
    ? `${street}, ${city}, ${state} ${zip}`
    : `${street}, ${city}, ${state}`;

  return { street, city, state, zip, fullAddress };
}
