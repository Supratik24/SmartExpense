const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export type Transaction = {
  id: string;
  amount: number;
  category: string;
  merchant: string;
  notes?: string;
  transactionDate: string;
  type: 'income' | 'expense';
  source: 'sms' | 'manual' | 'import';
  paymentMethod?: string;
};

export type Analytics = {
  dailyExpenses: ChartPoint[];
  weeklyExpenses: ChartPoint[];
  monthlyExpenses: ChartPoint[];
  categoryBreakdown: ChartPoint[];
  incomeVsExpense: ChartPoint[];
  topMerchants: ChartPoint[];
  averageDailySpending: number;
  averageMonthlySpending: number;
  savingsRate: number;
  mostExpensiveDay: { date: string; total: number } | null;
  nextMonthExpenseForecast: number;
};

export type ChartPoint = { label: string; value: number };

let accessToken = localStorage.getItem('accessToken') ?? '';
let refreshToken = localStorage.getItem('refreshToken') ?? '';

export function getSession() {
  return { accessToken, refreshToken };
}

export async function signup(name: string, email: string, password: string) {
  const data = await request('/auth/signup', { method: 'POST', body: { name, email, password }, auth: false });
  persistTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function login(email: string, password: string) {
  const data = await request('/auth/login', { method: 'POST', body: { email, password }, auth: false });
  persistTokens(data.accessToken, data.refreshToken);
  return data;
}

export function signOut() {
  accessToken = '';
  refreshToken = '';
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export const api = {
  analytics: () => request('/analytics'),
  transactions: () => request('/transactions'),
  createTransaction: (body: Partial<Transaction>) => request('/transactions', { method: 'POST', body }),
  importSms: (text: string) => request('/sms/import', { method: 'POST', body: { text, receivedAt: new Date().toISOString() } })
};

async function request(path: string, options: { method?: string; body?: unknown; auth?: boolean } = {}) {
  const headers: HeadersInit = { 'content-type': 'application/json' };
  if (options.auth !== false && accessToken) headers.authorization = `Bearer ${accessToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch {
    throw new Error('Cannot reach the API. Check that Docker is running and the API is available on port 4000.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message ?? 'Request failed');
  }

  if (response.status === 204) return null;
  return response.json();
}

function persistTokens(nextAccessToken: string, nextRefreshToken: string) {
  accessToken = nextAccessToken;
  refreshToken = nextRefreshToken;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}
