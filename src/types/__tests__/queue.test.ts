import {
  getPriorityStyles,
  getNeighborhoodGradeColor,
  getScoreColor,
  getScoreLabel,
  getSpreadColor,
  calculateScoreFromSpread,
  formatTimeSince,
  Priority,
} from '../queue';

describe('Queue Helper Functions', () => {
  describe('getPriorityStyles', () => {
    it('should return red styles for urgent priority', () => {
      const styles = getPriorityStyles('urgent');
      expect(styles.color).toBe('#f87171');
      expect(styles.bg).toBe('rgba(248, 113, 113, 0.15)');
      expect(styles.border).toBe('#f87171');
    });

    it('should return yellow styles for high priority', () => {
      const styles = getPriorityStyles('high');
      expect(styles.color).toBe('#fbbf24');
      expect(styles.bg).toBe('rgba(251, 191, 36, 0.15)');
      expect(styles.border).toBe('#fbbf24');
    });

    it('should return blue styles for medium priority', () => {
      const styles = getPriorityStyles('medium');
      expect(styles.color).toBe('#60a5fa');
      expect(styles.bg).toBe('rgba(96, 165, 250, 0.15)');
      expect(styles.border).toBe('#60a5fa');
    });

    it('should return gray styles for normal priority', () => {
      const styles = getPriorityStyles('normal');
      expect(styles.color).toBe('#8b949e');
      expect(styles.bg).toBe('rgba(139, 148, 158, 0.15)');
      expect(styles.border).toBe('#30363d');
    });

    it('should return correct styles for all priority types', () => {
      const priorities: Priority[] = ['urgent', 'high', 'medium', 'normal'];
      priorities.forEach((priority) => {
        const styles = getPriorityStyles(priority);
        expect(styles).toHaveProperty('color');
        expect(styles).toHaveProperty('bg');
        expect(styles).toHaveProperty('border');
      });
    });
  });

  describe('getNeighborhoodGradeColor', () => {
    it('should return green for A grade', () => {
      expect(getNeighborhoodGradeColor('A')).toBe('#4ade80');
    });

    it('should return blue for B grade', () => {
      expect(getNeighborhoodGradeColor('B')).toBe('#60a5fa');
    });

    it('should return yellow for C grade', () => {
      expect(getNeighborhoodGradeColor('C')).toBe('#fbbf24');
    });

    it('should return orange-red for D grade', () => {
      expect(getNeighborhoodGradeColor('D')).toBe('#f87171');
    });

    it('should return red for F grade', () => {
      expect(getNeighborhoodGradeColor('F')).toBe('#ef4444');
    });

    it('should handle lowercase grades', () => {
      expect(getNeighborhoodGradeColor('a')).toBe('#4ade80');
      expect(getNeighborhoodGradeColor('b')).toBe('#60a5fa');
    });

    it('should return gray for null', () => {
      expect(getNeighborhoodGradeColor(null)).toBe('#8b949e');
    });

    it('should return gray for undefined', () => {
      expect(getNeighborhoodGradeColor(undefined)).toBe('#8b949e');
    });

    it('should return gray for unknown grades', () => {
      expect(getNeighborhoodGradeColor('X')).toBe('#8b949e');
      expect(getNeighborhoodGradeColor('Z')).toBe('#8b949e');
    });
  });

  describe('getScoreColor', () => {
    // Updated thresholds based on simplified MAO Spread scoring:
    // 9-10: Amazing (Green #4ade80)
    // 7-8: Great (Light Green #86efac)
    // 5-6: Good (Yellow #fbbf24)
    // 3-4: Fair (Orange #fb923c)
    // 1-2: Poor (Red #f87171)

    it('should return bright green for scores >= 9 (Amazing)', () => {
      expect(getScoreColor(9)).toBe('#4ade80');
      expect(getScoreColor(10)).toBe('#4ade80');
    });

    it('should return light green for scores 7-8 (Great)', () => {
      expect(getScoreColor(7)).toBe('#86efac');
      expect(getScoreColor(8)).toBe('#86efac');
    });

    it('should return yellow for scores 5-6 (Good)', () => {
      expect(getScoreColor(5)).toBe('#fbbf24');
      expect(getScoreColor(6)).toBe('#fbbf24');
    });

    it('should return orange for scores 3-4 (Fair)', () => {
      expect(getScoreColor(3)).toBe('#fb923c');
      expect(getScoreColor(4)).toBe('#fb923c');
    });

    it('should return red for scores 1-2 (Poor)', () => {
      expect(getScoreColor(1)).toBe('#f87171');
      expect(getScoreColor(2)).toBe('#f87171');
    });

    it('should return gray for null', () => {
      expect(getScoreColor(null)).toBe('#8b949e');
    });

    it('should return gray for undefined', () => {
      expect(getScoreColor(undefined)).toBe('#8b949e');
    });
  });

  describe('getScoreLabel', () => {
    it('should return "Amazing" for scores >= 9', () => {
      expect(getScoreLabel(9)).toBe('Amazing');
      expect(getScoreLabel(10)).toBe('Amazing');
    });

    it('should return "Great" for scores 7-8', () => {
      expect(getScoreLabel(7)).toBe('Great');
      expect(getScoreLabel(8)).toBe('Great');
    });

    it('should return "Good" for scores 5-6', () => {
      expect(getScoreLabel(5)).toBe('Good');
      expect(getScoreLabel(6)).toBe('Good');
    });

    it('should return "Fair" for scores 3-4', () => {
      expect(getScoreLabel(3)).toBe('Fair');
      expect(getScoreLabel(4)).toBe('Fair');
    });

    it('should return "Poor" for scores 1-2', () => {
      expect(getScoreLabel(1)).toBe('Poor');
      expect(getScoreLabel(2)).toBe('Poor');
    });

    it('should return "Unknown" for null', () => {
      expect(getScoreLabel(null)).toBe('Unknown');
    });

    it('should return "Unknown" for undefined', () => {
      expect(getScoreLabel(undefined)).toBe('Unknown');
    });
  });

  describe('getSpreadColor', () => {
    // Lower spread = better deal (listing price closer to MAO)
    // ≤15%: bright green, ≤25%: light green, ≤40%: yellow, ≤60%: orange, >60%: red

    it('should return bright green for spreads <= 15% (Amazing/Great)', () => {
      expect(getSpreadColor(10)).toBe('#4ade80');
      expect(getSpreadColor(15)).toBe('#4ade80');
    });

    it('should return light green for spreads 16-25% (Good)', () => {
      expect(getSpreadColor(16)).toBe('#86efac');
      expect(getSpreadColor(25)).toBe('#86efac');
    });

    it('should return yellow for spreads 26-40% (Fair)', () => {
      expect(getSpreadColor(26)).toBe('#fbbf24');
      expect(getSpreadColor(40)).toBe('#fbbf24');
    });

    it('should return orange for spreads 41-60% (Moderate)', () => {
      expect(getSpreadColor(41)).toBe('#fb923c');
      expect(getSpreadColor(60)).toBe('#fb923c');
    });

    it('should return red for spreads > 60% (High)', () => {
      expect(getSpreadColor(61)).toBe('#f87171');
      expect(getSpreadColor(100)).toBe('#f87171');
    });

    it('should return gray for null', () => {
      expect(getSpreadColor(null)).toBe('#8b949e');
    });

    it('should return gray for undefined', () => {
      expect(getSpreadColor(undefined)).toBe('#8b949e');
    });
  });

  describe('calculateScoreFromSpread', () => {
    // Matches backend CompositeLeadScorer algorithm from TASK-098
    // Lower spread = better deal = higher score

    it('should return 10 for negative spread (listing below MAO)', () => {
      expect(calculateScoreFromSpread(-10)).toBe(10);
      expect(calculateScoreFromSpread(-5)).toBe(10);
      expect(calculateScoreFromSpread(0)).toBe(10);
    });

    it('should return 10 for spread <= 10%', () => {
      expect(calculateScoreFromSpread(5)).toBe(10);
      expect(calculateScoreFromSpread(10)).toBe(10);
    });

    it('should return 9 for spread 11-15%', () => {
      expect(calculateScoreFromSpread(11)).toBe(9);
      expect(calculateScoreFromSpread(15)).toBe(9);
    });

    it('should return 8 for spread 16-20%', () => {
      expect(calculateScoreFromSpread(16)).toBe(8);
      expect(calculateScoreFromSpread(20)).toBe(8);
    });

    it('should return 7 for spread 21-25%', () => {
      expect(calculateScoreFromSpread(21)).toBe(7);
      expect(calculateScoreFromSpread(25)).toBe(7);
    });

    it('should return 6 for spread 26-30%', () => {
      expect(calculateScoreFromSpread(26)).toBe(6);
      expect(calculateScoreFromSpread(30)).toBe(6);
    });

    it('should return 5 for spread 31-40%', () => {
      expect(calculateScoreFromSpread(31)).toBe(5);
      expect(calculateScoreFromSpread(40)).toBe(5);
    });

    it('should return 4 for spread 41-50%', () => {
      expect(calculateScoreFromSpread(41)).toBe(4);
      expect(calculateScoreFromSpread(50)).toBe(4);
    });

    it('should return 3 for spread 51-60%', () => {
      expect(calculateScoreFromSpread(51)).toBe(3);
      expect(calculateScoreFromSpread(60)).toBe(3);
    });

    it('should return 2 for spread 61-75%', () => {
      expect(calculateScoreFromSpread(61)).toBe(2);
      expect(calculateScoreFromSpread(75)).toBe(2);
    });

    it('should return 1 for spread > 75%', () => {
      expect(calculateScoreFromSpread(76)).toBe(1);
      expect(calculateScoreFromSpread(100)).toBe(1);
    });

    it('should return 5 for null', () => {
      expect(calculateScoreFromSpread(null)).toBe(5);
    });

    it('should return 5 for undefined', () => {
      expect(calculateScoreFromSpread(undefined)).toBe(5);
    });
  });

  describe('formatTimeSince', () => {
    // NOTE: formatTimeSince uses Mountain Time (America/Denver) for day boundary calculations.
    // UTC times are converted to Mountain Time to determine "Yesterday", etc.
    // MST = UTC-7, MDT = UTC-6
    // Example: 2024-01-15T12:00:00Z = Jan 15 5:00 AM MST
    //          2024-01-15T00:00:00Z = Jan 14 5:00 PM MST (previous day!)

    beforeEach(() => {
      jest.useFakeTimers();
      // Set system time to noon UTC on Jan 15, 2024
      // In MST: Jan 15, 5:00 AM
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return minutes ago for times < 60 minutes', () => {
      const date30MinAgo = new Date('2024-01-15T11:30:00Z').toISOString();
      expect(formatTimeSince(date30MinAgo)).toBe('30m ago');

      const date5MinAgo = new Date('2024-01-15T11:55:00Z').toISOString();
      expect(formatTimeSince(date5MinAgo)).toBe('5m ago');
    });

    it('should return hours ago for times earlier same day in Mountain Time', () => {
      // 2 hours ago: 10:00 UTC = 3:00 AM MST (same day as 12:00 UTC = 5:00 AM MST)
      const date2HoursAgo = new Date('2024-01-15T10:00:00Z').toISOString();
      expect(formatTimeSince(date2HoursAgo)).toBe('2h ago');

      // 5 hours ago: 07:00 UTC = 12:00 AM MST (midnight on Jan 15 MST, same day)
      const date5HoursAgo = new Date('2024-01-15T07:00:00Z').toISOString();
      expect(formatTimeSince(date5HoursAgo)).toBe('5h ago');
    });

    it('should return "Yesterday" for times on previous day in Mountain Time', () => {
      // 12:00 UTC on Jan 14 = 5:00 AM MST on Jan 14 (yesterday in Mountain Time)
      const dateYesterday = new Date('2024-01-14T12:00:00Z').toISOString();
      expect(formatTimeSince(dateYesterday)).toBe('Yesterday');

      // Midnight UTC on Jan 15 = 5:00 PM MST on Jan 14 (yesterday in Mountain Time!)
      // This is the edge case where UTC and Mountain Time differ
      const dateMidnightUTC = new Date('2024-01-15T00:00:00Z').toISOString();
      expect(formatTimeSince(dateMidnightUTC)).toBe('Yesterday');
    });

    it('should return days ago for times 2-6 days ago', () => {
      const date3DaysAgo = new Date('2024-01-12T12:00:00Z').toISOString();
      expect(formatTimeSince(date3DaysAgo)).toBe('3d ago');

      const date6DaysAgo = new Date('2024-01-09T12:00:00Z').toISOString();
      expect(formatTimeSince(date6DaysAgo)).toBe('6d ago');
    });

    it('should return formatted date for times >= 7 days ago', () => {
      const dateWeekAgo = new Date('2024-01-08T12:00:00Z').toISOString();
      const result = formatTimeSince(dateWeekAgo);
      // Should be a date string, not "Xd ago"
      expect(result).not.toContain('d ago');
      expect(result).not.toContain('h ago');
      expect(result).not.toContain('m ago');
    });

    it('should handle invalid date strings gracefully', () => {
      const result = formatTimeSince('invalid-date');
      expect(result).toBe('invalid-date'); // Returns original string
    });

    it('should handle dates without Z suffix', () => {
      // Function should append Z if not present
      const dateWithoutZ = '2024-01-15T11:30:00';
      expect(formatTimeSince(dateWithoutZ)).toBe('30m ago');
    });
  });
});
