import { useAuth, useUser, UserButton } from '@clerk/clerk-react';
import { Loader2, MessageSquareText, PieChart, Plus, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  CategoryPie,
  DEMO_CATEGORY,
  DEMO_INCOME_EXPENSE,
  DEMO_LINE,
  DEMO_MERCHANTS,
  ExpenseLine,
  IncomeExpenseBar,
  MerchantsBar
} from '../components/Charts';
import type { ChartPoint } from '../services/api';
import { Analytics, ApiError, Transaction, createApi } from '../services/api';

export function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const api = useMemo(() => createApi(() => getToken({ skipCache: true })), [getToken]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sms, setSms] = useState('Rs.450 debited from A/c XXXX1234 at SWIGGY');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [importing, setImporting] = useState(false);

  async function load(options: { silent?: boolean } = {}) {
    if (!options.silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const [analyticsData, transactionData] = await Promise.all([api.analytics(), api.transactions()]);
      setAnalytics(analyticsData);
      setTransactions(transactionData);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('API could not verify your Clerk session. Make sure the backend is running with CLERK_SECRET_KEY.');
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function importSms() {
    setError('');
    setImporting(true);
    try {
      await api.importSms(sms);
      await load({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SMS import failed');
    } finally {
      setImporting(false);
    }
  }

  async function seedTransaction() {
    setError('');
    try {
      await api.createTransaction({
        amount: 1200,
        merchant: 'AMAZON',
        transactionDate: new Date().toISOString(),
        type: 'expense',
        source: 'manual',
        paymentMethod: 'Card'
      });
      await load({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add transaction');
    }
  }

  const totalExpense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <main className={`app-shell lilac-theme ${loading ? 'app-shell-loading' : 'app-shell-ready'}`}>
      <header className="topbar fade-in">
        <div className="topbar-brand">
          <div className="topbar-icon"><PieChart size={20} /></div>
          <div>
            <h1>Statistics</h1>
            <p>
              {user?.primaryEmailAddress?.emailAddress ?? user?.fullName ?? 'Soft expense analytics'}
              {' · SmartExpense AI'}
            </p>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="icon-btn" title="Refresh" onClick={() => load({ silent: true })} disabled={refreshing}>
            <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
          </button>
          <button className="icon-btn" title="Add sample transaction" onClick={seedTransaction} disabled={loading}>
            <Plus size={18} />
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {error && <div className="error shake">{error}</div>}

      {loading && (
        <section className="loading-grid" aria-live="polite">
          <div className="skeleton metric" />
          <div className="skeleton metric" />
          <div className="skeleton metric" />
          <div className="skeleton metric" />
          <div className="skeleton panel wide" />
          <div className="skeleton panel wide" />
        </section>
      )}

      {!loading && analytics && (
        <>
          <section className="metrics-grid">
            <Metric label="Monthly avg" value={money(analytics.averageMonthlySpending)} delay={0} />
            <Metric label="Daily avg" value={money(analytics.averageDailySpending)} delay={1} />
            <Metric
              label="Savings rate"
              value={`${Math.round(clampPercent(analytics.savingsRate) * 100)}%`}
              delay={2}
            />
            <Metric label="Forecast" value={money(analytics.nextMonthExpenseForecast)} delay={3} />
            <Metric label="Total spent" value={money(totalExpense)} delay={4} tone="expense" />
            <Metric
              label="Peak spend day"
              value={
                analytics.mostExpensiveDay
                  ? `${formatDate(analytics.mostExpensiveDay.date)} · ${money(analytics.mostExpensiveDay.total)}`
                  : '—'
              }
              delay={5}
            />
            <Metric label="Total income" value={money(totalIncome)} delay={6} tone="income" />
            <Metric
              label="Net balance"
              value={money(totalIncome - totalExpense)}
              delay={7}
              tone={totalIncome - totalExpense >= 0 ? 'income' : 'expense'}
            />
          </section>

          <section className="sms-import fade-in">
            <MessageSquareText size={20} />
            <input
              value={sms}
              onChange={(event) => setSms(event.target.value)}
              placeholder="Paste bank SMS to import a transaction"
              disabled={importing}
            />
            <button onClick={importSms} disabled={importing || !sms.trim()}>
              {importing ? (
                <>
                  <Loader2 className="spin" size={16} />
                  Importing…
                </>
              ) : (
                'Import SMS'
              )}
            </button>
          </section>

          <section className="dashboard-grid">
            <ChartPanel
              title="Category Breakdown"
              data={analytics.categoryBreakdown}
              demoData={DEMO_CATEGORY}
              delay={0}
              featured
              render={(data, live) => <CategoryPie data={data} demo={!live} />}
            />
            <ChartPanel
              title="Top Merchants"
              data={analytics.topMerchants}
              demoData={DEMO_MERCHANTS}
              delay={1}
              render={(data, live) => <MerchantsBar data={data} demo={!live} />}
            />
            <ChartPanel
              title="Income vs Expense"
              data={analytics.incomeVsExpense}
              demoData={DEMO_INCOME_EXPENSE}
              delay={2}
              render={(data, live) => <IncomeExpenseBar data={data} demo={!live} />}
            />
            <ChartPanel
              title="Monthly Expenses"
              data={analytics.monthlyExpenses}
              demoData={DEMO_LINE}
              delay={3}
              render={(data, live) => <ExpenseLine data={data} variant="monthly" demo={!live} />}
            />
            <ChartPanel
              title="Daily Expenses"
              data={analytics.dailyExpenses}
              demoData={DEMO_LINE}
              delay={4}
              render={(data, live) => <ExpenseLine data={data} variant="daily" demo={!live} />}
            />
            <ChartPanel
              title="Weekly Trend"
              data={analytics.weeklyExpenses}
              demoData={DEMO_LINE}
              delay={5}
              render={(data, live) => <ExpenseLine data={data} variant="daily" demo={!live} />}
            />
          </section>
        </>
      )}

      <section className="table-section fade-in">
        <h2>Transactions <span className="count-pill">{transactions.length}</span></h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Merchant</th>
                <th>Category</th>
                <th>Type</th>
                <th>Source</th>
                <th className="amount-col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => (
                <tr key={tx.id} className="table-row" style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}>
                  <td>{formatDate(tx.transactionDate)}</td>
                  <td>{tx.merchant}</td>
                  <td><span className="category-chip">{tx.category}</span></td>
                  <td><span className={`type-chip type-${tx.type}`}>{tx.type}</span></td>
                  <td>{tx.source}</td>
                  <td className={`amount-col amount-${tx.type}`}>
                    {tx.type === 'expense' ? '−' : '+'}
                    {money(tx.amount)}
                  </td>
                </tr>
              ))}
              {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    Import an SMS or add the sample transaction to see analytics.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  delay,
  tone
}: {
  label: string;
  value: string;
  delay: number;
  tone?: 'income' | 'expense';
}) {
  return (
    <div className={`metric stagger-in metric-${tone ?? 'neutral'}`} style={{ animationDelay: `${delay * 70}ms` }}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ChartPanel({
  title,
  data,
  demoData,
  delay,
  featured,
  render
}: {
  title: string;
  data: ChartPoint[];
  demoData: ChartPoint[];
  delay: number;
  featured?: boolean;
  render: (data: ChartPoint[], live: boolean) => ReactNode;
}) {
  const live = data.length > 0;
  return (
    <section
      className={`panel stagger-in${featured ? ' panel-featured' : ''}`}
      style={{ animationDelay: `${delay * 90}ms` }}
    >
      <div className="panel-head">
        <h2>{title}</h2>
        {!live && <span className="demo-pill">Preview</span>}
      </div>
      <div className={live ? 'chart-live' : 'chart-demo-mode'}>
        {render(live ? data : demoData, live)}
      </div>
    </section>
  );
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}
