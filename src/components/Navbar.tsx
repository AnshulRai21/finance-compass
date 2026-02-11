import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, Wallet, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const authLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/add-expense', label: 'Add Transaction' },
    { to: '/expenses', label: 'Transactions' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/profile', label: 'Profile' },
  ];

  const guestLinks = [
    { to: '/login', label: 'Login' },
    { to: '/register', label: 'Get Started' },
  ];

  const links = isAuthenticated ? authLinks : guestLinks;
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Wallet className="h-4 w-4 text-primary-foreground" />
          </div>
          FinTrack
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(l.to) 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {l.label}
            </Link>
          ))}
          {isAuthenticated && (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="ml-2 text-muted-foreground hover:text-destructive">
              <LogOut className="mr-1 h-4 w-4" />
              Logout
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-card md:hidden animate-fade-in">
          <div className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(l.to) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {l.label}
              </Link>
            ))}
            {isAuthenticated && (
              <button onClick={handleLogout} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10">
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
