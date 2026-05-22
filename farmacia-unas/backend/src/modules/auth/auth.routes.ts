import { Router } from 'express';
import { authenticate, validate } from '../../middlewares/auth.js';
import { loginLimiter } from '../../middlewares/rateLimit.js';
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
} from './auth.schemas.js';
import * as service from './auth.service.js';

export const authRouter = Router();

authRouter.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const result = await service.login(req.body, req.ip);
  res.json(result);
});

authRouter.post('/refresh', validate(refreshSchema), async (req, res) => {
  res.json(await service.refresh(req.body));
});

authRouter.post('/logout', validate(refreshSchema), async (req, res) => {
  await service.logout(req.body.refreshToken);
  res.status(204).send();
});

authRouter.get('/me', authenticate, async (req, res) => {
  res.json(await service.getProfile(req.user!.sub));
});

authRouter.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  async (req, res) => {
    await service.changePassword(req.user!.sub, req.body);
    res.status(204).send();
  },
);
