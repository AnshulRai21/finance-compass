import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { ArrowUpRight, ArrowDownRight, DollarSign, Plus, TrendingUp, BarChart3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/format';

const Dashboard = () => {
  const { user } = useAuth();
  const { getAll, getTotals } = useTransactions();

  const transactions = useMemo(() => getAll(), [getAll]);
  const { totalIncome, totalExpense, balance } = useMemo(() => getTotals(), [getTotals]);
  const recent = transactions.slice(0, 5);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const cards = [
    { label: 'Total Income', value: totalIncome, icon: ArrowUpRight, colorClass: 'text-income bg-income/10' },
    { label: 'Total Expenses', value: totalExpense, icon: ArrowDownRight, colorClass: 'text-expense bg-expense/10' },
    { label: 'Balance', value: balance, icon: DollarSign, colorClass: 'text-balance bg-balance/10' },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            {greeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s your financial overview.</p>
        </div>
        <Button asChild>
          <Link to="/add-expense"><Plus className="mr-1 h-4 w-4" /> Add Transaction</Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {cards.map(c => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-card-hover">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.colorClass}`}>
                <c.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 font-display text-2xl font-bold text-foreground animate-count-up">
              {formatCurrency(c.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          { to: '/add-expense', icon: Plus, label: 'New Transaction' },
          { to: '/expenses', icon: List, label: 'All Transactions' },
          { to: '/analytics', icon: BarChart3, label: 'Analytics' },
        ].map(a => (
          <Link key={a.to} to={a.to} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:shadow-card-hover hover:border-primary/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <a.icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Recent Transactions</h2>
          <Link to="/expenses" className="text-sm font-medium text-primary hover:underline">View All</Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <TrendingUp className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">No transactions yet</p>
            <p className="mt-1 text-sm">Add your first transaction to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recent.map(t => (
              <div key={t.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${t.type === 'income' ? 'bg-income/10' : 'bg-expense/10'}`}>
                    {t.type === 'income' ? <ArrowUpRight className="h-4 w-4 text-income" /> : <ArrowDownRight className="h-4 w-4 text-expense" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.category} · {new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
