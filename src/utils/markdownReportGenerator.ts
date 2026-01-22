import { Property, PropertyLead, SaleComparable } from '../types/property';
import { InvestmentCalculations } from '../types/investmentReport';
import { calculateInvestmentMetrics, formatCurrency, formatPercentage } from '../services/investmentReportService';

interface MarkdownReportOptions {
  property: Property;
  linkedLead?: PropertyLead | null;
}

/**
 * Generates a comprehensive markdown report for a property investment analysis.
 * Includes all data from the Investment Report page plus notes and lead metadata.
 */
export function generateMarkdownReport(options: MarkdownReportOptions): string {
  const { property, linkedLead } = options;
  const calculations = calculateInvestmentMetrics(property);

  // Build markdown sections
  let markdown = '';

  // Header section
  markdown += generateHeader(property);

  // Investment summary section
  markdown += generateInvestmentSummary(calculations);

  // Value breakdown section
  markdown += generateValueBreakdown(calculations);

  // Market analysis (if Rentcast data exists)
  if (property.hasRentcastData) {
    markdown += generateMarketAnalysis(property);
  }

  // Property notes
  markdown += generateNotesSection(property.notes);

  // Lead metadata (if linked)
  if (linkedLead?.metadata) {
    markdown += generateLeadMetadata(linkedLead);
  }

  // Footer
  markdown += generateFooter();

  return markdown;
}

/**
 * Downloads the markdown report as a .md file.
 */
