import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  login,
  logout,
  refresh,
  requestPasswordReset,
  resetPassword,
  signup,
  verifyEmail
} from './auth.service.js';

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

authRouter.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const body = credentialsSchema.extend({ name: z.string().min(2) }).parse(req.body);
    const result = await signup(body.name, body.email, body.password);
    res.status(201).json(result);
  })
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = credentialsSchema.parse(req.body);
    res.json(await login(body.email, body.password));
  })
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const body = z.object({ refreshToken: z.string().min(20) }).parse(req.body);
    res.json(await refresh(body.refreshToken));
  })
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const body = z.object({ refreshToken: z.string().min(20) }).parse(req.body);
    await logout(body.refreshToken);
    res.status(204).send();
  })
);

authRouter.post(
  '/verify-email',
  asyncHandler(async (req, res) => {
    const body = z.object({ token: z.string().min(20) }).parse(req.body);
    await verifyEmail(body.token);
    res.status(204).send();
  })
);

authRouter.post(
  '/password/forgot',
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email() }).parse(req.body);
    const resetToken = await requestPasswordReset(body.email);
    res.json({ message: 'If the email exists, a reset link has been generated.', resetToken });
  })
);

authRouter.post(
  '/password/reset',
  asyncHandler(async (req, res) => {
    const body = z.object({ token: z.string().min(20), password: z.string().min(8) }).parse(req.body);
    await resetPassword(body.token, body.password);
    res.status(204).send();
  })
);
