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

export type AuthUser = {
  id: string;
  clerkId: string;
  email: string;
  name: string;
};

export type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export function setAuthTokenGetter(getter: TokenGetter | null) {
  tokenGetter = getter;
}

export async function fetchCurrentUser(getToken: TokenGetter) {
  return request('/auth/me', { getToken }) as Promise<{ user: AuthUser }>;
}

export function createApi(getToken: TokenGetter) {
  return {
    analytics: () => request('/analytics', { getToken }),
    transactions: () => request('/transactions', { getToken }),
    createTransaction: (body: Partial<Transaction>) => request('/transactions', { method: 'POST', body, getToken }),
    importSms: (text: string) =>
      request('/sms/import', {
        method: 'POST',
        body: { text, receivedAt: new Date().toISOString() },
        getToken
      })
  };
}

async function request(
  path: string,
  options: { method?: string; body?: unknown; getToken?: TokenGetter } = {}
) {
  const headers: HeadersInit = { 'content-type': 'application/json' };
  const getter = options.getToken ?? tokenGetter;

  if (getter) {
    const token = await getter();
    if (token) headers.authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch {
    throw new Error('Cannot reach the API. Start the backend on port 4000 (docker compose up api).');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(formatApiError(error, response.status), response.status);
  }

  if (response.status === 204) return null;
  return response.json();
}

function formatApiError(error: { message?: string; issues?: { path: (string | number)[]; message: string }[] }, status: number) {
  if (error.issues?.length) {
    const first = error.issues[0];
    const field = first.path.join('.') || 'input';
    return `${field}: ${first.message}`;
  }
  if (error.message) return error.message;
  if (status === 401) return 'Session expired or API rejected Clerk token. Try signing in again.';
  return 'Request failed';
}

// Back-compat for any legacy imports
export const api = {
  analytics: () => request('/analytics'),
  transactions: () => request('/transactions'),
  createTransaction: (body: Partial<Transaction>) => request('/transactions', { method: 'POST', body }),
  importSms: (text: string) => request('/sms/import', { method: 'POST', body: { text, receivedAt: new Date().toISOString() } })
};
