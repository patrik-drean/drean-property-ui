import axios from 'axios';
import { salesFunnelService } from '../salesFunnelService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('salesFunnelService', () => {
  const mockReport = {
    stages: [
      { stageName: 'Leads', count: 100, conversionRateFromPrevious: null },
      { stageName: 'Contacted', count: 80, conversionRateFromPrevious: 80.0 },
    ],
    startDate: null,
    endDate: null,
    totalLeads: 100,
    generatedAt: '2024-12-17T10:00:00Z',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSalesFunnelReport', () => {
    it('should fetch report successfully without dates', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockReport });

      const result = await salesFunnelService.getSalesFunnelReport();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/PropertyLeads/sales-funnel')
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.not.stringContaining('?')
      );
      expect(result).toEqual(mockReport);
    });

    it('should include startDate query parameter when provided', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockReport });

      const startDate = new Date('2024-01-01T00:00:00Z');
      await salesFunnelService.getSalesFunnelReport(startDate);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('startDate=2024-01-01')
      );
    });

    it('should include endDate query parameter when provided', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockReport });

      const endDate = new Date('2024-12-31T23:59:59Z');
      await salesFunnelService.getSalesFunnelReport(undefined, endDate);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('endDate=2024-12-31')
      );
    });

    it('should include both date query parameters when provided', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockReport });

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-12-31T23:59:59Z');
      await salesFunnelService.getSalesFunnelReport(startDate, endDate);

      const call = mockedAxios.get.mock.calls[0][0];
      expect(call).toContain('startDate=2024-01-01');
      expect(call).toContain('endDate=2024-12-31');
    });

    it('should use correct API base URL from environment', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockReport });

      await salesFunnelService.getSalesFunnelReport();

      const call = mockedAxios.get.mock.calls[0][0];
      expect(call).toMatch(/^http:\/\/localhost:8080\/api\/PropertyLeads\/sales-funnel/);
    });

    it('should throw error on network failure', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValue(networkError);

      await expect(salesFunnelService.getSalesFunnelReport()).rejects.toThrow(
        'Failed to fetch sales funnel report'
      );
    });

    it('should throw error on API error response', async () => {
      const apiError = {
        response: {
          status: 500,
          data: { error: 'Internal Server Error' },
        },
      };
      mockedAxios.get.mockRejectedValue(apiError);

      await expect(salesFunnelService.getSalesFunnelReport()).rejects.toThrow(
        'Failed to fetch sales funnel report'
      );
    });

    it('should log error to console on failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');
      mockedAxios.get.mockRejectedValue(error);

      await expect(salesFunnelService.getSalesFunnelReport()).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching sales funnel report:',
        error
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return data with correct structure', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockReport });

      const result = await salesFunnelService.getSalesFunnelReport();

      expect(result).toHaveProperty('stages');
      expect(result).toHaveProperty('totalLeads');
      expect(result).toHaveProperty('generatedAt');
      expect(Array.isArray(result.stages)).toBe(true);
    });
  });
});
