import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { ArrowRight, BarChart3, Shield, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const features = [
    { icon: Wallet, title: 'Expense Tracking', desc: 'Log every transaction quickly with smart categorization.' },
    { icon: BarChart3, title: 'Smart Analytics', desc: 'Beautiful charts and insights to understand your spending.' },
    { icon: TrendingUp, title: 'Budget Management', desc: 'Set budgets and track progress toward your financial goals.' },
    { icon: Shield, title: 'Secure & Private', desc: 'Your financial data stays safe and completely private.' },
  ];

  const steps = [
    { num: '01', title: 'Create Account', desc: 'Sign up in seconds with just your email.' },
    { num: '02', title: 'Add Transactions', desc: 'Record income and expenses as they happen.' },
    { num: '03', title: 'Gain Insights', desc: 'View dashboards and analytics to take control.' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="container mx-auto max-w-6xl px-4 py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            ✨ Free personal finance manager
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
            Take Control of
            <span className="text-primary"> Your Money</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Track expenses, manage budgets, and build better financial habits — all in one beautiful, simple app.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-8 text-base font-semibold">
              <Link to="/register">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/50 py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center font-display text-3xl font-bold text-foreground">Everything You Need</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
            Powerful features to help you manage your finances effectively.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(f => (
              <div key={f.title} className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center font-display text-3xl font-bold text-foreground">How It Works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map(s => (
              <div key={s.num} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {s.num}
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-primary/5 py-20">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground">Start Managing Your Finances Today</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Join thousands building better financial habits. It&apos;s free.
          </p>
          <Button asChild size="lg" className="mt-8 h-12 px-8 text-base font-semibold">
            <Link to="/register">Create Free Account <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} FinTrack. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
