export interface Transaction {
  id: string;
  date: string; // ISO 8601: "2025-09-15"
  amount: number;
  category: string;
  propertyId?: string;
  unit?: string;
  payee?: string;
  description?: string;
  overrideDate?: string;
  expenseType: string; // "Operating" or "Capital"
  createdAt: string;
  updatedAt: string;
}

export interface TransactionCreate {
  date: string;
  amount: number;
  category: string;
  propertyId?: string;
  unit?: string;
  payee?: string;
  description?: string;
  overrideDate?: string;
  expenseType?: string;
}

export interface TransactionUpdate extends TransactionCreate {}

export interface TransactionCategory {
  id: string;
  name: string;
  type: string; // "Income" or "Expense"
  defaultExpenseType?: string;
  displayOrder: number;
}
