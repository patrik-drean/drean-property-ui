export type TimeFilterPreset =
  | 'last7'
  | 'last30'
  | 'last60'
  | 'last90'
  | 'last365'
  | 'allTime';

export interface StageLead {
  id: string;
  address: string;
  listingPrice: number;
  score: number | null;
  status: string;
  createdAt: string;
  stageEnteredAt: string | null;
  daysInStage: number | null;
}

export interface SalesFunnelStage {
  stageName: string;
  count: number;
  conversionRateFromPrevious: number | null;
  leads?: StageLead[];
}

export interface DataQualityIssue {
  leadId: string;
  address: string;
  issue: string;
  severity: 'warning' | 'error';
}

export interface StageBreakdown {
  stageName: string;
  totalCount: number;
  withDateSet: number;
  withoutDateSet: number;
}

export interface DateSequenceError {
  leadId: string;
  address: string;
  error: string;
}

export interface StageDuration {
  fromStage: string;
  toStage: string;
  averageHours: number;
  medianHours: number;
  minHours: number;
  maxHours: number;
  sampleSize: number;
}

export interface LostByStage {
  lastStageBeforeLost: string;
  count: number;
  percentage: number;
}

export interface SalesFunnelDebugData {
  dataQualityIssues: DataQualityIssue[];
  stageBreakdowns: StageBreakdown[];
  dateSequenceErrors: DateSequenceError[];
  stageDurations: StageDuration[];
  lostByStage: LostByStage[];
}

export interface SalesFunnelReport {
  stages: SalesFunnelStage[];
  startDate: string | null;
  endDate: string | null;
  totalLeads: number;
  generatedAt: string;
  // Time-based engagement metrics
  averageTimeToFirstContactHours: number | null;
  timeToFirstContactLeadCount: number;
  averageResponseTimeHours: number | null;
  responseTimeLeadCount: number;
  // Debug data (optional)
  debugData?: SalesFunnelDebugData;
}
