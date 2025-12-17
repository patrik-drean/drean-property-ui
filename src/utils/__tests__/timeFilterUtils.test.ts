import { calculateDateRange, getPresetLabel } from '../timeFilterUtils';

describe('timeFilterUtils', () => {
  describe('calculateDateRange', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-12-17T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should calculate Last 7 Days correctly', () => {
      const { startDate, endDate } = calculateDateRange('last7');

      expect(startDate).toEqual(new Date('2024-12-10T12:00:00Z'));
      expect(endDate).toEqual(new Date('2024-12-17T12:00:00Z'));
    });

    it('should calculate Last 30 Days correctly', () => {
      const { startDate, endDate } = calculateDateRange('last30');

      expect(startDate).toEqual(new Date('2024-11-17T12:00:00Z'));
      expect(endDate).toEqual(new Date('2024-12-17T12:00:00Z'));
    });

    it('should calculate Last 60 Days correctly', () => {
      const { startDate, endDate } = calculateDateRange('last60');

      expect(startDate).toEqual(new Date('2024-10-18T12:00:00Z'));
      expect(endDate).toEqual(new Date('2024-12-17T12:00:00Z'));
    });

    it('should calculate Last 90 Days correctly', () => {
      const { startDate, endDate } = calculateDateRange('last90');

      expect(startDate).toEqual(new Date('2024-09-18T12:00:00Z'));
      expect(endDate).toEqual(new Date('2024-12-17T12:00:00Z'));
    });

    it('should calculate Last 365 Days correctly', () => {
      const { startDate, endDate } = calculateDateRange('last365');

      expect(startDate).toEqual(new Date('2023-12-18T12:00:00Z'));
      expect(endDate).toEqual(new Date('2024-12-17T12:00:00Z'));
    });

    it('should return undefined for All Time', () => {
      const { startDate, endDate } = calculateDateRange('allTime');

      expect(startDate).toBeUndefined();
      expect(endDate).toBeUndefined();
    });

    it('should handle default case as All Time', () => {
      // @ts-expect-error Testing invalid input
      const { startDate, endDate } = calculateDateRange('invalid');

      expect(startDate).toBeUndefined();
      expect(endDate).toBeUndefined();
    });

    it('should calculate dates accurately without off-by-one errors', () => {
      const { startDate, endDate } = calculateDateRange('last7');

      const daysDiff = (endDate!.getTime() - startDate!.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBe(7);
    });
  });

  describe('getPresetLabel', () => {
    it('should return correct label for last7', () => {
      expect(getPresetLabel('last7')).toBe('Last 7 Days');
    });

    it('should return correct label for last30', () => {
      expect(getPresetLabel('last30')).toBe('Last 30 Days');
    });

    it('should return correct label for last60', () => {
      expect(getPresetLabel('last60')).toBe('Last 60 Days');
    });

    it('should return correct label for last90', () => {
      expect(getPresetLabel('last90')).toBe('Last 90 Days');
    });

    it('should return correct label for last365', () => {
      expect(getPresetLabel('last365')).toBe('Last 365 Days');
    });

    it('should return correct label for allTime', () => {
      expect(getPresetLabel('allTime')).toBe('All Time');
    });
  });
});
