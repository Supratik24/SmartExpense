import { LogOut, MessageSquareText, Plus, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { CategoryPie, ExpenseLine, MerchantsBar } from '../components/Charts';
import { Analytics, Transaction, api, signOut } from '../services/api';

export function Dashboard({ onSignOut }: { onSignOut: () => void }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sms, setSms] = useState('Rs.450 debited from A/c XXXX1234 at SWIGGY');
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const [analyticsData, transactionData] = await Promise.all([api.analytics(), api.transactions()]);
      setAnalytics(analyticsData);
      setTransactions(transactionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function importSms() {
    setError('');
    try {
      await api.importSms(sms);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SMS import failed');
    }
  }

  async function seedTransaction() {
    await api.createTransaction({
      amount: 1200,
      merchant: 'AMAZON',
      transactionDate: new Date().toISOString(),
      type: 'expense',
      source: 'manual',
      paymentMethod: 'Card'
    });
    await load();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>SmartExpense AI</h1>
          <p>Spend monitoring and SMS-import analytics</p>
        </div>
        <div className="topbar-actions">
          <button title="Refresh" onClick={load}><RefreshCw size={18} /></button>
          <button title="Add sample transaction" onClick={seedTransaction}><Plus size={18} /></button>
          <button title="Sign out" onClick={() => { signOut(); onSignOut(); }}><LogOut size={18} /></button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      {analytics && (
        <>
          <section className="metrics-grid">
            <Metric label="Monthly avg" value={money(analytics.averageMonthlySpending)} />
            <Metric label="Daily avg" value={money(analytics.averageDailySpending)} />
            <Metric label="Savings rate" value={`${Math.round((analytics.savingsRate ?? 0) * 100)}%`} />
            <Metric label="Forecast" value={money(analytics.nextMonthExpenseForecast)} />
          </section>

          <section className="sms-import">
            <MessageSquareText size={20} />
            <input value={sms} onChange={(event) => setSms(event.target.value)} />
            <button onClick={importSms}>Import SMS</button>
          </section>

          <section className="dashboard-grid">
            <Panel title="Monthly Expenses"><EmptyAware data={analytics.monthlyExpenses}><ExpenseLine data={analytics.monthlyExpenses} /></EmptyAware></Panel>
            <Panel title="Category Breakdown"><EmptyAware data={analytics.categoryBreakdown}><CategoryPie data={analytics.categoryBreakdown} /></EmptyAware></Panel>
            <Panel title="Top Merchants"><EmptyAware data={analytics.topMerchants}><MerchantsBar data={analytics.topMerchants} /></EmptyAware></Panel>
            <Panel title="Daily Expenses"><EmptyAware data={analytics.dailyExpenses}><ExpenseLine data={analytics.dailyExpenses} /></EmptyAware></Panel>
          </section>
        </>
      )}

      <section className="table-section">
        <h2>Transactions</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Merchant</th><th>Category</th><th>Type</th><th>Source</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{new Date(tx.transactionDate).toLocaleDateString()}</td>
                  <td>{tx.merchant}</td>
                  <td>{tx.category}</td>
                  <td>{tx.type}</td>
                  <td>{tx.source}</td>
                  <td>{money(tx.amount)}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-cell">Import an SMS or add the sample transaction to see analytics.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="panel"><h2>{title}</h2>{children}</section>;
}

function EmptyAware({ data, children }: { data: { value: number }[]; children: ReactNode }) {
  return data.length ? children : <div className="empty-chart">No data yet</div>;
}

function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}
