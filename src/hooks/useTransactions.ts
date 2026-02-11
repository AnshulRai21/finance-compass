import { useCallback } from 'react';
import type { Transaction } from '@/types/finance';
import { useAuth } from '@/contexts/AuthContext';

const getTxns = (): Transaction[] => {
  try { return JSON.parse(localStorage.getItem('fm_transactions') || '[]'); }
  catch { return []; }
};

const saveTxns = (txns: Transaction[]) => {
  localStorage.setItem('fm_transactions', JSON.stringify(txns));
};

export const useTransactions = () => {
  const { user } = useAuth();

  const getAll = useCallback((): Transaction[] => {
    if (!user) return [];
    return getTxns()
      .filter(t => t.userId === user.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [user]);

  const add = useCallback((data: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    const txn: Transaction = {
      ...data,
      id: crypto.randomUUID(),
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    saveTxns([...getTxns(), txn]);
  }, [user]);

  const update = useCallback((id: string, data: Partial<Transaction>) => {
    if (!user) return;
    const txns = getTxns();
    const idx = txns.findIndex(t => t.id === id && t.userId === user.id);
    if (idx === -1) return;
    txns[idx] = { ...txns[idx], ...data, id, userId: user.id };
    saveTxns(txns);
  }, [user]);

  const remove = useCallback((id: string) => {
    if (!user) return;
    saveTxns(getTxns().filter(t => !(t.id === id && t.userId === user.id)));
  }, [user]);

  const getTotals = useCallback(() => {
    const all = getAll();
    const totalIncome = all.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = all.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }, [getAll]);

  return { getAll, add, update, remove, getTotals };
};
