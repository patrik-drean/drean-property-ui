import { Transaction } from '../types/transaction';
import { format, startOfMonth, subMonths } from 'date-fns';

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
export function getIncomeCategories(report: PropertyPLReport): string[] {
  const categories = new Set<string>();
  report.months.forEach(m => {
    Object.keys(m.incomeByCategory).forEach(cat => categories.add(cat));
  });
  return Array.from(categories).sort();
}

/**
 * Get all unique expense categories from report
 */
export function getExpenseCategories(report: PropertyPLReport): string[] {
  const categories = new Set<string>();
  report.months.forEach(m => {
    Object.keys(m.expensesByCategory).forEach(cat => categories.add(cat));
  });
  return Array.from(categories).sort();
}
