import { Transaction } from '../types/transaction';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface MonthlyPLData {
  month: string; // "2025-09" format
  incomeByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
}

export interface PropertyPLReport {
  propertyId: string;
  propertyAddress: string;
  months: MonthlyPLData[];
  sixMonthAverage: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
  };
}

/**
 * Generate property P&L report from transactions
 */
export function generatePropertyPLReport(
  transactions: Transaction[],
  propertyId: string,
  propertyAddress: string,
  months: number = 6
): PropertyPLReport {
  // Filter to operational expenses only for this property
  const filtered = transactions.filter(t =>
    t.propertyId === propertyId &&
    t.expenseType === 'Operating'
  );

  // Get last N months
  const endDate = new Date();
  const startDate = subMonths(endDate, months);

  // Group by month using override_date if present, else date
  const byMonth = new Map<string, Transaction[]>();

  filtered.forEach(transaction => {
    const reportDate = transaction.overrideDate || transaction.date;
    const transDate = new Date(reportDate);

    if (transDate >= startDate && transDate <= endDate) {
      const monthKey = format(transDate, 'yyyy-MM');
      if (!byMonth.has(monthKey)) {
        byMonth.set(monthKey, []);
      }
      byMonth.get(monthKey)!.push(transaction);
    }
  });

  // Generate monthly data
  const monthlyData: MonthlyPLData[] = [];

  // Create array of last N months
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(endDate, i);
    const monthKey = format(startOfMonth(monthDate), 'yyyy-MM');
    const monthTransactions = byMonth.get(monthKey) || [];

    const incomeByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpenses = 0;

    monthTransactions.forEach(t => {
      if (t.amount > 0) {
        // Income
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
        totalIncome += t.amount;
      } else {
        // Expense (amount is negative)
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Math.abs(t.amount);
        totalExpenses += Math.abs(t.amount);
      }
    });

    monthlyData.push({
      month: monthKey,
      incomeByCategory,
      expensesByCategory,
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses
    });
  }

  // Calculate 6-month average
  const avgIncome = monthlyData.reduce((sum, m) => sum + m.totalIncome, 0) / monthlyData.length;
  const avgExpenses = monthlyData.reduce((sum, m) => sum + m.totalExpenses, 0) / monthlyData.length;

  return {
    propertyId,
    propertyAddress,
    months: monthlyData,
    sixMonthAverage: {
      totalIncome: avgIncome,
      totalExpenses: avgExpenses,
      netIncome: avgIncome - avgExpenses
    }
  };
}

/**
 * Get all unique income categories from report
 */
export function getIncomeCategories(report: PropertyPLReport | PortfolioPLReport): string[] {
  const categories = new Set<string>();
  report.months.forEach(m => {
    Object.keys(m.incomeByCategory).forEach(cat => categories.add(cat));
  });
  return Array.from(categories).sort();
}

/**
 * Get all unique expense categories from report
 */
export function getExpenseCategories(report: PropertyPLReport | PortfolioPLReport): string[] {
  const categories = new Set<string>();
  report.months.forEach(m => {
    Object.keys(m.expensesByCategory).forEach(cat => categories.add(cat));
  });
  return Array.from(categories).sort();
}

export interface PropertyBreakdown {
  propertyId: string;
  propertyAddress: string;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  lastMonthIncome: number;
  lastMonthExpenses: number;
  lastMonthNetIncome: number;
}

export interface PortfolioPLReport {
  months: MonthlyPLData[];
  sixMonthAverage: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
  };
  lastFullMonth: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
  };
  propertyBreakdowns: PropertyBreakdown[];
}

/**
 * Generate portfolio P&L report from all transactions
 * Excludes archived properties and properties in Soft Offer, Hard Offer, or Opportunity status
 */
