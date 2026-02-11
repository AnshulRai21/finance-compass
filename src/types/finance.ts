export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  currency: string;
  monthlyBudget: number;
  createdAt: string;
  role: 'user' | 'admin';
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  category: string;
  date: string;
  notes: string;
  createdAt: string;
}

export const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Rent', 'Utilities', 'Entertainment',
  'Shopping', 'Healthcare', 'Education', 'Other'
] as const;

export const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Investment', 'Gift', 'Other'
] as const;
