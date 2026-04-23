import { describe, expect, it } from 'vitest';

import { PASSWORD_MAX_LENGTH } from '../db/field-lengths.js';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_STRENGTH,
  getPasswordStrength,
  isPasswordValid,
  validatePassword,
} from './password.js';

const messages = {
  required: 'Password is required.',
  minLength: (min: number) => `Password must be at least ${min} characters.`,
  maxLength: (max: number) => `Password must be at most ${max} characters.`,
  requirements: 'Password must include more character variety.',
};

describe('password helpers', () => {
  it('getPasswordStrength returns 0 when below min length', () => {
    expect(getPasswordStrength('Aa1!')).toBe(0);
  });

  it('getPasswordStrength counts character sets up to 4', () => {
    expect(getPasswordStrength('abcdefgh')).toBe(1);
    expect(getPasswordStrength('abcdefgh1')).toBe(2);
    expect(getPasswordStrength('Abcdefgh1')).toBe(3);
    expect(getPasswordStrength('Abcdefgh1!')).toBe(4);
  });

  it('validatePassword returns required message for empty password', () => {
    expect(validatePassword('', messages)).toEqual({
      valid: false,
      message: messages.required,
    });
  });

  it('validatePassword enforces min length and max length', () => {
    expect(validatePassword('A1!aaaa', messages)).toEqual({
      valid: false,
      message: messages.minLength(PASSWORD_MIN_LENGTH),
    });

    const tooLong = 'A'.repeat(PASSWORD_MAX_LENGTH + 1);
    expect(validatePassword(tooLong, messages)).toEqual({
      valid: false,
      message: messages.maxLength(PASSWORD_MAX_LENGTH),
    });
  });

  it('validatePassword enforces strength threshold', () => {
    const lowStrengthPassword = 'abcdefgh';
    expect(getPasswordStrength(lowStrengthPassword)).toBeLessThan(PASSWORD_MIN_STRENGTH);
    expect(validatePassword(lowStrengthPassword, messages)).toEqual({
      valid: false,
      message: messages.requirements,
    });
  });

  it('validatePassword returns valid true for acceptable password', () => {
    expect(validatePassword('ValidPass123!', messages)).toEqual({ valid: true });
  });

  it('isPasswordValid matches validation behavior for key branches', () => {
    expect(isPasswordValid('')).toBe(false);
    expect(isPasswordValid('short1!')).toBe(false);
    expect(isPasswordValid('abcdefgh')).toBe(false);
    expect(isPasswordValid('ValidPass123!')).toBe(true);
  });
});
