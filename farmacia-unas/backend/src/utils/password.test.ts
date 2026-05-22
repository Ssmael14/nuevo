import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from './password.js';

describe('password utils', () => {
  it('hashea y compara correctamente', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).not.toBe('secret123');
    expect(await comparePassword('secret123', hash)).toBe(true);
    expect(await comparePassword('wrong', hash)).toBe(false);
  });
});
