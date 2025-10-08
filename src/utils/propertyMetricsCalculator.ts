import { Property, PropertyUnit } from '../types/property';
import { PropertyPLReport, MonthlyPLData } from './reportUtils';

export interface VacantUnitInfo {
  unitNumber: string;
  rent: number;
  daysVacant: number;
  status: string;
}

export interface DelinquentUnitInfo {
  unitNumber: string;
  rent: number;
  daysBehind: number;
  amountOwed: number;
}

export interface OperationalMetrics {
  // Critical Problem Indicators
  consecutiveMonthsWithLosses: number;
  vacantUnits: VacantUnitInfo[];
  delinquentUnits: DelinquentUnitInfo[];

  // Performance Metrics
  lastMonth: {
    income: number;
    expenses: number;
    cashflow: number;
  };
  occupancyRate: number;
  topExpenseCategories: Array<{ category: string; amount: number }>;
}

/**
 * Calculate consecutive months with losses starting from most recent month
 */
export function calculateConsecutiveMonthsWithLosses(
  months: MonthlyPLData[]
): number {
  let consecutive = 0;
  // Start from most recent month (last in array) and work backwards
  for (let i = months.length - 1; i >= 0; i--) {
    if (months[i].netIncome < 0) {
      consecutive++;
    } else {
      break;
    }
  }
  return consecutive;
}

/**
 * Calculate days since a unit's status last changed
 */
export function calculateDaysSinceStatusChange(unit: PropertyUnit): number {
  if (!unit.statusHistory || unit.statusHistory.length === 0) {
    return 0;
  }

  const lastStatus = unit.statusHistory[unit.statusHistory.length - 1];
  const statusDate = new Date(lastStatus.dateStart);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - statusDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Calculate occupancy rate as percentage of non-vacant units
 */
export function calculateOccupancyRate(units: PropertyUnit[]): number {
  if (units.length === 0) return 0;

  const nonVacant = units.filter(u => u.status !== 'Vacant').length;
  return Math.round((nonVacant / units.length) * 100);
}

/**
 * Get top expense categories from last month
 */
export function getTopExpenseCategories(
  lastMonthData: MonthlyPLData | undefined,
  limit: number = 3
): Array<{ category: string; amount: number }> {
  if (!lastMonthData) return [];

  const expenses = Object.entries(lastMonthData.expensesByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);

  return expenses;
}

/**
 * Get all vacant units with days vacant
 */
export function getVacantUnits(units: PropertyUnit[]): VacantUnitInfo[] {
  return units
    .map((u, index) => ({
      unit: u,
      unitNumber: (index + 1).toString(),
    }))
    .filter(({ unit }) => unit.status === 'Vacant')
    .map(({ unit, unitNumber }) => ({
      unitNumber,
      rent: unit.rent,
      daysVacant: calculateDaysSinceStatusChange(unit),
      status: unit.status,
    }))
    .sort((a, b) => b.daysVacant - a.daysVacant); // Sort by days vacant desc
}

/**
 * Get all delinquent units with days behind and amount owed
 */
export function getDelinquentUnits(units: PropertyUnit[]): DelinquentUnitInfo[] {
  return units
    .map((u, index) => ({
      unit: u,
      unitNumber: (index + 1).toString(),
    }))
    .filter(({ unit }) => unit.status === 'Behind on Rent')
    .map(({ unit, unitNumber }) => {
      const daysBehind = calculateDaysSinceStatusChange(unit);
      // Calculate amount owed (approximate based on days behind)
      const monthsBehind = Math.floor(daysBehind / 30);
      const amountOwed = unit.rent * monthsBehind;

      return {
        unitNumber,
        rent: unit.rent,
        daysBehind,
        amountOwed,
      };
    })
    .sort((a, b) => b.daysBehind - a.daysBehind); // Sort by days behind desc
}

/**
 * Main function to calculate all operational metrics
 */
export function calculateOperationalMetrics(
  property: Property,
  plReport: PropertyPLReport
): OperationalMetrics {
  const units = property.propertyUnits || [];

  // Find the last month with actual data (non-zero income or expenses)
  let lastMonthData = plReport.months[plReport.months.length - 1];
  for (let i = plReport.months.length - 1; i >= 0; i--) {
    if (plReport.months[i].totalIncome > 0 || plReport.months[i].totalExpenses > 0) {
      lastMonthData = plReport.months[i];
      break;
    }
  }

  // Calculate consecutive losses
  const consecutiveMonthsWithLosses = calculateConsecutiveMonthsWithLosses(
    plReport.months
  );

  // Get vacant and delinquent units
  const vacantUnits = getVacantUnits(units);
  const delinquentUnits = getDelinquentUnits(units);

  // Calculate occupancy rate
  const occupancyRate = calculateOccupancyRate(units);

  // Get top expense categories
  const topExpenseCategories = getTopExpenseCategories(lastMonthData);

  // Last month metrics
  const lastMonth = lastMonthData
    ? {
        income: lastMonthData.totalIncome,
        expenses: lastMonthData.totalExpenses,
        cashflow: lastMonthData.netIncome,
      }
    : {
        income: 0,
        expenses: 0,
        cashflow: 0,
      };

  return {
    consecutiveMonthsWithLosses,
    vacantUnits,
    delinquentUnits,
    lastMonth,
    occupancyRate,
    topExpenseCategories,
  };
}
