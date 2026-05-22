import { describe, it, expect } from 'vitest';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt.js';

describe('jwt utils', () => {
  const payload = { sub: 'user-1', email: 'test@unas.edu.pe', rol: 'ADMIN' as const };

  it('firma y verifica un access token', () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.rol).toBe(payload.rol);
    expect(decoded.type).toBe('access');
  });

  it('firma y verifica un refresh token', () => {
    const token = signRefreshToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.type).toBe('refresh');
  });

  it('falla al verificar un token invalido', () => {
    expect(() => verifyAccessToken('invalid.token.here')).toThrow();
  });
});
