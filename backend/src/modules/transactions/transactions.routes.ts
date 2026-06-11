import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { categorizeTransaction } from '../categorization/categorization.service.js';
import { createTransaction, deleteTransaction, listTransactions, updateTransaction } from './transactions.service.js';

export const transactionsRouter = Router();
transactionsRouter.use(requireAuth);

const transactionSchema = z.object({
  amount: z.number().positive(),
  category: z.string().optional(),
  merchant: z.string().min(1),
  notes: z.string().optional(),
  transactionDate: z.string().datetime(),
  type: z.enum(['income', 'expense']),
  source: z.enum(['sms', 'manual', 'import']).default('manual'),
  paymentMethod: z.string().optional(),
  accountMask: z.string().optional(),
  referenceNumber: z.string().optional(),
  rawText: z.string().optional()
});

transactionsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await listTransactions(req.user!.id, req.query));
  })
);

transactionsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = transactionSchema.parse(req.body);
    const category =
      body.category ?? (await categorizeTransaction({ merchant: body.merchant, rawText: body.rawText, amount: body.amount })).category;
    res.status(201).json(await createTransaction(req.user!.id, { ...body, category }));
  })
);

transactionsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = transactionSchema.partial().parse(req.body);
    res.json(await updateTransaction(req.user!.id, req.params.id, body));
  })
);

transactionsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteTransaction(req.user!.id, req.params.id);
    res.status(204).send();
  })
);
