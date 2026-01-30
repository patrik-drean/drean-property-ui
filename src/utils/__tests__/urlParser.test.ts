import { parseListingUrl, ParsedAddress, UrlParseResult } from '../urlParser';

describe('parseListingUrl', () => {
  // ============================================
  // Input Validation Tests
  // ============================================
  describe('input validation', () => {
    it('should return error for null input', () => {
      const result = parseListingUrl(null as unknown as string);

      expect(result.success).toBe(false);
      expect(result.error).toBe('URL is required');
      expect(result.source).toBe('unknown');
    });

    it('should return error for undefined input', () => {
      const result = parseListingUrl(undefined as unknown as string);

      expect(result.success).toBe(false);
      expect(result.error).toBe('URL is required');
    });

    it('should return error for empty string', () => {
      const result = parseListingUrl('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('URL is required');
    });

    it('should return error for invalid URL format', () => {
      const result = parseListingUrl('not-a-url');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid URL format. Please provide a valid property listing URL.');
      expect(result.originalUrl).toBe('not-a-url');
    });

    it('should return error for malformed URL', () => {
      const result = parseListingUrl('http://');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid URL format');
    });

    it('should trim whitespace from URL', () => {
      const result = parseListingUrl('  https://www.zillow.com/homedetails/123-Main-St-San-Antonio-TX-78227/12345_zpid/  ');

      expect(result.success).toBe(true);
      expect(result.originalUrl).not.toContain('  ');
    });
  });

  // ============================================
  // Zillow URL Tests
  // ============================================
  describe('Zillow URLs', () => {
    it('should parse standard Zillow URL with zpid', () => {
      const result = parseListingUrl(
        'https://www.zillow.com/homedetails/8811-Dale-Valley-Dr-San-Antonio-TX-78227/25941656_zpid/'
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('zillow');
      expect(result.address).toBeDefined();
      expect(result.address?.state).toBe('TX');
      expect(result.address?.zip).toBe('78227');
      expect(result.address?.fullAddress).toContain('San Antonio');
      expect(result.address?.fullAddress).toContain('TX 78227');
    });

    it('should parse Zillow URL without trailing slash', () => {
      const result = parseListingUrl(
        'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid'
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('zillow');
      expect(result.address?.state).toBe('TX');
      expect(result.address?.zip).toBe('78701');
    });

    it('should parse Zillow URL without zpid suffix', () => {
      const result = parseListingUrl(
        'https://www.zillow.com/homedetails/456-Oak-Ave-Houston-TX-77001'
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('zillow');
      expect(result.address?.state).toBe('TX');
      expect(result.address?.zip).toBe('77001');
    });

    it('should handle Zillow URL with multi-word city', () => {
      const result = parseListingUrl(
        'https://www.zillow.com/homedetails/100-Test-Dr-San-Antonio-TX-78227/99999_zpid/'
      );

      expect(result.success).toBe(true);
      expect(result.address?.city).toContain('San Antonio');
    });

    it('should handle Zillow URL with street type in address', () => {
      const result = parseListingUrl(
        'https://www.zillow.com/homedetails/2011-Cincinnati-Ave-Dallas-TX-75201/12345_zpid/'
      );

      expect(result.success).toBe(true);
      expect(result.address?.street).toContain('Cincinnati Ave');
    });

    it('should be case insensitive for state', () => {
      const result = parseListingUrl(
        'https://www.zillow.com/homedetails/123-Main-St-Austin-tx-78701/12345_zpid/'
      );

      expect(result.success).toBe(true);
      expect(result.address?.state).toBe('TX');
    });
  });

  // ============================================
  // Redfin URL Tests
  // ============================================
  describe('Redfin URLs', () => {
    it('should parse standard Redfin URL', () => {
      const result = parseListingUrl(
        'https://www.redfin.com/TX/San-Antonio/2011-Cincinnati-Ave-78228/home/48735187'
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('redfin');
      expect(result.address).toBeDefined();
      expect(result.address?.city).toBe('San Antonio');
      expect(result.address?.state).toBe('TX');
      expect(result.address?.zip).toBe('78228');
      expect(result.address?.street).toContain('Cincinnati Ave');
    });

    it('should parse Redfin URL with single-word city', () => {
      const result = parseListingUrl(
        'https://www.redfin.com/TX/Dallas/123-Main-St-75201/home/12345'
      );

      expect(result.success).toBe(true);
      expect(result.address?.city).toBe('Dallas');
      expect(result.address?.state).toBe('TX');
    });

    it('should handle Redfin URL with hyphenated street name', () => {
      const result = parseListingUrl(
        'https://www.redfin.com/CA/Los-Angeles/456-Sunset-Blvd-90028/home/99999'
      );

      expect(result.success).toBe(true);
      expect(result.address?.city).toBe('Los Angeles');
      expect(result.address?.state).toBe('CA');
    });

    it('should normalize street name properly', () => {
      const result = parseListingUrl(
        'https://www.redfin.com/TX/Austin/789-oak-lane-78701/home/11111'
      );

      expect(result.success).toBe(true);
      expect(result.address?.street).toBe('789 Oak Lane');
    });
  });

  // ============================================
  // HAR URL Tests
  // ============================================
  describe('HAR URLs', () => {
    it('should parse standard HAR URL', () => {
      const result = parseListingUrl(
        'https://www.har.com/homedetail/4543-wrangler-run-san-antonio-tx-78223/12168263'
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('har');
      expect(result.address).toBeDefined();
      expect(result.address?.state).toBe('TX');
      expect(result.address?.zip).toBe('78223');
    });

    it('should parse HAR URL with different street type', () => {
      const result = parseListingUrl(
        'https://www.har.com/homedetail/123-main-st-houston-tx-77001/99999'
      );

      expect(result.success).toBe(true);
      expect(result.address?.zip).toBe('77001');
    });

    it('should handle multi-word city in HAR URL', () => {
      const result = parseListingUrl(
        'https://www.har.com/homedetail/100-test-dr-san-antonio-tx-78227/88888'
      );

      expect(result.success).toBe(true);
      expect(result.address?.city).toContain('San Antonio');
    });
  });

  // ============================================
  // Realtor.com URL Tests
  // ============================================
  describe('Realtor.com URLs', () => {
    it('should parse standard Realtor URL', () => {
      const result = parseListingUrl(
        'https://www.realtor.com/realestateandhomes-detail/4543-Wrangler-Run_San-Antonio_TX_78223_M82382-81760'
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('realtor');
      expect(result.address).toBeDefined();
      expect(result.address?.street).toBe('4543 Wrangler Run');
      expect(result.address?.city).toBe('San Antonio');
      expect(result.address?.state).toBe('TX');
      expect(result.address?.zip).toBe('78223');
    });

    it('should parse Realtor URL with hyphenated street', () => {
      const result = parseListingUrl(
        'https://www.realtor.com/realestateandhomes-detail/123-Oak-Tree-Lane_Dallas_TX_75201_M12345-67890'
      );

      expect(result.success).toBe(true);
      expect(result.address?.street).toBe('123 Oak Tree Lane');
      expect(result.address?.city).toBe('Dallas');
    });

    it('should handle Realtor URL with single word city', () => {
      const result = parseListingUrl(
        'https://www.realtor.com/realestateandhomes-detail/456-Main-St_Houston_TX_77001_M99999-11111'
      );

      expect(result.success).toBe(true);
      expect(result.address?.city).toBe('Houston');
    });
  });

  // ============================================
  // Trulia URL Tests
  // ============================================
  describe('Trulia URLs', () => {
    it('should parse standard Trulia URL', () => {
      const result = parseListingUrl(
        'https://www.trulia.com/home/2011-cincinnati-ave-san-antonio-tx-78228-168908058'
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('trulia');
      expect(result.address).toBeDefined();
      expect(result.address?.state).toBe('TX');
      expect(result.address?.zip).toBe('78228');
    });

    it('should parse Trulia URL with different street type', () => {
      const result = parseListingUrl(
        'https://www.trulia.com/home/123-main-st-dallas-tx-75201-99999999'
      );

      expect(result.success).toBe(true);
      expect(result.address?.zip).toBe('75201');
    });

    it('should handle Trulia URL with multi-word city', () => {
      const result = parseListingUrl(
        'https://www.trulia.com/home/456-oak-dr-san-francisco-ca-94102-88888888'
      );

      expect(result.success).toBe(true);
      expect(result.address?.state).toBe('CA');
    });
  });

  // ============================================
  // Unsupported/Unknown URL Tests
  // ============================================
  describe('unsupported URLs', () => {
    it('should return error for completely unsupported domain', () => {
      const result = parseListingUrl('https://www.random-site.com/property/123');

      expect(result.success).toBe(false);
      expect(result.source).toBe('unknown');
      expect(result.error).toContain('Could not extract');
    });

    it('should return error for generic real estate site without parseable pattern', () => {
      const result = parseListingUrl('https://www.homes.com/listing/xyz123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Could not extract');
    });

    it('should preserve original URL in error response', () => {
      const url = 'https://www.example.com/not-a-property';
      const result = parseListingUrl(url);

      expect(result.originalUrl).toBe(url);
    });

    it('should try generic extraction for unknown site with address pattern', () => {
      const result = parseListingUrl(
        'https://www.unknown-realty.com/listing/123-main-st-austin-tx-78701'
      );

      // Generic extraction should work if pattern matches
      expect(result.source).toBe('unknown');
      if (result.success) {
        expect(result.address?.state).toBe('TX');
        expect(result.address?.zip).toBe('78701');
      }
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('edge cases', () => {
    it('should handle URL with query parameters', () => {
      const result = parseListingUrl(
        'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/?utm_source=test'
      );

      expect(result.success).toBe(true);
      expect(result.address?.zip).toBe('78701');
    });

    it('should handle URL with fragment', () => {
      const result = parseListingUrl(
        'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/#photos'
      );

      expect(result.success).toBe(true);
    });

    it('should handle mixed case domain', () => {
      const result = parseListingUrl(
        'https://WWW.ZILLOW.COM/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/'
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('zillow');
    });

    it('should handle URL without www prefix', () => {
      const result = parseListingUrl(
        'https://zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/'
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('zillow');
    });

    it('should handle http instead of https', () => {
      const result = parseListingUrl(
        'http://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/'
      );

      expect(result.success).toBe(true);
    });

    it('should correctly build full address', () => {
      const result = parseListingUrl(
        'https://www.realtor.com/realestateandhomes-detail/123-Main-St_Dallas_TX_75201_M99999'
      );

      expect(result.success).toBe(true);
      expect(result.address?.fullAddress).toBe('123 Main St, Dallas, TX 75201');
    });
  });

  // ============================================
  // Address Parsing Accuracy
  // ============================================
  describe('address parsing accuracy', () => {
    it('should correctly identify common street types', () => {
      const streetTypes = [
        { url: 'https://www.realtor.com/realestateandhomes-detail/123-Oak-Ave_City_TX_75201_M1', expected: 'Ave' },
        { url: 'https://www.realtor.com/realestateandhomes-detail/456-Main-St_City_TX_75201_M1', expected: 'St' },
        { url: 'https://www.realtor.com/realestateandhomes-detail/789-Park-Blvd_City_TX_75201_M1', expected: 'Blvd' },
        { url: 'https://www.realtor.com/realestateandhomes-detail/100-Forest-Dr_City_TX_75201_M1', expected: 'Dr' },
        { url: 'https://www.realtor.com/realestateandhomes-detail/200-River-Rd_City_TX_75201_M1', expected: 'Rd' },
        { url: 'https://www.realtor.com/realestateandhomes-detail/300-Sunset-Ln_City_TX_75201_M1', expected: 'Ln' },
      ];

      streetTypes.forEach(({ url, expected }) => {
        const result = parseListingUrl(url);
        expect(result.success).toBe(true);
        expect(result.address?.street).toContain(expected);
      });
    });

    it('should capitalize words correctly', () => {
      const result = parseListingUrl(
        'https://www.redfin.com/TX/san-antonio/123-MAIN-ST-78201/home/12345'
      );

      expect(result.success).toBe(true);
      expect(result.address?.city).toBe('San Antonio');
      expect(result.address?.street).toBe('123 Main St');
    });

    it('should handle numeric street names', () => {
      const result = parseListingUrl(
        'https://www.realtor.com/realestateandhomes-detail/123-5th-Ave_New-York_NY_10001_M99999'
      );

      expect(result.success).toBe(true);
      expect(result.address?.street).toContain('5th');
    });
  });

  // ============================================
  // Return Type Verification
  // ============================================
  describe('return type verification', () => {
    it('should always return originalUrl', () => {
      const url = 'https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/';
      const result = parseListingUrl(url);

      expect(result.originalUrl).toBe(url);
    });

    it('should always return source', () => {
      const result = parseListingUrl('https://www.zillow.com/homedetails/123-Main-St-Austin-TX-78701/12345_zpid/');

      expect(result.source).toBeDefined();
      expect(['zillow', 'redfin', 'har', 'realtor', 'trulia', 'unknown']).toContain(result.source);
    });

    it('should include all address fields on success', () => {
      const result = parseListingUrl(
        'https://www.realtor.com/realestateandhomes-detail/123-Main-St_Dallas_TX_75201_M99999'
      );

      expect(result.success).toBe(true);
      expect(result.address).toBeDefined();
      expect(result.address?.street).toBeDefined();
      expect(result.address?.city).toBeDefined();
      expect(result.address?.state).toBeDefined();
      expect(result.address?.zip).toBeDefined();
      expect(result.address?.fullAddress).toBeDefined();
    });

    it('should not include address on failure', () => {
      const result = parseListingUrl('https://www.example.com/not-valid');

      expect(result.success).toBe(false);
      expect(result.address).toBeUndefined();
    });

    it('should include error message on failure', () => {
      const result = parseListingUrl('https://www.example.com/not-valid');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });
  });
});
