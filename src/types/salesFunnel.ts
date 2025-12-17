export type TimeFilterPreset =
  | 'last7'
  | 'last30'
  | 'last60'
  | 'last90'
  | 'last365'
  | 'allTime';

export interface SalesFunnelStage {
  stageName: string;
  count: number;
  conversionRateFromPrevious: number | null;
}

export interface SalesFunnelReport {
  stages: SalesFunnelStage[];
  startDate: string | null;
  endDate: string | null;
  totalLeads: number;
  generatedAt: string;
}
