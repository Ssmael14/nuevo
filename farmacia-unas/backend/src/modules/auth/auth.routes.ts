import { Router } from 'express';
import { authenticate, validate } from '../../middlewares/auth.js';
import { loginSchema } from './auth.schemas.js';
import * as service from './auth.service.js';

export const authRouter = Router();

authRouter.post('/login', validate(loginSchema), async (req, res) => {
  const result = await service.login(req.body);
  res.json(result);
});

authRouter.get('/me', authenticate, async (req, res) => {
  const profile = await service.getProfile(req.user!.sub);
  res.json(profile);
});
