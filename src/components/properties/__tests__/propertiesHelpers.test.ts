import {
  getScoreBackgroundColor,
  getScoreTextColor,
  formatCurrency,
  formatPercentage,
  getRentRatioColor,
  getARVRatioColor,
} from '../propertiesHelpers';

describe('propertiesHelpers', () => {
  describe('getScoreBackgroundColor', () => {
    it('should return green for scores 9-10', () => {
      expect(getScoreBackgroundColor(9)).toBe('#4CAF50');
      expect(getScoreBackgroundColor(10)).toBe('#4CAF50');
    });

    it('should return amber for scores 7-8', () => {
      expect(getScoreBackgroundColor(7)).toBe('#FFC107');
      expect(getScoreBackgroundColor(8)).toBe('#FFC107');
    });

    it('should return orange for scores 5-6', () => {
      expect(getScoreBackgroundColor(5)).toBe('#FF9800');
      expect(getScoreBackgroundColor(6)).toBe('#FF9800');
    });

    it('should return red for scores below 5', () => {
      expect(getScoreBackgroundColor(4)).toBe('#F44336');
      expect(getScoreBackgroundColor(1)).toBe('#F44336');
      expect(getScoreBackgroundColor(0)).toBe('#F44336');
    });
  });

  describe('getScoreTextColor', () => {
    it('should return white for scores 9-10', () => {
      expect(getScoreTextColor(9)).toBe('#FFFFFF');
      expect(getScoreTextColor(10)).toBe('#FFFFFF');
    });

    it('should return black for scores 5-8', () => {
      expect(getScoreTextColor(5)).toBe('#000000');
      expect(getScoreTextColor(6)).toBe('#000000');
      expect(getScoreTextColor(7)).toBe('#000000');
      expect(getScoreTextColor(8)).toBe('#000000');
    });

    it('should return white for scores below 5', () => {
      expect(getScoreTextColor(4)).toBe('#FFFFFF');
      expect(getScoreTextColor(1)).toBe('#FFFFFF');
    });
  });

  describe('formatCurrency', () => {
    it('should return dash for null', () => {
      expect(formatCurrency(null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(formatCurrency(undefined)).toBe('-');
    });

    it('should format numbers as USD currency', () => {
      expect(formatCurrency(0)).toBe('$0');
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(100000)).toBe('$100,000');
      expect(formatCurrency(1500000)).toBe('$1,500,000');
    });

    it('should round to whole numbers', () => {
      expect(formatCurrency(1000.50)).toBe('$1,001');
      expect(formatCurrency(1000.49)).toBe('$1,000');
    });

    it('should handle negative numbers', () => {
      expect(formatCurrency(-1000)).toBe('-$1,000');
    });
  });

  describe('formatPercentage', () => {
    it('should format decimal as percentage with one decimal place', () => {
      expect(formatPercentage(0.01)).toBe('1.0%');
      expect(formatPercentage(0.1)).toBe('10.0%');
      expect(formatPercentage(0.75)).toBe('75.0%');
      expect(formatPercentage(1)).toBe('100.0%');
    });

    it('should handle values greater than 1', () => {
      expect(formatPercentage(1.5)).toBe('150.0%');
    });

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0.0%');
    });
  });

  describe('getRentRatioColor', () => {
    it('should return green for rent ratio >= 1%', () => {
      expect(getRentRatioColor(0.01)).toBe('#4CAF50');
      expect(getRentRatioColor(0.012)).toBe('#4CAF50');
      expect(getRentRatioColor(0.02)).toBe('#4CAF50');
    });

    it('should return amber for rent ratio 0.8-1%', () => {
      expect(getRentRatioColor(0.008)).toBe('#FFC107');
      expect(getRentRatioColor(0.009)).toBe('#FFC107');
      expect(getRentRatioColor(0.0099)).toBe('#FFC107');
    });

    it('should return red for rent ratio < 0.8%', () => {
      expect(getRentRatioColor(0.007)).toBe('#F44336');
      expect(getRentRatioColor(0.005)).toBe('#F44336');
      expect(getRentRatioColor(0)).toBe('#F44336');
    });
  });

  describe('getARVRatioColor', () => {
    it('should return green for ARV ratio <= 70%', () => {
      expect(getARVRatioColor(0.70)).toBe('#4CAF50');
      expect(getARVRatioColor(0.65)).toBe('#4CAF50');
      expect(getARVRatioColor(0.50)).toBe('#4CAF50');
    });

    it('should return amber for ARV ratio 70-80%', () => {
      expect(getARVRatioColor(0.71)).toBe('#FFC107');
      expect(getARVRatioColor(0.75)).toBe('#FFC107');
      expect(getARVRatioColor(0.80)).toBe('#FFC107');
    });

    it('should return red for ARV ratio > 80%', () => {
      expect(getARVRatioColor(0.81)).toBe('#F44336');
      expect(getARVRatioColor(0.90)).toBe('#F44336');
      expect(getARVRatioColor(1.0)).toBe('#F44336');
    });
  });
});
