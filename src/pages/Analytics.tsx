import { useMemo, useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const CHART_COLORS = [
  'hsl(168, 70%, 38%)', 'hsl(210, 70%, 50%)', 'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)', 'hsl(270, 60%, 55%)', 'hsl(150, 50%, 45%)',
  'hsl(30, 80%, 55%)', 'hsl(190, 60%, 45%)', 'hsl(340, 60%, 50%)',
];

const Analytics = () => {
  const { getAll } = useTransactions();
  const transactions = useMemo(() => getAll(), [getAll]);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const monthlyTxns = useMemo(() =>
    transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }), [transactions, selectedMonth, selectedYear]);

  const monthIncome = monthlyTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthlyTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthBalance = monthIncome - monthExpense;

  // Category breakdown (expenses only)
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    monthlyTxns.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [monthlyTxns]);

  // Monthly trend (last 6 months)
  const trendData = useMemo(() => {
    const months: { month: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selectedYear, selectedMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const mTxns = transactions.filter(t => {
        const td = new Date(t.date);
        return td.getMonth() === m && td.getFullYear() === y;
      });
      months.push({
        month: label,
        income: mTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: mTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      });
    }
    return months;
  }, [transactions, selectedMonth, selectedYear]);

  const incExpData = [
    { name: 'Income', value: monthIncome },
    { name: 'Expenses', value: monthExpense },
  ];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Financial Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">Understand where your money goes.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Month summary */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Month Income', value: monthIncome, icon: TrendingUp, cls: 'text-income bg-income/10' },
          { label: 'Month Expenses', value: monthExpense, icon: TrendingDown, cls: 'text-expense bg-expense/10' },
          { label: 'Month Balance', value: monthBalance, icon: DollarSign, cls: 'text-balance bg-balance/10' },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.cls}`}>
                <c.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 font-display text-xl font-bold text-foreground">{formatCurrency(c.value)}</p>
          </div>
        ))}
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center shadow-card">
          <p className="font-medium text-muted-foreground">Add transactions to see analytics.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category pie */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Spending by Category</h3>
            {categoryData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No expenses this month</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Income vs Expense bar */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={incExpData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v: number) => `$${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  <Cell fill="hsl(152, 60%, 42%)" />
                  <Cell fill="hsl(0, 72%, 51%)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trend line */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card lg:col-span-2">
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">6-Month Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v: number) => `$${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="hsl(152, 60%, 42%)" strokeWidth={2} dot={{ r: 4 }} name="Income" />
                <Line type="monotone" dataKey="expense" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 4 }} name="Expense" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
