import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTransactions } from '@/hooks/useTransactions';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, Transaction } from '@/types/finance';
import { ArrowUpRight, ArrowDownRight, Plus, Search, Trash2, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/format';

const ExpenseList = () => {
  const { getAll, update, remove } = useTransactions();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [editTxn, setEditTxn] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [, setRefresh] = useState(0);

  const transactions = useMemo(() => {
    let list = getAll();
    if (filterType !== 'all') list = list.filter(t => t.type === filterType);
    if (filterCat !== 'all') list = list.filter(t => t.category === filterCat);
    if (search.trim()) list = list.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [getAll, filterType, filterCat, search]);

  const allCategories = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];

  const handleDelete = () => {
    if (deleteId) {
      remove(deleteId);
      setDeleteId(null);
      setRefresh(v => v + 1);
      toast.success('Transaction deleted');
    }
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTxn) return;
    update(editTxn.id, {
      title: editTxn.title,
      amount: editTxn.amount,
      category: editTxn.category,
      type: editTxn.type,
      date: editTxn.date,
      notes: editTxn.notes,
    });
    setEditTxn(null);
    setRefresh(v => v + 1);
    toast.success('Transaction updated');
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">All Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</p>
        </div>
        <Button asChild>
          <Link to="/add-expense"><Plus className="mr-1 h-4 w-4" /> Add New</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search transactions..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="rounded-xl border border-border bg-card shadow-card">
        {transactions.length === 0 ? (
          <div className="px-6 py-16 text-center text-muted-foreground">
            <p className="font-medium">No transactions found</p>
            <p className="mt-1 text-sm">Try adjusting your filters or add a new transaction.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-muted/50 sm:px-6">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t.type === 'income' ? 'bg-income/10' : 'bg-expense/10'}`}>
                    {t.type === 'income' ? <ArrowUpRight className="h-4 w-4 text-income" /> : <ArrowDownRight className="h-4 w-4 text-expense" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.category} · {new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                  <button onClick={() => setEditTxn({ ...t })} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteId(t.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Transaction</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure? This action cannot be undone.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTxn} onOpenChange={() => setEditTxn(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Transaction</DialogTitle></DialogHeader>
          {editTxn && (
            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editTxn.title} onChange={e => setEditTxn({ ...editTxn, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" step="0.01" value={editTxn.amount} onChange={e => setEditTxn({ ...editTxn, amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={editTxn.type} onValueChange={(v: 'income' | 'expense') => setEditTxn({ ...editTxn, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={editTxn.category} onValueChange={v => setEditTxn({ ...editTxn, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={editTxn.date} onChange={e => setEditTxn({ ...editTxn, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea rows={2} value={editTxn.notes} onChange={e => setEditTxn({ ...editTxn, notes: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditTxn(null)}>Cancel</Button>
                <Button type="submit" className="flex-1">Save Changes</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseList;
