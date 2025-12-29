/**
 * Generates a Zillow search URL for a given property address
 * @param address - Full property address (e.g., "123 Main St, Austin, TX 78701")
 * @returns Zillow search URL
 */
export const getZillowUrl = (address: string): string => {
  const encoded = encodeURIComponent(address);
  return `https://www.zillow.com/homes/${encoded}_rb/`;
};
