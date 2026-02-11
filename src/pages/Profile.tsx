import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Lock, BarChart3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const Profile = () => {
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();
  const { getAll, getTotals } = useTransactions();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const transactions = useMemo(() => getAll(), [getAll]);
  const { totalIncome, totalExpense, balance } = useMemo(() => getTotals(), [getTotals]);

  const handleProfileSave = () => {
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    updateProfile({ name: name.trim(), currency });
    toast.success('Profile updated');
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    if (!currentPass || !newPass || !confirmPass) { setPassError('All fields required'); return; }
    if (newPass.length < 6) { setPassError('New password must be at least 6 characters'); return; }
    if (newPass !== confirmPass) { setPassError('Passwords do not match'); return; }
    const result = changePassword(currentPass, newPass);
    if (result.success) {
      toast.success('Password changed');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } else {
      setPassError(result.error || 'Failed');
    }
  };

  const handleDelete = () => {
    deleteAccount();
    navigate('/');
    toast.success('Account deleted');
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 animate-fade-in">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Profile</h1>

      {/* Info header */}
      <div className="mb-6 flex items-center gap-4 rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <User className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">{user?.name}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <p className="text-xs text-muted-foreground">Joined {new Date(user?.createdAt || '').toLocaleDateString()}</p>
        </div>
      </div>

      {/* Edit profile */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-foreground">
          <User className="h-4 w-4" /> Account Information
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled className="opacity-60" />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
          <Button onClick={handleProfileSave}>Save Changes</Button>
        </div>
      </div>

      {/* Change password */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-foreground">
          <Lock className="h-4 w-4" /> Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {passError && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{passError}</div>}
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
          </div>
          <Button type="submit" variant="outline">Update Password</Button>
        </form>
      </div>

      {/* Account summary */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-foreground">
          <BarChart3 className="h-4 w-4" /> Account Summary
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Transactions', value: transactions.length.toString() },
            { label: 'Income', value: formatCurrency(totalIncome) },
            { label: 'Expenses', value: formatCurrency(totalExpense) },
            { label: 'Balance', value: formatCurrency(balance) },
          ].map(s => (
            <div key={s.label} className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Danger */}
      <div className="rounded-xl border border-destructive/30 bg-card p-6 shadow-card">
        <h3 className="mb-2 flex items-center gap-2 font-display text-base font-semibold text-destructive">
          <Trash2 className="h-4 w-4" /> Danger Zone
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">Permanently delete your account and all data.</p>
        <Button variant="destructive" onClick={() => setShowDelete(true)}>Delete Account</Button>
      </div>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Account</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete your account and all transactions. This cannot be undone.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>Delete Forever</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
