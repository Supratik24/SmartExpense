import { query } from '../../db/pool.js';

type TransactionInput = {
  amount?: number;
  category?: string;
  merchant?: string;
  notes?: string;
  transactionDate?: string;
  type?: 'income' | 'expense';
  source?: 'sms' | 'manual' | 'import';
  paymentMethod?: string;
  accountMask?: string;
  referenceNumber?: string;
  rawText?: string;
  confidence?: number;
};

type DbTransaction = {
  amount: string;
  category: string;
  merchant: string;
  notes: string | null;
  transaction_date: string;
  type: 'income' | 'expense';
  source: 'sms' | 'manual' | 'import';
  payment_method: string | null;
};

type TransactionRow = {
  id: string;
  amount: number;
  category: string;
  merchant: string;
  notes: string | null;
  transactionDate: string;
  type: 'income' | 'expense';
  source: 'sms' | 'manual' | 'import';
  paymentMethod: string | null;
  accountMask?: string | null;
  referenceNumber?: string | null;
  confidence?: number | null;
  createdAt?: string;
};

export async function listTransactions(userId: string, queryParams: Record<string, unknown>) {
  const limit = Number(queryParams.limit ?? 100);
  const result = await query<TransactionRow>(
    `SELECT id, amount::float, category, merchant, notes, transaction_date AS "transactionDate",
            type, source, payment_method AS "paymentMethod", account_mask AS "accountMask",
            reference_number AS "referenceNumber", confidence::float, created_at AS "createdAt"
     FROM transactions
     WHERE user_id = $1
     ORDER BY transaction_date DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

export async function createTransaction(userId: string, input: Required<Pick<TransactionInput, 'amount' | 'category' | 'merchant' | 'transactionDate' | 'type'>> & TransactionInput) {
  const result = await query<TransactionRow>(
    `INSERT INTO transactions
       (user_id, amount, category, merchant, notes, transaction_date, type, source, payment_method, account_mask, reference_number, raw_text, confidence)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING id, amount::float, category, merchant, notes, transaction_date AS "transactionDate",
               type, source, payment_method AS "paymentMethod", account_mask AS "accountMask",
               reference_number AS "referenceNumber", confidence::float`,
    [
      userId,
      input.amount,
      input.category,
      input.merchant,
      input.notes,
      input.transactionDate,
      input.type,
      input.source ?? 'manual',
      input.paymentMethod,
      input.accountMask,
      input.referenceNumber,
      input.rawText,
      input.confidence
    ]
  );
  return result.rows[0];
}

export async function updateTransaction(userId: string, id: string, input: TransactionInput) {
  const current = await query<DbTransaction>('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!current.rows[0]) throw Object.assign(new Error('Transaction not found'), { status: 404 });

  const next = { ...current.rows[0], ...toDb(input) };
  const result = await query(
    `UPDATE transactions
     SET amount=$1, category=$2, merchant=$3, notes=$4, transaction_date=$5, type=$6,
         source=$7, payment_method=$8, updated_at=NOW()
     WHERE id=$9 AND user_id=$10
     RETURNING id, amount::float, category, merchant, notes, transaction_date AS "transactionDate",
               type, source, payment_method AS "paymentMethod"`,
    [
      next.amount,
      next.category,
      next.merchant,
      next.notes,
      next.transaction_date,
      next.type,
      next.source,
      next.payment_method,
      id,
      userId
    ]
  );
  return result.rows[0];
}

export async function deleteTransaction(userId: string, id: string) {
  await query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
}

function toDb(input: TransactionInput) {
  return {
    amount: input.amount,
    category: input.category,
    merchant: input.merchant,
    notes: input.notes,
    transaction_date: input.transactionDate,
    type: input.type,
    source: input.source,
    payment_method: input.paymentMethod
  };
}
