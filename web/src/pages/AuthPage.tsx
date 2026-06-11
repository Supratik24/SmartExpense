import { type FormEvent, useState } from 'react';
import { login, signup } from '../services/api';

export function AuthPage({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('Demo User');
  const [email, setEmail] = useState('demo@smartexpense.ai');
  const [password, setPassword] = useState('Password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') await signup(name, email, password);
      else await login(email, password);
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  function useFreshEmail() {
    setMode('signup');
    setEmail(`demo.${Date.now()}@smartexpense.ai`);
  }

  return (
    <main className="auth-shell">
      <div className="auth-aura auth-aura-one" />
      <div className="auth-aura auth-aura-two" />
      <section className="auth-panel">
        <div className="brand-mark">S</div>
        <h1>SmartExpense AI</h1>
        <p>Automatic SMS transaction import, categorization, forecasting, and spending analytics.</p>
        <div className="mode-switch" role="tablist" aria-label="Authentication mode">
          <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>Login</button>
          <button className={mode === 'signup' ? 'active' : ''} type="button" onClick={() => setMode('signup')}>Signup</button>
        </div>
        <form onSubmit={submit}>
          {mode === 'signup' && <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" />}
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" />
          <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? 'Working...' : mode === 'login' ? 'Log in' : 'Create account'}</button>
        </form>
        <button className="link-button" type="button" onClick={useFreshEmail}>Use fresh test email</button>
      </section>
      <section className="auth-preview" aria-label="Product preview">
        <div className="preview-toolbar"><span /><span /><span /></div>
        <div className="preview-row strong"><span>Today</span><b>Rs. 450</b></div>
        <div className="preview-chart"><i /><i /><i /><i /><i /></div>
        <div className="preview-row"><span>SWIGGY</span><b>Food</b></div>
        <div className="preview-row"><span>UPI import</span><b>92% confidence</b></div>
      </section>
    </main>
  );
}