export function downloadMarkdownReport(property: Property, linkedLead?: PropertyLead | null): void {
  const markdown = generateMarkdownReport({ property, linkedLead });
  const filename = sanitizeFilename(property.address) + '-AI-Report.md';

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sanitizes an address string into a valid filename.
 * Removes special characters, replaces spaces with hyphens, and limits length.
 */
export function sanitizeFilename(address: string): string {
  return address
    .trim()                           // Trim whitespace first
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')             // Replace spaces with hyphens
    .replace(/-+/g, '-')              // Collapse multiple hyphens
    .replace(/^-|-$/g, '')            // Remove leading/trailing hyphens
    .substring(0, 100);               // Limit length
}

/**
 * Generates the header section with property details and Zillow link.
 */
function generateHeader(property: Property): string {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let header = `# Investment Report: ${property.address}\n\n`;
  header += `**Generated**: ${generatedDate}\n`;

  if (property.squareFootage) {
    header += `**Square Footage**: ${property.squareFootage.toLocaleString()} sq ft\n`;
  }

  if (property.units) {
    header += `**Units**: ${property.units}\n`;
  }

  if (property.zillowLink) {
    header += `**Zillow**: ${property.zillowLink}\n`;
  }

  header += '\n---\n\n';

  return header;
}

/**
 * Generates the Investment Summary section with scores and key metrics.
 */
function generateInvestmentSummary(calculations: InvestmentCalculations): string {
  let section = `## Investment Summary\n\n`;

  section += `| Metric | Value |\n`;
  section += `|--------|-------|\n`;
  section += `| Hold Score | ${Math.round(calculations.holdScore)}/10 |\n`;
  section += `| Flip Score | ${Math.round(calculations.flipScore)}/10 |\n`;
  section += `| Rent Ratio | ${formatPercentage(calculations.rentRatio)} |\n`;
  section += `| Monthly Cash Flow | ${formatCurrency(calculations.monthlyCashflow)} |\n`;
  section += `| ARV Ratio | ${formatPercentage(calculations.arvRatio)} |\n`;

  section += '\n---\n\n';

  return section;
}

/**
 * Generates the Value Breakdown section showing ratio calculations.
 */
function generateValueBreakdown(calculations: InvestmentCalculations): string {
  let section = `## Value Breakdown\n\n`;

  // Rent Ratio Calculation
  section += `### Rent Ratio Calculation\n`;
  section += `- Monthly Rent: ${formatCurrency(calculations.monthlyIncome)}\n`;
  section += `- Purchase Price: ${formatCurrency(calculations.purchasePrice)}\n`;
  section += `- Rehab Costs: ${formatCurrency(calculations.rehabCosts)}\n`;
  section += `- **Result**: ${formatPercentage(calculations.rentRatio)}\n\n`;

  // ARV Ratio Calculation
  section += `### ARV Ratio Calculation\n`;
  section += `- Purchase Price: ${formatCurrency(calculations.purchasePrice)}\n`;
  section += `- Rehab Costs: ${formatCurrency(calculations.rehabCosts)}\n`;
  section += `- After Repair Value (ARV): ${formatCurrency(calculations.arv)}\n`;
  section += `- **Result**: ${formatPercentage(calculations.arvRatio)}\n`;

  section += '\n---\n\n';

  return section;
}

/**
 * Generates the Market Analysis section with RentCast data and comparables.
 */
function generateMarketAnalysis(property: Property): string {
  const { rentCastEstimates, saleComparables } = property;

  let section = `## Market Analysis\n\n`;

  // RentCast Valuation
  section += `### RentCast Valuation (85% Confidence)\n`;
  section += `- **Price Estimate**: ${formatCurrency(rentCastEstimates.price)} (Range: ${formatCurrency(rentCastEstimates.priceLow)} - ${formatCurrency(rentCastEstimates.priceHigh)})\n`;
  section += `- **Rent Estimate**: ${formatCurrency(rentCastEstimates.rent)}/mo (Range: ${formatCurrency(rentCastEstimates.rentLow)} - ${formatCurrency(rentCastEstimates.rentHigh)})\n`;

  if (rentCastEstimates.arv && rentCastEstimates.arv > 0) {
    section += `- **ARV Estimate**: ${formatCurrency(rentCastEstimates.arv)}`;
    if (rentCastEstimates.arvPerSqft) {
      section += ` (${formatCurrency(rentCastEstimates.arvPerSqft)}/sqft)`;
    }
    section += '\n';
  }

  if (rentCastEstimates.asIsValue && rentCastEstimates.asIsValue > 0) {
    section += `- **As-Is Value**: ${formatCurrency(rentCastEstimates.asIsValue)}`;
    if (rentCastEstimates.asIsValuePerSqft) {
      section += ` (${formatCurrency(rentCastEstimates.asIsValuePerSqft)}/sqft)`;
    }
    section += '\n';
  }

  section += '\n';

  // Sale Comparables
  if (saleComparables && saleComparables.length > 0) {
    section += generateComparablesSection(saleComparables);
  }

  section += '---\n\n';

  return section;
}

/**
 * Generates the comparables table section.
 */
function generateComparablesSection(comparables: SaleComparable[]): string {
  let section = `### Sale Comparables\n\n`;

  // Check if we have tier data
  const hasTierData = comparables.some(c => c.tier && c.tier !== 'Mid');

  // Table header
  section += `| Address | Price | $/SqFt | Beds/Baths | SqFt | Distance |`;
  if (hasTierData) {
    section += ` Tier |`;
  }
  section += '\n';

  section += `|---------|-------|--------|------------|------|----------|`;
  if (hasTierData) {
    section += `------|`;
  }
  section += '\n';

  // Table rows
  for (const comp of comparables) {
    const pricePerSqft = comp.pricePerSqft && comp.pricePerSqft > 0
      ? comp.pricePerSqft
      : comp.squareFootage
        ? comp.price / comp.squareFootage
        : 0;

    section += `| ${comp.address} `;
    section += `| $${comp.price.toLocaleString()} `;
    section += `| $${pricePerSqft > 0 ? pricePerSqft.toFixed(0) : 'N/A'} `;
    section += `| ${comp.bedrooms || '-'}/${comp.bathrooms || '-'} `;
    section += `| ${comp.squareFootage ? comp.squareFootage.toLocaleString() : 'N/A'} `;
    section += `| ${comp.distance.toFixed(2)} mi `;
    if (hasTierData) {
      section += `| ${comp.tier || 'Mid'} `;
    }
    section += '|\n';
  }

  section += '\n';

  // Calculate and display tier averages
  if (hasTierData) {
    section += generateTierAverages(comparables);
  } else {
    section += generateAllCompsAverage(comparables);
  }

  return section;
}

/**
 * Calculates and formats tier averages for comparables.
 */
function generateTierAverages(comparables: SaleComparable[]): string {
  let section = `**Averages by Tier:**\n`;

  // Quality comps
  const qualityComps = comparables.filter(c => c.tier === 'Quality');
  if (qualityComps.length > 0) {
    const qualityAvg = qualityComps.reduce((sum, c) => sum + c.price, 0) / qualityComps.length;
    const qualityCompsWithSqft = qualityComps.filter(c => c.squareFootage && c.squareFootage > 0);
    const qualityAvgPpsf = qualityCompsWithSqft.length > 0
      ? qualityCompsWithSqft.reduce((sum, c) => sum + (c.price / c.squareFootage!), 0) / qualityCompsWithSqft.length
      : 0;
    section += `- Quality (${qualityComps.length} comps): ${formatCurrency(qualityAvg)} ($${qualityAvgPpsf.toFixed(0)}/sqft)\n`;
  }

  // Mid comps
  const midComps = comparables.filter(c => c.tier === 'Mid');
  if (midComps.length > 0) {
    const midAvg = midComps.reduce((sum, c) => sum + c.price, 0) / midComps.length;
    const midCompsWithSqft = midComps.filter(c => c.squareFootage && c.squareFootage > 0);
    const midAvgPpsf = midCompsWithSqft.length > 0
      ? midCompsWithSqft.reduce((sum, c) => sum + (c.price / c.squareFootage!), 0) / midCompsWithSqft.length
      : 0;
    section += `- Mid (${midComps.length} comps): ${formatCurrency(midAvg)} ($${midAvgPpsf.toFixed(0)}/sqft)\n`;
  }

  // As-Is comps
  const asIsComps = comparables.filter(c => c.tier === 'As-Is');
  if (asIsComps.length > 0) {
    const asIsAvg = asIsComps.reduce((sum, c) => sum + c.price, 0) / asIsComps.length;
    const asIsCompsWithSqft = asIsComps.filter(c => c.squareFootage && c.squareFootage > 0);
    const asIsAvgPpsf = asIsCompsWithSqft.length > 0
      ? asIsCompsWithSqft.reduce((sum, c) => sum + (c.price / c.squareFootage!), 0) / asIsCompsWithSqft.length
      : 0;
    section += `- As-Is (${asIsComps.length} comps): ${formatCurrency(asIsAvg)} ($${asIsAvgPpsf.toFixed(0)}/sqft)\n`;
  }

  // All comps
  section += generateAllCompsAverage(comparables);

  return section;
}

/**
 * Generates the all comps average line.
 */
function generateAllCompsAverage(comparables: SaleComparable[]): string {
  const avgPrice = comparables.reduce((sum, c) => sum + c.price, 0) / comparables.length;
  const compsWithSqft = comparables.filter(c => c.squareFootage && c.squareFootage > 0);
  const avgPricePerSqft = compsWithSqft.length > 0
    ? compsWithSqft.reduce((sum, c) => sum + (c.price / c.squareFootage!), 0) / compsWithSqft.length
    : 0;

  return `- **All Comps (${comparables.length})**: ${formatCurrency(avgPrice)} ($${avgPricePerSqft.toFixed(0)}/sqft)\n\n`;
}

/**
 * Generates the Property Notes section.
 */
function generateNotesSection(notes: string): string {
  let section = `## Property Notes\n\n`;

  if (notes && notes.trim()) {
    section += `${notes}\n`;
  } else {
    section += `No notes recorded.\n`;
  }

  section += '\n---\n\n';

  return section;
}

/**
 * Generates the Lead Metadata section from the linked PropertyLead.
 */
function generateLeadMetadata(lead: PropertyLead): string {
  if (!lead.metadata) return '';

  try {
    const parsed: Record<string, unknown> = JSON.parse(lead.metadata);
    const entries = Object.entries(parsed);

    if (entries.length === 0) return '';

    let section = `## Lead Metadata\n\n`;
    section += `| Field | Value |\n`;
    section += `|-------|-------|\n`;

    for (const [key, value] of entries) {
      const formattedValue = formatMetadataValue(key, value);
      section += `| ${key} | ${formattedValue} |\n`;
    }

    // Add lead score if available
    if (lead.leadScore !== null && lead.leadScore !== undefined) {
      section += `| Lead Score | ${lead.leadScore}/10 |\n`;
    }

    section += '\n---\n\n';

    return section;
  } catch (error) {
    console.error('Failed to parse lead metadata:', error);
    return '';
  }
}

/**
 * Formats a metadata value for display.
 * Handles currency fields and other special cases.
 */
function formatMetadataValue(key: string, value: unknown): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  // Currency fields
  const currencyKeys = ['zestimate', 'price', 'rent', 'estimate', 'value'];
  const lowerKey = key.toLowerCase();

  if (typeof value === 'number') {
    if (currencyKeys.some(k => lowerKey.includes(k))) {
      return formatCurrency(value);
    }
    return value.toLocaleString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

/**
 * Generates the footer section.
 */
function generateFooter(): string {
  return `*Generated by PropGuide Investment Analysis Platform*\n`;
}
