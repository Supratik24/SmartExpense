import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../db/pool.js';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { categorizeTransaction } from '../categorization/categorization.service.js';
import { createTransaction } from '../transactions/transactions.service.js';
import { parseTransactionSms } from './parsers.js';

export const smsRouter = Router();
smsRouter.use(requireAuth);

smsRouter.post(
  '/import',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        sender: z.string().optional(),
        text: z.string().min(8),
        receivedAt: z.string().datetime().optional()
      })
      .parse(req.body);

    const parsed = parseTransactionSms(body.text, body.receivedAt);
    if (!parsed) {
      await query(
        `INSERT INTO sms_imports (user_id, sender, raw_text, parsed, error, received_at)
         VALUES ($1,$2,$3,FALSE,'No parser matched',$4)`,
        [req.user!.id, body.sender, body.text, body.receivedAt]
      );
      return res.status(422).json({ message: 'SMS did not look like a supported transaction alert' });
    }

    const category = await categorizeTransaction({
      merchant: parsed.merchant,
      rawText: body.text,
      amount: parsed.amount
    });

    const transaction = await createTransaction(req.user!.id, {
      amount: parsed.amount,
      category: category.category,
      merchant: parsed.merchant,
      transactionDate: parsed.transactionDate,
      type: parsed.type,
      source: 'sms',
      paymentMethod: parsed.paymentMethod,
      accountMask: parsed.accountMask,
      referenceNumber: parsed.referenceNumber,
      rawText: body.text,
      confidence: Math.min(parsed.confidence, category.confidence)
    });

    await query(
      `INSERT INTO sms_imports (user_id, transaction_id, sender, raw_text, parser_name, parsed, received_at)
       VALUES ($1,$2,$3,$4,$5,TRUE,$6)`,
      [req.user!.id, transaction.id, body.sender, body.text, parsed.parserName, body.receivedAt]
    );

    res.status(201).json({ transaction, parsed, category });
  })
);
