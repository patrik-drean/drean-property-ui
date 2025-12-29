import { getZillowUrl } from '../zillowLinks';

describe('getZillowUrl', () => {
  it('should generate correct Zillow URL for simple address', () => {
    const address = '123 Main St, Anytown, CA 12345';
    const url = getZillowUrl(address);

    expect(url).toBe('https://www.zillow.com/homes/123%20Main%20St%2C%20Anytown%2C%20CA%2012345_rb/');
  });

  it('should properly encode special characters', () => {
    const address = '456 Oak Ave #2, City & Town, ST 67890';
    const url = getZillowUrl(address);

    expect(url).toContain('456%20Oak%20Ave%20%232');
    expect(url).toContain('City%20%26%20Town');
  });

  it('should handle addresses with apostrophes', () => {
    const address = "789 O'Connor St, Dublin, CA 94568";
    const url = getZillowUrl(address);

    // Apostrophes are not encoded by encodeURIComponent
    expect(url).toContain("O'Connor");
  });

  it('should handle addresses with commas and spaces', () => {
    const address = '321 Pine Rd, Apt 5, Seattle, WA 98101';
    const url = getZillowUrl(address);

    expect(url).toBe('https://www.zillow.com/homes/321%20Pine%20Rd%2C%20Apt%205%2C%20Seattle%2C%20WA%2098101_rb/');
  });

  it('should handle empty string', () => {
    const address = '';
    const url = getZillowUrl(address);

    expect(url).toBe('https://www.zillow.com/homes/_rb/');
  });

  it('should handle addresses with numbers only', () => {
    const address = '12345';
    const url = getZillowUrl(address);

    expect(url).toBe('https://www.zillow.com/homes/12345_rb/');
  });

  it('should handle addresses with parentheses', () => {
    const address = '555 Test St (Building A), City, ST 11111';
    const url = getZillowUrl(address);

    expect(url).toContain('(Building%20A)');
  });

  it('should handle addresses with slashes', () => {
    const address = '777 Main/Oak Corner, Town, ST 22222';
    const url = getZillowUrl(address);

    expect(url).toContain('Main%2FOak');
  });

  it('should generate valid URL that starts with https', () => {
    const address = '123 Test St';
    const url = getZillowUrl(address);

    expect(url).toMatch(/^https:\/\//);
  });

  it('should include zillow.com domain', () => {
    const address = '123 Test St';
    const url = getZillowUrl(address);

    expect(url).toContain('zillow.com');
  });

  it('should end with _rb/ suffix', () => {
    const address = '123 Test St';
    const url = getZillowUrl(address);

    expect(url).toMatch(/_rb\/$/);
  });

  it('should handle very long addresses', () => {
    const address = '12345 Very Long Street Name With Many Words And Characters, Apartment Number 999, Building Complex Name, City With Long Name, ST 12345-6789';
    const url = getZillowUrl(address);

    expect(url).toContain('https://www.zillow.com/homes/');
    expect(url).toMatch(/_rb\/$/);
  });

  it('should handle addresses with dots', () => {
    const address = '123 N.E. Main St., Portland, OR 97201';
    const url = getZillowUrl(address);

    expect(url).toContain('N.E.');
  });

  it('should handle Unicode characters', () => {
    const address = '123 Café St, Montréal, QC H3A 1A1';
    const url = getZillowUrl(address);

    expect(url).toContain('Caf%C3%A9');
    expect(url).toContain('Montr%C3%A9al');
  });
});
