import axios from 'axios';
import { SalesFunnelReport } from '../types/salesFunnel';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

export const salesFunnelService = {
  async getSalesFunnelReport(
    startDate?: Date,
    endDate?: Date,
    includeDebug?: boolean
  ): Promise<SalesFunnelReport> {
    try {
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString());
      }
      if (includeDebug) {
        params.append('includeDebug', 'true');
      }

      const url = `${API_BASE_URL}/api/PropertyLeads/sales-funnel${
        params.toString() ? `?${params.toString()}` : ''
      }`;

      const response = await axios.get<SalesFunnelReport>(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching sales funnel report:', error);
      throw new Error('Failed to fetch sales funnel report');
    }
  },

  /**
   * Exports leads data as a CSV file download.
   * Triggers a browser download of the CSV file.
   */
  async exportLeadsCsv(startDate?: Date, endDate?: Date): Promise<void> {
    const params = new URLSearchParams();
    if (startDate) {
      params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params.append('endDate', endDate.toISOString());
    }

    const url = `${API_BASE_URL}/api/PropertyLeads/sales-funnel/export${
      params.toString() ? `?${params.toString()}` : ''
    }`;

    // Trigger download via hidden link
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
