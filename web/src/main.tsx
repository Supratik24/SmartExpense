import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Dashboard } from './pages/Dashboard';
import { AuthPage } from './pages/AuthPage';
import { getSession } from './services/api';
import './styles.css';

function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(getSession().accessToken));
  return authenticated ? (
    <Dashboard onSignOut={() => setAuthenticated(false)} />
  ) : (
    <AuthPage onAuthenticated={() => setAuthenticated(true)} />
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
