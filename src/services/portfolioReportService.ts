import { Property } from '../types/property';
import {
  PortfolioCashFlowReport,
  PortfolioAssetReport,
  ReportGenerationResult
} from '../types/portfolioReport';
import {
  getCachedCashFlowReport,
  getCachedAssetReport,
  clearReportCache
} from '../utils/portfolioAggregator';
import PropertyService from './PropertyService';
import { getProperties } from './mock/mockApi';

/**
 * Service for generating portfolio reports with caching and error handling
 */
export class PortfolioReportService {
  private static instance: PortfolioReportService;
  private isUsingMockApi: boolean;

  constructor() {
    this.isUsingMockApi = process.env.REACT_APP_USE_MOCK_API === 'true';
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PortfolioReportService {
    if (!PortfolioReportService.instance) {
      PortfolioReportService.instance = new PortfolioReportService();
    }
    return PortfolioReportService.instance;
  }

  /**
   * Fetch all properties from appropriate data source
   */
  private async fetchProperties(): Promise<Property[]> {
    try {
      if (this.isUsingMockApi) {
        return await getProperties(false); // Don't include archived properties
      } else {
        return await PropertyService.getAllProperties();
      }
    } catch (error) {
      console.error('Error fetching properties for reports:', error);
      throw new Error('Unable to fetch property data for report generation');
    }
  }

  /**
   * Generate cash flow report with caching
   */
  public async generateCashFlowReport(): Promise<ReportGenerationResult<PortfolioCashFlowReport>> {
    try {
      const properties = await this.fetchProperties();

      // Filter out archived properties
      const activeProperties = properties.filter(p => !p.archived);

      if (activeProperties.length === 0) {
        return {
          data: undefined,
          errors: [{
            message: 'No active properties found for cash flow analysis'
          }],
          hasWarnings: true
        };
      }

      return getCachedCashFlowReport(activeProperties);
    } catch (error) {
      console.error('Error generating cash flow report:', error);
      return {
        data: undefined,
        errors: [{
          message: 'Failed to generate cash flow report',
          details: error instanceof Error ? error.message : 'Unknown error'
        }],
        hasWarnings: true
      };
    }
  }

  /**
   * Generate asset report with caching
   */
  public async generateAssetReport(): Promise<ReportGenerationResult<PortfolioAssetReport>> {
    try {
      const properties = await this.fetchProperties();

      // Filter out archived properties
      const activeProperties = properties.filter(p => !p.archived);

      if (activeProperties.length === 0) {
        return {
          data: undefined,
          errors: [{
            message: 'No active properties found for asset analysis'
          }],
          hasWarnings: true
        };
      }

      return getCachedAssetReport(activeProperties);
    } catch (error) {
      console.error('Error generating asset report:', error);
      return {
        data: undefined,
        errors: [{
          message: 'Failed to generate asset report',
          details: error instanceof Error ? error.message : 'Unknown error'
        }],
        hasWarnings: true
      };
    }
  }

  /**
   * Generate both reports concurrently
   */
  public async generateAllReports(): Promise<{
    cashFlow: ReportGenerationResult<PortfolioCashFlowReport>;
    assets: ReportGenerationResult<PortfolioAssetReport>;
  }> {
    try {
      const [cashFlowResult, assetResult] = await Promise.all([
        this.generateCashFlowReport(),
        this.generateAssetReport()
      ]);

      return {
        cashFlow: cashFlowResult,
        assets: assetResult
      };
    } catch (error) {
      console.error('Error generating all reports:', error);
      const errorResult = {
        data: undefined,
        errors: [{
          message: 'Failed to generate reports',
          details: error instanceof Error ? error.message : 'Unknown error'
        }],
        hasWarnings: true
      };

      return {
        cashFlow: errorResult,
        assets: errorResult
      };
    }
  }

  /**
   * Refresh report data by clearing cache
   */
  public refreshReports(): void {
    clearReportCache();
  }

  /**
   * Get properties data for individual property analysis
   */
  public async getPropertiesForReports(): Promise<Property[]> {
    try {
      const properties = await this.fetchProperties();
      return properties.filter(p => !p.archived);
    } catch (error) {
      console.error('Error fetching properties:', error);
      return [];
    }
  }

  /**
   * Validate property data completeness for reporting
   */
  public validatePropertyData(properties: Property[]): {
    valid: Property[];
    invalid: Property[];
    warnings: string[];
  } {
    const valid: Property[] = [];
    const invalid: Property[] = [];
    const warnings: string[] = [];

    properties.forEach(property => {
      let isValid = true;
      const propertyWarnings: string[] = [];

      // Basic validation
      if (!property.address || property.address.trim().length === 0) {
        isValid = false;
        propertyWarnings.push('Missing address');
      }

      if (!property.status) {
        isValid = false;
        propertyWarnings.push('Missing status');
      }

      // Cash flow specific validation
      if (property.potentialRent <= 0 && property.actualRent <= 0) {
        propertyWarnings.push('No rent data available');
      }

      if (property.offerPrice <= 0) {
        propertyWarnings.push('No offer price data');
      }

      // Asset specific validation
      if (property.arv <= 0 && property.currentHouseValue <= 0) {
        propertyWarnings.push('No property value data available');
      }

      if (propertyWarnings.length > 0) {
        warnings.push(`${property.address}: ${propertyWarnings.join(', ')}`);
      }

      if (isValid) {
        valid.push(property);
      } else {
        invalid.push(property);
      }
    });

    return { valid, invalid, warnings };
  }

  /**
   * Export report data to CSV format
   */
  public exportToCsv(reportType: 'cashflow' | 'assets', reportData: any, scenario: 'current' | 'potential' = 'current'): string {
    if (reportType === 'cashflow' && reportData) {
      const report = reportData as PortfolioCashFlowReport;
      const scenarioPrefix = scenario === 'current' ? 'Current' : 'Potential';

      const headers = [
        'Address',
        'Status',
        `${scenarioPrefix} Monthly Rent`,
        'Mortgage Payment',
        'Property Tax',
        'Property Management',
        'Total Expenses',
        `${scenarioPrefix} Net Cash Flow`
      ];

      const rows = report.properties.map(property => {
        const rentIncome = scenario === 'current' ? property.currentRentIncome : property.potentialRentIncome;
        const expenses = scenario === 'current' ? property.currentExpenses : property.potentialExpenses;
        const netCashFlow = scenario === 'current' ? property.currentNetCashFlow : property.potentialNetCashFlow;

        return [
          property.address,
          property.status,
          rentIncome.toFixed(2),
          expenses.mortgage.toFixed(2),
          expenses.propertyTax.toFixed(2),
          expenses.propertyManagement.toFixed(2),
          expenses.total.toFixed(2),
          netCashFlow.toFixed(2)
        ];
      });

      // Add summary row
      const summaryIncome = scenario === 'current' ? report.summary.currentTotalRentIncome : report.summary.potentialTotalRentIncome;
      const summaryExpenses = scenario === 'current' ? report.summary.currentTotalExpenses : report.summary.potentialTotalExpenses;
      const summaryNetCashFlow = scenario === 'current' ? report.summary.currentTotalNetCashFlow : report.summary.potentialTotalNetCashFlow;

      rows.push([
        'TOTAL',
        '',
        summaryIncome.toFixed(2),
        summaryExpenses.mortgage.toFixed(2),
        summaryExpenses.propertyTax.toFixed(2),
        summaryExpenses.propertyManagement.toFixed(2),
        summaryExpenses.total.toFixed(2),
        summaryNetCashFlow.toFixed(2)
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    if (reportType === 'assets' && reportData) {
      const report = reportData as PortfolioAssetReport;
      const headers = [
        'Address',
        'Status',
        'Current Value',
        'Loan Value',
        'Equity',
        'Equity Percentage'
      ];

      const rows = report.properties.map(property => [
        property.address,
        property.status,
        property.currentValue.toFixed(2),
        property.loanValue.toFixed(2),
        property.equity.toFixed(2),
        property.equityPercent.toFixed(2)
      ]);

      // Add summary row
      rows.push([
        'TOTAL',
        '',
        report.summary.totalPropertyValue.toFixed(2),
        report.summary.totalLoanValue.toFixed(2),
        report.summary.totalEquity.toFixed(2),
        report.summary.averageEquityPercent.toFixed(2)
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return '';
  }

  /**
   * Download CSV file
   */
  public downloadCsv(filename: string, csvContent: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

// Export singleton instance
export const portfolioReportService = PortfolioReportService.getInstance();