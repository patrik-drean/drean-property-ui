import {
  calculateConsecutiveMonthsWithLosses,
  calculateDaysSinceStatusChange,
  calculateOccupancyRate,
  getTopExpenseCategories,
  getVacantUnits,
  getDelinquentUnits,
  calculateOperationalMetrics,
} from '../propertyMetricsCalculator';
import { PropertyUnit } from '../../types/property';
import { MonthlyPLData } from '../reportUtils';

describe('propertyMetricsCalculator', () => {
  describe('calculateConsecutiveMonthsWithLosses', () => {
    it('should return 0 for all profitable months', () => {
      const months: MonthlyPLData[] = [
        {
          month: '2025-07',
          incomeByCategory: {},
          expensesByCategory: {},
          totalIncome: 100,
          totalExpenses: 50,
          netIncome: 50,
        },
        {
          month: '2025-08',
          incomeByCategory: {},
          expensesByCategory: {},
          totalIncome: 200,
          totalExpenses: 100,
          netIncome: 100,
        },
        {
          month: '2025-09',
          incomeByCategory: {},
          expensesByCategory: {},
          totalIncome: 150,
          totalExpenses: 80,
          netIncome: 70,
        },
      ];
      expect(calculateConsecutiveMonthsWithLosses(months)).toBe(0);
    });

    it('should count consecutive losses from most recent month', () => {
      const months: MonthlyPLData[] = [
        {
          month: '2025-07',
          incomeByCategory: {},
          expensesByCategory: {},
          totalIncome: 100,
          totalExpenses: 50,
          netIncome: 50,
        },
        {
          month: '2025-08',
          incomeByCategory: {},
          expensesByCategory: {},
          totalIncome: 50,
          totalExpenses: 100,
          netIncome: -50,
        },
        {
          month: '2025-09',
          incomeByCategory: {},
          expensesByCategory: {},
          totalIncome: 75,
          totalExpenses: 175,
          netIncome: -100,
        },
        {
          month: '2025-10',
          incomeByCategory: {},
          expensesByCategory: {},
          totalIncome: 100,
          totalExpenses: 175,
          netIncome: -75,
        },
      ];
      expect(calculateConsecutiveMonthsWithLosses(months)).toBe(3);
    });

    it('should stop counting when encountering profitable month', () => {
      const months: MonthlyPLData[] = [
        {
          month: '2025-07',
          incomeByCategory: {},
          expensesByCategory: {},
          totalIncome: 50,
          totalExpenses: 150,
          netIncome: -100,
        },
        {
          month: '2025-08',
          incomeByCategory: {},
          expensesByCategory: {},
          totalIncome: 100,
          totalExpenses: 50,
          netIncome: 50,
        },
        {
          month: '2025-09',
          incomeByCategory: {},
          expensesByCategory: {},
          totalIncome: 75,
          totalExpenses: 175,
          netIncome: -100,
        },
        {
          month: '2025-10',
          incomeByCategory: {},
          expensesByCategory: {},
          totalIncome: 100,
          totalExpenses: 175,
          netIncome: -75,
        },
      ];
      expect(calculateConsecutiveMonthsWithLosses(months)).toBe(2);
    });

    it('should return 0 for empty months array', () => {
      expect(calculateConsecutiveMonthsWithLosses([])).toBe(0);
    });
  });

  describe('calculateDaysSinceStatusChange', () => {
    it('should calculate days from last status change', () => {
      // Mock a date 36 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 36);

      const unit: PropertyUnit = {
        id: 'unit-1',
        propertyId: 'prop-1',
        status: 'Vacant',
        rent: 1000,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusHistory: [
          {
            status: 'Vacant',
            dateStart: thirtyDaysAgo.toISOString(),
          },
        ],
      };

      const days = calculateDaysSinceStatusChange(unit);
      expect(days).toBeGreaterThanOrEqual(36);
      expect(days).toBeLessThanOrEqual(37);
    });

    it('should return 0 if no status history', () => {
      const unit: PropertyUnit = {
        id: 'unit-1',
        propertyId: 'prop-1',
        status: 'Occupied',
        rent: 1000,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statusHistory: [],
      };

      expect(calculateDaysSinceStatusChange(unit)).toBe(0);
    });
  });

  describe('calculateOccupancyRate', () => {
    it('should calculate percentage of non-vacant units', () => {
      const units: PropertyUnit[] = [
        {
          id: 'unit-1',
          propertyId: 'prop-1',
          status: 'Occupied',
          rent: 1000,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: [],
        },
        {
          id: 'unit-2',
          propertyId: 'prop-1',
          status: 'Occupied',
          rent: 1000,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: [],
        },
        {
          id: 'unit-3',
          propertyId: 'prop-1',
          status: 'Vacant',
          rent: 1000,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: [],
        },
        {
          id: 'unit-4',
          propertyId: 'prop-1',
          status: 'Occupied',
          rent: 1000,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: [],
        },
        {
          id: 'unit-5',
          propertyId: 'prop-1',
          status: 'Behind on Rent',
          rent: 1000,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: [],
        },
      ];

      expect(calculateOccupancyRate(units)).toBe(80); // 4/5 non-vacant = 80%
    });

    it('should return 0 for empty units array', () => {
      expect(calculateOccupancyRate([])).toBe(0);
    });

    it('should return 100 if all units are non-vacant', () => {
      const units: PropertyUnit[] = [
        {
          id: 'unit-1',
          propertyId: 'prop-1',
          status: 'Occupied',
          rent: 1000,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: [],
        },
        {
          id: 'unit-2',
          propertyId: 'prop-1',
          status: 'Occupied',
          rent: 1000,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: [],
        },
      ];

      expect(calculateOccupancyRate(units)).toBe(100);
    });
  });

  describe('getTopExpenseCategories', () => {
    it('should return top 3 expense categories sorted by amount', () => {
      const monthData: MonthlyPLData = {
        month: '2025-10',
        incomeByCategory: {},
        expensesByCategory: {
          'Maintenance': 450,
          'Utilities': 320,
          'Insurance': 200,
          'Property Management': 150,
          'Other': 100,
        },
        totalIncome: 2000,
        totalExpenses: 1220,
        netIncome: 780,
      };

      const result = getTopExpenseCategories(monthData);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ category: 'Maintenance', amount: 450 });
      expect(result[1]).toEqual({ category: 'Utilities', amount: 320 });
      expect(result[2]).toEqual({ category: 'Insurance', amount: 200 });
    });

    it('should return empty array if no month data', () => {
      expect(getTopExpenseCategories(undefined)).toEqual([]);
    });

    it('should handle fewer than 3 categories', () => {
      const monthData: MonthlyPLData = {
        month: '2025-10',
        incomeByCategory: {},
        expensesByCategory: {
          'Maintenance': 450,
          'Utilities': 320,
        },
        totalIncome: 2000,
        totalExpenses: 770,
        netIncome: 1230,
      };

      const result = getTopExpenseCategories(monthData);
      expect(result).toHaveLength(2);
    });
  });

  describe('getVacantUnits', () => {
    it('should return vacant units with days vacant', () => {
      const fortyDaysAgo = new Date();
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 45);

      const units: PropertyUnit[] = [
        {
          id: 'unit-1',
          propertyId: 'prop-1',
          status: 'Vacant',
          rent: 1000,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: [
            {
              status: 'Vacant',
              dateStart: fortyDaysAgo.toISOString(),
            },
          ],
        },
        {
          id: 'unit-2',
          propertyId: 'prop-1',
          status: 'Occupied',
          rent: 1000,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: [],
        },
        {
          id: 'unit-3',
          propertyId: 'prop-1',
          status: 'Vacant',
          rent: 1200,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: [
            {
              status: 'Vacant',
              dateStart: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
        },
      ];

      const result = getVacantUnits(units);

      expect(result).toHaveLength(2);
      expect(result[0].unitNumber).toBe('1'); // Unit at index 0, longer vacancy first
      expect(result[1].unitNumber).toBe('3'); // Unit at index 2
      expect(result[0].daysVacant).toBeGreaterThan(result[1].daysVacant);
    });

    it('should return empty array if no vacant units', () => {
      const units: PropertyUnit[] = [
        {
          id: 'unit-1',
          propertyId: 'prop-1',
          status: 'Occupied',
          rent: 1000,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: [],
        },
      ];

      expect(getVacantUnits(units)).toEqual([]);
    });
  });

  describe('getDelinquentUnits', () => {
    it('should return delinquent units with days behind and amount owed', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 32);

      const units: PropertyUnit[] = [
        {
          id: 'unit-1',
          propertyId: 'prop-1',
          status: 'Behind on Rent',
          rent: 1000,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: [
            {
              status: 'Behind on Rent',
              dateStart: thirtyDaysAgo.toISOString(),
            },
          ],
        },
        {
          id: 'unit-2',
          propertyId: 'prop-1',
          status: 'Occupied',
          rent: 1000,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: [],
        },
      ];

      const result = getDelinquentUnits(units);

      expect(result).toHaveLength(1);
      expect(result[0].unitNumber).toBe('1'); // Unit at index 0
      expect(result[0].rent).toBe(1000);
      expect(result[0].daysBehind).toBeGreaterThanOrEqual(32);
      expect(result[0].amountOwed).toBe(1000); // 1 month behind
    });

    it('should calculate amount owed based on months behind', () => {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 65);

      const units: PropertyUnit[] = [
        {
          id: 'unit-1',
          propertyId: 'prop-1',
          status: 'Behind on Rent',
          rent: 1200,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: [
            {
              status: 'Behind on Rent',
              dateStart: sixtyDaysAgo.toISOString(),
            },
          ],
        },
      ];

      const result = getDelinquentUnits(units);

      expect(result[0].amountOwed).toBe(2400); // 2 months * 1200
    });

    it('should return empty array if no delinquent units', () => {
      const units: PropertyUnit[] = [
        {
          id: 'unit-1',
          propertyId: 'prop-1',
          status: 'Occupied',
          rent: 1000,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: [],
        },
      ];

      expect(getDelinquentUnits(units)).toEqual([]);
    });
  });

  describe('calculateOperationalMetrics', () => {
    it('should calculate all metrics correctly', () => {
      const property: any = {
        id: 'prop-1',
        propertyUnits: [
          {
            id: 'unit-1',
            propertyId: 'prop-1',
            status: 'Occupied',
            rent: 1000,
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            statusHistory: [],
          },
          {
            id: 'unit-2',
            propertyId: 'prop-1',
            status: 'Vacant',
            rent: 1000,
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            statusHistory: [
              {
                status: 'Vacant',
                dateStart: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
          },
          {
            id: 'unit-3',
            propertyId: 'prop-1',
            status: 'Behind on Rent',
            rent: 1000,
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            statusHistory: [
              {
                status: 'Behind on Rent',
                dateStart: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
          },
        ],
      };

      const plReport: any = {
        propertyId: 'prop-1',
        propertyAddress: '123 Main St',
        months: [
          {
            month: '2025-08',
            incomeByCategory: { 'Rent Income': 1500 },
            expensesByCategory: { 'Maintenance': 300 },
            totalIncome: 1500,
            totalExpenses: 300,
            netIncome: 1200,
          },
          {
            month: '2025-09',
            incomeByCategory: { 'Rent Income': 1800 },
            expensesByCategory: { 'Maintenance': 450, 'Utilities': 320 },
            totalIncome: 1800,
            totalExpenses: 770,
            netIncome: 1030,
          },
          {
            month: '2025-10',
            incomeByCategory: { 'Rent Income': 1800 },
            expensesByCategory: { 'Maintenance': 450, 'Utilities': 320, 'Insurance': 200 },
            totalIncome: 1800,
            totalExpenses: 2200,
            netIncome: -400,
          },
        ],
        sixMonthAverage: {
          totalIncome: 1700,
          totalExpenses: 1090,
          netIncome: 610,
        },
      };

      const metrics = calculateOperationalMetrics(property, plReport);

      expect(metrics.consecutiveMonthsWithLosses).toBe(1);
      expect(metrics.vacantUnits).toHaveLength(1);
      expect(metrics.delinquentUnits).toHaveLength(1);
      expect(metrics.lastMonth.income).toBe(1800);
      expect(metrics.lastMonth.expenses).toBe(2200);
      expect(metrics.lastMonth.cashflow).toBe(-400);
      expect(metrics.occupancyRate).toBe(67); // 2/3 non-vacant = 67%
      expect(metrics.topExpenseCategories).toHaveLength(3);
      expect(metrics.topExpenseCategories[0].category).toBe('Maintenance');
    });
  });
});
