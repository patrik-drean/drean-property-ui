import {
  VoiceCall,
  formatCallDuration,
  getCallStatusDisplay,
  getCallStatusColor,
} from '../voice';

describe('voice type helpers', () => {
  describe('formatCallDuration', () => {
    it('should format 0 seconds as "0:00"', () => {
      expect(formatCallDuration(0)).toBe('0:00');
    });

    it('should format undefined as "0:00"', () => {
      expect(formatCallDuration(undefined)).toBe('0:00');
    });

    it('should format seconds less than a minute', () => {
      expect(formatCallDuration(45)).toBe('0:45');
    });

    it('should format exactly 1 minute', () => {
      expect(formatCallDuration(60)).toBe('1:00');
    });

    it('should format minutes and seconds', () => {
      expect(formatCallDuration(125)).toBe('2:05');
    });

    it('should format large durations', () => {
      expect(formatCallDuration(3661)).toBe('61:01');
    });

    it('should pad single digit seconds with zero', () => {
      expect(formatCallDuration(61)).toBe('1:01');
      expect(formatCallDuration(69)).toBe('1:09');
    });

    it('should not pad double digit seconds', () => {
      expect(formatCallDuration(70)).toBe('1:10');
      expect(formatCallDuration(119)).toBe('1:59');
    });
  });

  describe('getCallStatusDisplay', () => {
    const testCases: [VoiceCall['status'], string][] = [
      ['initiating', 'Initiating...'],
      ['ringing', 'Ringing'],
      ['in-progress', 'In Progress'],
      ['completed', 'Completed'],
      ['busy', 'Busy'],
      ['no-answer', 'No Answer'],
      ['failed', 'Failed'],
      ['canceled', 'Canceled'],
    ];

    testCases.forEach(([status, expected]) => {
      it(`should return "${expected}" for status "${status}"`, () => {
        expect(getCallStatusDisplay(status)).toBe(expected);
      });
    });
  });

  describe('getCallStatusColor', () => {
    it('should return "success" for completed status', () => {
      expect(getCallStatusColor('completed')).toBe('success');
    });

    it('should return "primary" for in-progress status', () => {
      expect(getCallStatusColor('in-progress')).toBe('primary');
    });

    it('should return "primary" for ringing status', () => {
      expect(getCallStatusColor('ringing')).toBe('primary');
    });

    it('should return "warning" for initiating status', () => {
      expect(getCallStatusColor('initiating')).toBe('warning');
    });

    it('should return "default" for busy status', () => {
      expect(getCallStatusColor('busy')).toBe('default');
    });

    it('should return "default" for no-answer status', () => {
      expect(getCallStatusColor('no-answer')).toBe('default');
    });

    it('should return "default" for canceled status', () => {
      expect(getCallStatusColor('canceled')).toBe('default');
    });

    it('should return "danger" for failed status', () => {
      expect(getCallStatusColor('failed')).toBe('danger');
    });
  });
});
