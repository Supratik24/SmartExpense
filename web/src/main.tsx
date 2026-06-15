import { ClerkProvider, SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import React, { useLayoutEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Dashboard } from './pages/Dashboard';
import { AuthPage } from './pages/AuthPage';
import { setAuthTokenGetter } from './services/api';
import './styles.css';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function DashboardGate() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [sessionReady, setSessionReady] = useState(false);

  useLayoutEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setAuthTokenGetter(null);
      setSessionReady(false);
      return;
    }

    setAuthTokenGetter(() => getToken({ skipCache: true }));
    let active = true;

    void getToken({ skipCache: true }).then((token) => {
      if (active) setSessionReady(Boolean(token));
    });

    return () => {
      active = false;
    };
  }, [getToken, isLoaded, isSignedIn]);

  if (!isLoaded || !sessionReady) {
    return (
      <main className="boot-shell">
        <div className="boot-card">
          <div className="brand-mark">S</div>
          <Loader2 className="spin" size={28} />
          <p>Preparing your dashboard…</p>
        </div>
      </main>
    );
  }

  return <Dashboard />;
}

function AppShell() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <main className="boot-shell">
        <div className="boot-card">
          <div className="brand-mark">S</div>
          <Loader2 className="spin" size={28} />
          <p>Loading Clerk session…</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <SignedIn>
        <DashboardGate />
      </SignedIn>
      <SignedOut>
        <AuthPage />
      </SignedOut>
    </>
  );
}

function Root() {
  if (!publishableKey) {
    return (
      <main className="boot-shell">
        <div className="boot-card">
          <div className="brand-mark">S</div>
          <p>Set VITE_CLERK_PUBLISHABLE_KEY in web/.env</p>
        </div>
      </main>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <AppShell />
    </ClerkProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
