import { query } from '../../db/pool.js';

export async function getAnalytics(userId: string) {
  const [
    daily,
    weekly,
    monthly,
    categoryBreakdown,
    incomeExpense,
    topMerchants,
    averages,
    expensiveDay,
    forecast
  ] = await Promise.all([
    query(`SELECT date_trunc('day', transaction_date)::date AS label, SUM(amount)::float AS value FROM transactions WHERE user_id=$1 AND type='expense' GROUP BY 1 ORDER BY 1`, [userId]),
    query(`SELECT date_trunc('week', transaction_date)::date AS label, SUM(amount)::float AS value FROM transactions WHERE user_id=$1 AND type='expense' GROUP BY 1 ORDER BY 1`, [userId]),
    query(`SELECT date_trunc('month', transaction_date)::date AS label, SUM(amount)::float AS value FROM transactions WHERE user_id=$1 AND type='expense' GROUP BY 1 ORDER BY 1`, [userId]),
    query(`SELECT category AS label, SUM(amount)::float AS value FROM transactions WHERE user_id=$1 AND type='expense' GROUP BY category ORDER BY value DESC`, [userId]),
    query(`SELECT type AS label, SUM(amount)::float AS value FROM transactions WHERE user_id=$1 GROUP BY type`, [userId]),
    query(`SELECT merchant AS label, SUM(amount)::float AS value FROM transactions WHERE user_id=$1 AND type='expense' GROUP BY merchant ORDER BY value DESC LIMIT 8`, [userId]),
    query<{ averageDailySpending: number; averageMonthlySpending: number; savingsRate: number }>(
      `SELECT
        COALESCE(SUM(amount) FILTER (WHERE type='expense') / NULLIF(COUNT(DISTINCT transaction_date::date),0), 0)::float AS "averageDailySpending",
        COALESCE(SUM(amount) FILTER (WHERE type='expense') / NULLIF(COUNT(DISTINCT date_trunc('month', transaction_date)),0), 0)::float AS "averageMonthlySpending",
        COALESCE((SUM(amount) FILTER (WHERE type='income') - SUM(amount) FILTER (WHERE type='expense')) / NULLIF(SUM(amount) FILTER (WHERE type='income'),0), 0)::float AS "savingsRate"
       FROM transactions WHERE user_id=$1`,
      [userId]
    ),
    query<{ date: string; total: number }>(
      `SELECT transaction_date::date AS date, SUM(amount)::float AS total
       FROM transactions WHERE user_id=$1 AND type='expense'
       GROUP BY 1 ORDER BY total DESC LIMIT 1`,
      [userId]
    ),
    query<{ nextMonthExpenseForecast: number }>(
      `WITH monthly AS (
        SELECT date_trunc('month', transaction_date)::date AS month, SUM(amount)::float AS total
        FROM transactions WHERE user_id=$1 AND type='expense'
        GROUP BY 1 ORDER BY 1 DESC LIMIT 3
      )
      SELECT COALESCE(AVG(total),0)::float AS "nextMonthExpenseForecast" FROM monthly`,
      [userId]
    )
  ]);

  return {
    dailyExpenses: daily.rows,
    weeklyExpenses: weekly.rows,
    monthlyExpenses: monthly.rows,
    categoryBreakdown: categoryBreakdown.rows,
    incomeVsExpense: incomeExpense.rows,
    topMerchants: topMerchants.rows,
    ...averages.rows[0],
    mostExpensiveDay: expensiveDay.rows[0] ?? null,
    ...forecast.rows[0]
  };
}
