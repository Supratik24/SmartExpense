import { env } from '../../config/env.js';
import { query } from '../../db/pool.js';

const fallbackRules: Record<string, string> = {
  SWIGGY: 'Food',
  ZOMATO: 'Food',
  UBER: 'Travel',
  OLA: 'Travel',
  AMAZON: 'Shopping',
  FLIPKART: 'Shopping',
  NETFLIX: 'Entertainment',
  APOLLO: 'Health'
};

export async function categorizeTransaction(input: {
  merchant: string;
  rawText?: string;
  amount: number;
}) {
  const merchant = input.merchant.toUpperCase();
  const rules = await query<{ merchant_pattern: string; category: string }>(
    'SELECT merchant_pattern, category FROM category_rules ORDER BY priority ASC'
  );

  for (const rule of rules.rows) {
    if (merchant.includes(rule.merchant_pattern.toUpperCase())) {
      return { category: rule.category, method: 'rule', confidence: 0.98 };
    }
  }

  for (const [needle, category] of Object.entries(fallbackRules)) {
    if (merchant.includes(needle)) return { category, method: 'rule', confidence: 0.95 };
  }

  try {
    const response = await fetch(`${env.ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (response.ok) {
      const data = (await response.json()) as { category: string; confidence: number };
      return { category: data.category, method: 'ml', confidence: data.confidence };
    }
  } catch {
    // The API remains useful when the ML service is unavailable.
  }

  return { category: 'Others', method: 'fallback', confidence: 0.5 };
}
