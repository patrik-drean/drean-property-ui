import { formatMountainTime, formatMessageTime, formatConversationTime } from '../timezone';

describe('Timezone Utilities', () => {
  /**
   * NOTE: These utilities convert UTC timestamps to Mountain Time (America/Denver).
   * MST = UTC-7 (winter), MDT = UTC-6 (summer/DST)
   *
   * Test date reference:
   * - 2024-01-15T20:00:00Z (UTC) = 2024-01-15 1:00 PM MST (winter)
   * - 2024-07-15T19:00:00Z (UTC) = 2024-07-15 1:00 PM MDT (summer/DST)
   */

  describe('formatMountainTime', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Set system time to Jan 15, 2024 noon UTC
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('valid timestamps', () => {
      it('should format UTC timestamp to Mountain Time with date and time', () => {
        // 2024-01-15T20:00:00Z = 1:00 PM MST on Jan 15
        const result = formatMountainTime('2024-01-15T20:00:00Z');
        expect(result).toMatch(/1\/15\/2024.*1:00.*PM/);
      });

      it('should handle timestamps without Z suffix', () => {
        const result = formatMountainTime('2024-01-15T20:00:00');
        expect(result).toMatch(/1\/15\/2024.*1:00.*PM/);
      });

      it('should convert to MST in winter (UTC-7)', () => {
        // January 15, 2024 20:00 UTC should be 13:00 (1:00 PM) MST
        const result = formatMountainTime('2024-01-15T20:00:00Z');
        expect(result).toContain('1:00');
        expect(result).toContain('PM');
      });

      it('should convert to MDT in summer (UTC-6)', () => {
        // July 15, 2024 19:00 UTC should be 13:00 (1:00 PM) MDT
        const result = formatMountainTime('2024-07-15T19:00:00Z');
        expect(result).toContain('1:00');
        expect(result).toContain('PM');
      });

      it('should handle midnight UTC correctly', () => {
        // Midnight UTC on Jan 15 = 5:00 PM MST on Jan 14
        const result = formatMountainTime('2024-01-15T00:00:00Z');
        expect(result).toMatch(/1\/14\/2024.*5:00.*PM/);
      });

      it('should handle dates near DST transition (spring forward)', () => {
        // March 10, 2024 - DST starts at 2:00 AM MT
        // 9:00 AM UTC on March 10 = 2:00 AM MST -> becomes 3:00 AM MDT
        const result = formatMountainTime('2024-03-10T09:00:00Z');
        expect(result).toMatch(/3\/10\/2024/);
      });

      it('should handle dates near DST transition (fall back)', () => {
        // November 3, 2024 - DST ends at 2:00 AM MT
        const result = formatMountainTime('2024-11-03T09:00:00Z');
        expect(result).toMatch(/11\/3\/2024/);
      });
    });

    describe('edge cases', () => {
      it('should return original string for invalid date', () => {
        const result = formatMountainTime('invalid-date');
        expect(result).toBe('invalid-date');
      });

      it('should return original string for empty string', () => {
        const result = formatMountainTime('');
        expect(result).toBe('');
      });

      it('should handle ISO dates with milliseconds', () => {
        const result = formatMountainTime('2024-01-15T20:00:00.123Z');
        expect(result).toMatch(/1\/15\/2024.*1:00.*PM/);
      });

      it('should handle very old dates', () => {
        const result = formatMountainTime('1990-06-15T18:00:00Z');
        expect(result).toMatch(/6\/15\/1990/);
      });

      it('should handle future dates', () => {
        const result = formatMountainTime('2030-12-25T18:00:00Z');
        expect(result).toMatch(/12\/25\/2030/);
      });
    });
  });

  describe('formatMessageTime', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    describe('today timestamps', () => {
      it('should return time only for timestamps from today (Mountain Time)', () => {
        jest.useFakeTimers();
        // Set "now" to Jan 15, 2024 at 3:00 PM MST (10:00 PM UTC)
        jest.setSystemTime(new Date('2024-01-15T22:00:00Z'));

        // A timestamp from earlier today in MST (12:00 PM MST = 7:00 PM UTC)
        const result = formatMessageTime('2024-01-15T19:00:00Z');
        expect(result).toMatch(/12:00.*PM/);
      });

      it('should return time only for timestamps just after midnight MT', () => {
        jest.useFakeTimers();
        // Set "now" to Jan 15, 2024 at 6:00 AM MST (1:00 PM UTC)
        jest.setSystemTime(new Date('2024-01-15T13:00:00Z'));

        // A timestamp from midnight MT today (7:00 AM UTC)
        const result = formatMessageTime('2024-01-15T08:00:00Z');
        expect(result).toMatch(/1:00.*AM/);
      });
    });

    describe('yesterday timestamps', () => {
      it('should return "Yesterday" for timestamps from exactly 24+ hours ago', () => {
        jest.useFakeTimers();
        // Set "now" to Jan 15, 2024 at 10:00 PM MST (5:00 AM UTC Jan 16)
        jest.setSystemTime(new Date('2024-01-16T05:00:00Z'));

        // A timestamp from Jan 14 at 10:00 PM MST (5:00 AM UTC Jan 15)
        // This is exactly 24 hours ago
        const result = formatMessageTime('2024-01-15T05:00:00Z');
        expect(result).toBe('Yesterday');
      });

      it('should return "Yesterday" for timestamps from 25-48 hours ago', () => {
        jest.useFakeTimers();
        // Set "now" to Jan 16, 2024 at noon MST (7:00 PM UTC)
        jest.setSystemTime(new Date('2024-01-16T19:00:00Z'));

        // A timestamp from ~30 hours ago (Jan 15 at 1:00 PM UTC)
        const result = formatMessageTime('2024-01-15T13:00:00Z');
        expect(result).toBe('Yesterday');
      });

      // NOTE: The current implementation of formatMessageTime uses elapsed time
      // for diffDays calculation, which means timestamps less than 24 hours ago
      // are considered "today" even if they're on a different calendar day.
      // This is a known limitation of the existing utility.
    });

    describe('this year timestamps', () => {
      it('should return "Mon Day" format for dates earlier this year', () => {
        jest.useFakeTimers();
        // Set "now" to Dec 15, 2024
        jest.setSystemTime(new Date('2024-12-15T17:00:00Z'));

        // A date from Jan 10, 2024
        const result = formatMessageTime('2024-01-10T17:00:00Z');
        expect(result).toBe('Jan 10');
      });

      it('should return "Mon Day" format for dates from a week ago', () => {
        jest.useFakeTimers();
        // Set "now" to Jan 15, 2024
        jest.setSystemTime(new Date('2024-01-15T17:00:00Z'));

        // A date from Jan 5, 2024
        const result = formatMessageTime('2024-01-05T17:00:00Z');
        expect(result).toBe('Jan 5');
      });
    });

    describe('previous year timestamps', () => {
      it('should return "Mon Day, Year" format for dates from previous year', () => {
        jest.useFakeTimers();
        // Set "now" to Jan 15, 2024
        jest.setSystemTime(new Date('2024-01-15T17:00:00Z'));

        // A date from Dec 25, 2023
        const result = formatMessageTime('2023-12-25T17:00:00Z');
        expect(result).toBe('Dec 25, 2023');
      });

      it('should return "Mon Day, Year" format for dates from much older years', () => {
        jest.useFakeTimers();
        // Set "now" to Jan 15, 2024
        jest.setSystemTime(new Date('2024-01-15T17:00:00Z'));

        // A date from 2020
        const result = formatMessageTime('2020-06-15T17:00:00Z');
        expect(result).toBe('Jun 15, 2020');
      });
    });

    describe('edge cases', () => {
      it('should return original string for invalid date', () => {
        const result = formatMessageTime('not-a-date');
        expect(result).toBe('not-a-date');
      });

      it('should handle timestamps without Z suffix', () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-15T22:00:00Z'));

        const result = formatMessageTime('2024-01-15T19:00:00');
        expect(result).toMatch(/12:00.*PM/);
      });

      it('should return original string for empty string', () => {
        const result = formatMessageTime('');
        expect(result).toBe('');
      });
    });
  });

  describe('formatConversationTime', () => {
    it('should be the same function as formatMessageTime', () => {
      expect(formatConversationTime).toBe(formatMessageTime);
    });

    it('should work with same inputs as formatMessageTime', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T22:00:00Z'));

      const result = formatConversationTime('2024-01-15T19:00:00Z');
      expect(result).toMatch(/12:00.*PM/);

      jest.useRealTimers();
    });
  });

  describe('DST handling', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('should correctly handle date during MST (winter)', () => {
      jest.useFakeTimers();
      // January is MST (UTC-7)
      jest.setSystemTime(new Date('2024-01-15T20:00:00Z'));

      // 8:00 PM UTC = 1:00 PM MST
      const result = formatMountainTime('2024-01-15T20:00:00Z');
      expect(result).toContain('1:00');
      expect(result).toContain('PM');
    });

    it('should correctly handle date during MDT (summer)', () => {
      jest.useFakeTimers();
      // July is MDT (UTC-6)
      jest.setSystemTime(new Date('2024-07-15T19:00:00Z'));

      // 7:00 PM UTC = 1:00 PM MDT
      const result = formatMountainTime('2024-07-15T19:00:00Z');
      expect(result).toContain('1:00');
      expect(result).toContain('PM');
    });
  });
});
