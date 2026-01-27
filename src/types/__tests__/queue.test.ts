import {
  getPriorityStyles,
  getNeighborhoodGradeColor,
  getScoreColor,
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
    it('should return green for scores >= 8', () => {
      expect(getScoreColor(8)).toBe('#4ade80');
      expect(getScoreColor(9)).toBe('#4ade80');
      expect(getScoreColor(10)).toBe('#4ade80');
    });

    it('should return yellow for scores 6-7', () => {
      expect(getScoreColor(6)).toBe('#fbbf24');
      expect(getScoreColor(7)).toBe('#fbbf24');
    });

    it('should return orange for scores 4-5', () => {
      expect(getScoreColor(4)).toBe('#f97316');
      expect(getScoreColor(5)).toBe('#f97316');
    });

    it('should return red for scores < 4', () => {
      expect(getScoreColor(1)).toBe('#f87171');
      expect(getScoreColor(2)).toBe('#f87171');
      expect(getScoreColor(3)).toBe('#f87171');
    });

    it('should return gray for null', () => {
      expect(getScoreColor(null)).toBe('#8b949e');
    });

    it('should return gray for undefined', () => {
      expect(getScoreColor(undefined)).toBe('#8b949e');
    });
  });

  describe('formatTimeSince', () => {
    beforeEach(() => {
      jest.useFakeTimers();
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

    it('should return hours ago for times < 24 hours', () => {
      const date2HoursAgo = new Date('2024-01-15T10:00:00Z').toISOString();
      expect(formatTimeSince(date2HoursAgo)).toBe('2h ago');

      const date12HoursAgo = new Date('2024-01-15T00:00:00Z').toISOString();
      expect(formatTimeSince(date12HoursAgo)).toBe('12h ago');
    });

    it('should return "Yesterday" for times 1 day ago', () => {
      const dateYesterday = new Date('2024-01-14T12:00:00Z').toISOString();
      expect(formatTimeSince(dateYesterday)).toBe('Yesterday');
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
  });
});
