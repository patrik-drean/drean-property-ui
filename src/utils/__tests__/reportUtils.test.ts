import {
  generatePropertyPLReport,
  generatePortfolioPLReport,
  getIncomeCategories,
  getExpenseCategories,
  calculateMonthlyOccupancy
} from '../reportUtils';
import { Transaction } from '../../types/transaction';
import { format, subMonths, startOfMonth } from 'date-fns';

describe('reportUtils', () => {
  const mockPropertyId = 'prop-123';
  const mockPropertyAddress = '123 Main St';

  const createMockTransaction = (
    amount: number,
    category: string,
    date: string,
    overrideDate?: string
  ): Transaction => ({
    id: `trans-${Math.random()}`,
    date,
    amount,
    category,
    propertyId: mockPropertyId,
    expenseType: 'Operating',
    overrideDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  describe('generatePropertyPLReport', () => {
    it('should generate report with income and expenses', () => {
      const currentDate = new Date();
      const lastMonth = format(subMonths(currentDate, 1), 'yyyy-MM-dd');

      const transactions: Transaction[] = [
        createMockTransaction(1500, 'Rent Income', lastMonth),
        createMockTransaction(-500, 'Maintenance', lastMonth),
        createMockTransaction(-300, 'Utilities', lastMonth)
      ];

      const report = generatePropertyPLReport(
        transactions,
        mockPropertyId,
        mockPropertyAddress,
        6
      );

      expect(report.propertyId).toBe(mockPropertyId);
      expect(report.propertyAddress).toBe(mockPropertyAddress);
      expect(report.months).toHaveLength(6);

      // Check last month has data
      const lastMonthKey = format(subMonths(currentDate, 1), 'yyyy-MM');
      const lastMonthData = report.months.find(m => m.month === lastMonthKey);

      expect(lastMonthData).toBeDefined();
      expect(lastMonthData!.totalIncome).toBe(1500);
      expect(lastMonthData!.totalExpenses).toBe(800);
      expect(lastMonthData!.netIncome).toBe(700);
    });

    it('should handle override dates correctly', () => {
      const currentDate = new Date();
      const twoMonthsAgo = format(subMonths(currentDate, 2), 'yyyy-MM-dd');
      const lastMonth = format(subMonths(currentDate, 1), 'yyyy-MM-dd');

      // Transaction dated 2 months ago but overridden to last month
      const transactions: Transaction[] = [
        createMockTransaction(1000, 'Rent Income', twoMonthsAgo, lastMonth)
      ];

      const report = generatePropertyPLReport(
        transactions,
        mockPropertyId,
        mockPropertyAddress,
        6
      );

      const lastMonthKey = format(subMonths(currentDate, 1), 'yyyy-MM');
      const lastMonthData = report.months.find(m => m.month === lastMonthKey);

      // Should appear in last month due to override date
      expect(lastMonthData!.totalIncome).toBe(1000);

      // Should NOT appear in 2 months ago
      const twoMonthsAgoKey = format(subMonths(currentDate, 2), 'yyyy-MM');
      const twoMonthsAgoData = report.months.find(m => m.month === twoMonthsAgoKey);
      expect(twoMonthsAgoData!.totalIncome).toBe(0);
    });

    it('should filter to operational expenses only', () => {
      const currentDate = new Date();
      const lastMonth = format(subMonths(currentDate, 1), 'yyyy-MM-dd');

      const transactions: Transaction[] = [
        { ...createMockTransaction(-500, 'Repair', lastMonth), expenseType: 'Operating' },
        { ...createMockTransaction(-5000, 'Renovation', lastMonth), expenseType: 'Capital' }
      ];

      const report = generatePropertyPLReport(
        transactions,
        mockPropertyId,
        mockPropertyAddress,
        6
      );

      const lastMonthKey = format(subMonths(currentDate, 1), 'yyyy-MM');
      const lastMonthData = report.months.find(m => m.month === lastMonthKey);

      // Only operational expense should be included
      expect(lastMonthData!.totalExpenses).toBe(500);
    });

    it('should filter to specific property only', () => {
      const currentDate = new Date();
      const lastMonth = format(subMonths(currentDate, 1), 'yyyy-MM-dd');

      const transactions: Transaction[] = [
        createMockTransaction(1000, 'Rent', lastMonth), // propertyId: prop-123
        { ...createMockTransaction(2000, 'Rent', lastMonth), propertyId: 'prop-456' }
      ];

      const report = generatePropertyPLReport(
        transactions,
        mockPropertyId,
        mockPropertyAddress,
        6
      );

      const lastMonthKey = format(subMonths(currentDate, 1), 'yyyy-MM');
      const lastMonthData = report.months.find(m => m.month === lastMonthKey);

      // Only this property's income should be included
      expect(lastMonthData!.totalIncome).toBe(1000);
    });

    it('should group transactions by category', () => {
      const currentDate = new Date();
      const lastMonth = format(subMonths(currentDate, 1), 'yyyy-MM-dd');

      const transactions: Transaction[] = [
        createMockTransaction(1500, 'Rent Income', lastMonth),
        createMockTransaction(500, 'Parking Income', lastMonth),
        createMockTransaction(-300, 'Utilities', lastMonth),
        createMockTransaction(-200, 'Maintenance', lastMonth),
        createMockTransaction(-100, 'Maintenance', lastMonth) // Same category
      ];

      const report = generatePropertyPLReport(
        transactions,
        mockPropertyId,
        mockPropertyAddress,
        6
      );

      const lastMonthKey = format(subMonths(currentDate, 1), 'yyyy-MM');
      const lastMonthData = report.months.find(m => m.month === lastMonthKey);

      expect(lastMonthData!.incomeByCategory['Rent Income']).toBe(1500);
      expect(lastMonthData!.incomeByCategory['Parking Income']).toBe(500);
      expect(lastMonthData!.expensesByCategory['Utilities']).toBe(300);
      expect(lastMonthData!.expensesByCategory['Maintenance']).toBe(300); // 200 + 100
    });

    it('should calculate 6-month averages correctly', () => {
      const currentDate = new Date();
      const transactions: Transaction[] = [];

      // Add transactions for 3 months: 1000, 2000, 3000 income
      for (let i = 1; i <= 3; i++) {
        const monthDate = format(subMonths(currentDate, i), 'yyyy-MM-dd');
        transactions.push(createMockTransaction(i * 1000, 'Rent', monthDate));
        transactions.push(createMockTransaction(-i * 100, 'Utilities', monthDate));
      }

      const report = generatePropertyPLReport(
        transactions,
        mockPropertyId,
        mockPropertyAddress,
        6
      );

      // Average income: (1000 + 2000 + 3000 + 0 + 0 + 0) / 6 = 1000
      expect(report.sixMonthAverage.totalIncome).toBe(1000);

      // Average expenses: (100 + 200 + 300 + 0 + 0 + 0) / 6 = 100
      expect(report.sixMonthAverage.totalExpenses).toBe(100);

      // Average net: 1000 - 100 = 900
      expect(report.sixMonthAverage.netIncome).toBe(900);
    });

    it('should include transactions dated the 1st of the oldest month in the window', () => {
      // Parsing "yyyy-MM-01" as a Date reads it as UTC midnight, which lands in the
      // previous month for timezones behind UTC and used to drop these transactions
      const endDate = subMonths(startOfMonth(new Date()), 1);
      const oldestMonth = format(subMonths(endDate, 5), 'yyyy-MM');

      const transactions: Transaction[] = [
        createMockTransaction(1100, 'Rent', `${oldestMonth}-01`)
      ];

      const report = generatePropertyPLReport(
        transactions,
        mockPropertyId,
        mockPropertyAddress,
        6
      );

      const oldestMonthData = report.months.find(m => m.month === oldestMonth);
      expect(oldestMonthData!.totalIncome).toBe(1100);
    });

    it('should handle empty transaction list', () => {
      const report = generatePropertyPLReport(
        [],
        mockPropertyId,
        mockPropertyAddress,
        6
      );

      expect(report.months).toHaveLength(6);
      expect(report.sixMonthAverage.totalIncome).toBe(0);
      expect(report.sixMonthAverage.totalExpenses).toBe(0);
      expect(report.sixMonthAverage.netIncome).toBe(0);
    });

    it('should generate correct number of months', () => {
      const transactions: Transaction[] = [];

      const report3Months = generatePropertyPLReport(
        transactions,
        mockPropertyId,
        mockPropertyAddress,
        3
      );

      const report12Months = generatePropertyPLReport(
        transactions,
        mockPropertyId,
        mockPropertyAddress,
        12
      );

      expect(report3Months.months).toHaveLength(3);
      expect(report12Months.months).toHaveLength(12);
    });
  });

  describe('getIncomeCategories', () => {
    it('should extract unique income categories', () => {
      const currentDate = new Date();
      const lastMonth = format(subMonths(currentDate, 1), 'yyyy-MM-dd');
      const twoMonthsAgo = format(subMonths(currentDate, 2), 'yyyy-MM-dd');

      const transactions: Transaction[] = [
        createMockTransaction(1500, 'Rent Income', lastMonth),
        createMockTransaction(500, 'Parking Income', lastMonth),
        createMockTransaction(1500, 'Rent Income', twoMonthsAgo), // Duplicate category
        createMockTransaction(300, 'Laundry Income', twoMonthsAgo)
      ];

      const report = generatePropertyPLReport(
        transactions,
        mockPropertyId,
        mockPropertyAddress,
        6
      );

      const categories = getIncomeCategories(report);

      expect(categories).toHaveLength(3);
      expect(categories).toContain('Rent Income');
      expect(categories).toContain('Parking Income');
      expect(categories).toContain('Laundry Income');
      expect(categories).toEqual(categories.slice().sort()); // Should be sorted
    });

    it('should return empty array when no income', () => {
      const currentDate = new Date();
      const lastMonth = format(subMonths(currentDate, 1), 'yyyy-MM-dd');

      const transactions: Transaction[] = [
        createMockTransaction(-500, 'Utilities', lastMonth)
      ];

      const report = generatePropertyPLReport(
        transactions,
        mockPropertyId,
        mockPropertyAddress,
        6
      );

      const categories = getIncomeCategories(report);
      expect(categories).toHaveLength(0);
    });
  });

  describe('getExpenseCategories', () => {
    it('should extract unique expense categories', () => {
      const currentDate = new Date();
      const lastMonth = format(subMonths(currentDate, 1), 'yyyy-MM-dd');
      const twoMonthsAgo = format(subMonths(currentDate, 2), 'yyyy-MM-dd');

      const transactions: Transaction[] = [
        createMockTransaction(-300, 'Utilities', lastMonth),
        createMockTransaction(-500, 'Maintenance', lastMonth),
        createMockTransaction(-300, 'Utilities', twoMonthsAgo), // Duplicate category
        createMockTransaction(-200, 'Insurance', twoMonthsAgo)
      ];

      const report = generatePropertyPLReport(
        transactions,
        mockPropertyId,
        mockPropertyAddress,
        6
      );

      const categories = getExpenseCategories(report);

      expect(categories).toHaveLength(3);
      expect(categories).toContain('Utilities');
      expect(categories).toContain('Maintenance');
      expect(categories).toContain('Insurance');
      expect(categories).toEqual(categories.slice().sort()); // Should be sorted
    });

    it('should return empty array when no expenses', () => {
      const currentDate = new Date();
      const lastMonth = format(subMonths(currentDate, 1), 'yyyy-MM-dd');

      const transactions: Transaction[] = [
        createMockTransaction(1500, 'Rent Income', lastMonth)
      ];

      const report = generatePropertyPLReport(
        transactions,
        mockPropertyId,
        mockPropertyAddress,
        6
      );

      const categories = getExpenseCategories(report);
      expect(categories).toHaveLength(0);
    });
  });

  describe('generatePortfolioPLReport', () => {
    const properties = [
      { id: 'prop-1', address: '123 Main St', archived: false, status: 'Operational' },
      { id: 'prop-2', address: '456 Oak Ave', archived: false, status: 'Operational' },
      { id: 'prop-3', address: '789 Pine Rd', archived: true, status: 'Operational' },
      { id: 'prop-4', address: '321 Elm St', archived: false, status: 'Soft offer' },
    ];

    const createTransaction = (
      amount: number,
      category: string,
      date: string,
      propertyId?: string,
      expenseType: string = 'Operating',
      overrideDate?: string
    ): Transaction => ({
      id: Math.random().toString(),
      date,
      amount,
      category,
      propertyId,
      expenseType,
      overrideDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    it('should aggregate transactions across multiple properties', () => {
      const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM');
      const transactions: Transaction[] = [
        createTransaction(1000, 'Rent', `${currentMonth}-01`, 'prop-1'),
        createTransaction(800, 'Rent', `${currentMonth}-01`, 'prop-2'),
        createTransaction(-200, 'Utilities', `${currentMonth}-05`, 'prop-1'),
        createTransaction(-150, 'Utilities', `${currentMonth}-05`, 'prop-2'),
      ];

      const report = generatePortfolioPLReport(transactions, properties);

      const currentMonthData = report.months.find(m => m.month === currentMonth);
      expect(currentMonthData?.totalIncome).toBe(1800);
      expect(currentMonthData?.totalExpenses).toBe(350);
      expect(currentMonthData?.netIncome).toBe(1450);
    });

    it('should exclude archived properties', () => {
      const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM');
      const transactions: Transaction[] = [
        createTransaction(1000, 'Rent', `${currentMonth}-01`, 'prop-1'),
        createTransaction(500, 'Rent', `${currentMonth}-01`, 'prop-3'), // Archived
      ];

      const report = generatePortfolioPLReport(transactions, properties);

      const currentMonthData = report.months.find(m => m.month === currentMonth);
      expect(currentMonthData?.totalIncome).toBe(1000); // Archived property excluded
    });

    it('should exclude properties in Soft Offer, Hard Offer, and Opportunity status', () => {
      const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM');
      const testProperties = [
        { id: 'prop-1', address: '123 Main St', archived: false, status: 'Operational' },
        { id: 'prop-2', address: '456 Oak Ave', archived: false, status: 'Soft offer' },
        { id: 'prop-3', address: '789 Pine Rd', archived: false, status: 'Hard offer' },
        { id: 'prop-4', address: '321 Elm St', archived: false, status: 'Opportunity' },
      ];

      const transactions: Transaction[] = [
        createTransaction(1000, 'Rent', `${currentMonth}-01`, 'prop-1'),
        createTransaction(500, 'Rent', `${currentMonth}-01`, 'prop-2'),
        createTransaction(500, 'Rent', `${currentMonth}-01`, 'prop-3'),
        createTransaction(500, 'Rent', `${currentMonth}-01`, 'prop-4'),
      ];

      const report = generatePortfolioPLReport(transactions, testProperties);

      const currentMonthData = report.months.find(m => m.month === currentMonth);
      expect(currentMonthData?.totalIncome).toBe(1000); // Only operational property
    });

    it('should calculate last full month correctly', () => {
      const lastMonth = format(subMonths(startOfMonth(new Date()), 1), 'yyyy-MM');

      const transactions: Transaction[] = [
        createTransaction(1000, 'Rent', `${lastMonth}-01`, 'prop-1'),
        createTransaction(800, 'Rent', `${lastMonth}-01`, 'prop-2'),
        createTransaction(-200, 'Utilities', `${lastMonth}-05`, 'prop-1'),
      ];

      const report = generatePortfolioPLReport(transactions, properties);

      expect(report.lastFullMonth.totalIncome).toBe(1800);
      expect(report.lastFullMonth.totalExpenses).toBe(200);
      expect(report.lastFullMonth.netIncome).toBe(1600);
    });
  });

  describe('calculateMonthlyOccupancy', () => {
    const createRent = (
      date: string,
      unit?: string,
      amount: number = 1000,
      category: string = 'Rent'
    ): Transaction => ({
      id: `trans-${Math.random()}`,
      date,
      amount,
      category,
      unit,
      propertyId: mockPropertyId,
      expenseType: 'Operating',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    it('counts untagged rent as one occupied unit', () => {
      const result = calculateMonthlyOccupancy(
        [createRent('2026-05-01')],
        1,
        ['2026-05']
      );

      expect(result).toEqual([{ month: '2026-05', occupied: 1, total: 1 }]);
    });

    it('reports zero occupied for a month with no rent', () => {
      const result = calculateMonthlyOccupancy(
        [createRent('2026-05-01')],
        1,
        ['2026-05', '2026-06']
      );

      expect(result[1]).toEqual({ month: '2026-06', occupied: 0, total: 1 });
    });

    it('counts distinct tagged units', () => {
      const result = calculateMonthlyOccupancy(
        [
          createRent('2026-05-01', '1'),
          createRent('2026-05-03', '2'),
          createRent('2026-05-04', '3')
        ],
        4,
        ['2026-05']
      );

      expect(result[0].occupied).toBe(3);
      expect(result[0].total).toBe(4);
    });

    it('counts multiple payments from the same unit once', () => {
      const result = calculateMonthlyOccupancy(
        [createRent('2026-05-01', '1', 500), createRent('2026-05-20', '1', 500)],
        2,
        ['2026-05']
      );

      expect(result[0].occupied).toBe(1);
    });

    it('treats unit labels case-insensitively', () => {
      const result = calculateMonthlyOccupancy(
        [createRent('2026-05-01', 'c'), createRent('2026-05-15', 'C')],
        2,
        ['2026-05']
      );

      expect(result[0].occupied).toBe(1);
    });

    it('adds one for untagged rent alongside tagged units, capped at total units', () => {
      const mixed = calculateMonthlyOccupancy(
        [createRent('2026-05-01', '1'), createRent('2026-05-02')],
        3,
        ['2026-05']
      );
      expect(mixed[0].occupied).toBe(2);

      const capped = calculateMonthlyOccupancy(
        [createRent('2026-05-01', '1'), createRent('2026-05-02')],
        1,
        ['2026-05']
      );
      expect(capped[0].occupied).toBe(1);
    });

    it('buckets by override date when present', () => {
      const transaction = { ...createRent('2026-06-02', '1'), overrideDate: '2026-05-31' };

      const result = calculateMonthlyOccupancy(
        [transaction],
        1,
        ['2026-05', '2026-06']
      );

      expect(result[0].occupied).toBe(1);
      expect(result[1].occupied).toBe(0);
    });

    it('ignores non-rent income and rent refunds', () => {
      const result = calculateMonthlyOccupancy(
        [
          createRent('2026-05-01', '1', 200, 'Other Income'),
          createRent('2026-05-02', '2', -500)
        ],
        2,
        ['2026-05']
      );

      expect(result[0].occupied).toBe(0);
    });
  });
});