export function generatePortfolioPLReport(
  transactions: Transaction[],
  properties: Array<{ id: string; address: string; archived?: boolean; status?: string }>,
  months: number = 6
): PortfolioPLReport {
  // Filter to active properties only (exclude archived and specific statuses)
  const activePropertyIds = new Set(
    properties
      .filter(p => !p.archived && !['Soft offer', 'Hard offer', 'Opportunity'].includes(p.status || ''))
      .map(p => p.id)
  );

  // Filter to operational expenses only for active properties
  const filtered = transactions.filter(t =>
    t.expenseType === 'Operating' &&
    (t.propertyId === null || t.propertyId === 'business' || t.propertyId === undefined || activePropertyIds.has(t.propertyId))
  );

  // Get last N months (use month boundaries)
  const endDate = endOfMonth(new Date());
  const startDate = startOfMonth(subMonths(new Date(), months));

  // Group by month
  const byMonth = new Map<string, Transaction[]>();

  filtered.forEach(transaction => {
    const reportDate = transaction.overrideDate || transaction.date;
    const transDate = new Date(reportDate);

    if (transDate >= startDate && transDate <= endDate) {
      // Use date string directly to avoid timezone issues
      const monthKey = reportDate.substring(0, 7); // Extract 'yyyy-MM' from 'yyyy-MM-dd'
      if (!byMonth.has(monthKey)) {
        byMonth.set(monthKey, []);
      }
      byMonth.get(monthKey)!.push(transaction);
    }
  });

  // Generate monthly data (aggregate across all properties)
  const monthlyData: MonthlyPLData[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(endDate, i);
    const monthKey = format(startOfMonth(monthDate), 'yyyy-MM');
    const monthTransactions = byMonth.get(monthKey) || [];

    const incomeByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpenses = 0;

    monthTransactions.forEach(t => {
      if (t.amount > 0) {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
        totalIncome += t.amount;
      } else {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Math.abs(t.amount);
        totalExpenses += Math.abs(t.amount);
      }
    });

    monthlyData.push({
      month: monthKey,
      incomeByCategory,
      expensesByCategory,
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses
    });
  }

  // Calculate 6-month average
  const avgIncome = monthlyData.reduce((sum, m) => sum + m.totalIncome, 0) / monthlyData.length;
  const avgExpenses = monthlyData.reduce((sum, m) => sum + m.totalExpenses, 0) / monthlyData.length;

  // Get last full month (previous month, not current)
  const lastFullMonthDate = subMonths(startOfMonth(new Date()), 1);
  const lastFullMonthKey = format(lastFullMonthDate, 'yyyy-MM');
  const lastFullMonthData = monthlyData.find(m => m.month === lastFullMonthKey) || {
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    month: lastFullMonthKey,
    incomeByCategory: {},
    expensesByCategory: {}
  };

  // Property-level breakdown (totals for entire period + last full month)
  const propertyMap = new Map(
    properties
      .filter(p => !p.archived && !['Soft offer', 'Hard offer', 'Opportunity'].includes(p.status || ''))
      .map(p => [p.id, p.address])
  );
  const breakdowns: PropertyBreakdown[] = [];

  // Group by property
  const byProperty = new Map<string, Transaction[]>();
  filtered.forEach(t => {
    const propId = t.propertyId || 'business';
    if (!byProperty.has(propId)) {
      byProperty.set(propId, []);
    }
    byProperty.get(propId)!.push(t);
  });

  byProperty.forEach((propTransactions, propId) => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let lastMonthIncome = 0;
    let lastMonthExpenses = 0;

    propTransactions.forEach(t => {
      const reportDate = t.overrideDate || t.date;
      // Use date string directly to avoid timezone issues
      const transMonthKey = reportDate.substring(0, 7);
      const isLastMonth = transMonthKey === lastFullMonthKey;

      if (t.amount > 0) {
        totalIncome += t.amount;
        if (isLastMonth) lastMonthIncome += t.amount;
      } else {
        totalExpenses += Math.abs(t.amount);
        if (isLastMonth) lastMonthExpenses += Math.abs(t.amount);
      }
    });

    breakdowns.push({
      propertyId: propId,
      propertyAddress: propId === 'business' ? 'Business (No Property)' : propertyMap.get(propId) || propId,
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      lastMonthIncome,
      lastMonthExpenses,
      lastMonthNetIncome: lastMonthIncome - lastMonthExpenses
    });
  });

  // Sort by net income descending
  breakdowns.sort((a, b) => b.netIncome - a.netIncome);

  return {
    months: monthlyData,
    sixMonthAverage: {
      totalIncome: avgIncome,
      totalExpenses: avgExpenses,
      netIncome: avgIncome - avgExpenses
    },
    lastFullMonth: {
      totalIncome: lastFullMonthData.totalIncome,
      totalExpenses: lastFullMonthData.totalExpenses,
      netIncome: lastFullMonthData.netIncome
    },
    propertyBreakdowns: breakdowns
  };
}
