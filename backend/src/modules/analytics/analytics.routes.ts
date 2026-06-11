import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getAnalytics } from './analytics.service.js';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

analyticsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await getAnalytics(req.user!.id));
  })
);
