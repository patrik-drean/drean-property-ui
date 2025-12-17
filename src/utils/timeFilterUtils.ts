import { TimeFilterPreset } from '../types/salesFunnel';

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export const calculateDateRange = (preset: TimeFilterPreset): DateRange => {
  const now = new Date();
  const endDate = now; // Always end at current date/time

  switch (preset) {
    case 'last7':
      return {
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate,
      };

    case 'last30':
      return {
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate,
      };

    case 'last60':
      return {
        startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        endDate,
      };

    case 'last90':
      return {
        startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        endDate,
      };

    case 'last365':
      return {
        startDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        endDate,
      };

    case 'allTime':
      return {
        startDate: undefined,
        endDate: undefined,
      };

    default:
      return {
        startDate: undefined,
        endDate: undefined,
      };
  }
};

export const getPresetLabel = (preset: TimeFilterPreset): string => {
  const labels: Record<TimeFilterPreset, string> = {
    last7: 'Last 7 Days',
    last30: 'Last 30 Days',
    last60: 'Last 60 Days',
    last90: 'Last 90 Days',
    last365: 'Last 365 Days',
    allTime: 'All Time',
  };

  return labels[preset];
};
