import { getAuth } from '@clerk/express';
import type { NextFunction, Request, Response } from 'express';
import { ensureDbUser } from '../modules/auth/users.service.js';

export type AuthUser = {
  id: string;
  clerkId: string;
  email: string;
  name: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: 'Missing or invalid Clerk session' });
    }

    const dbUser = await ensureDbUser(userId);
    req.user = {
      id: dbUser.id,
      clerkId: userId,
      email: dbUser.email,
      name: dbUser.name
    };
    return next();
  } catch (error) {
    return next(error);
  }
}
