import { describe, it, expect } from 'vitest';
import {
  getPasswordStrength,
  isValidEmail,
  isValidBirthYear,
  isValidBirthDate,
} from '../validation';

describe('Password Strength Validation', () => {
  it('returns "매우 약함" for passwords with 1 or fewer requirements met', () => {
    const result = getPasswordStrength('abc');
    expect(result.label).toBe('매우 약함');
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.color).toBe('bg-red-500');
  });

  it('returns "약함" for passwords with 2 requirements met', () => {
    const result = getPasswordStrength('abcdef');
    expect(result.label).toBe('약함');
    expect(result.score).toBe(2);
    expect(result.color).toBe('bg-orange-500');
  });

  it('returns "보통" for passwords with 3 requirements met', () => {
    const result = getPasswordStrength('Abcdef1');
    expect(result.label).toBe('보통');
    expect(result.score).toBe(3);
    expect(result.color).toBe('bg-yellow-500');
  });

  it('returns "강함" for passwords with 4 requirements met', () => {
    const result = getPasswordStrength('Abcdef12');
    expect(result.label).toBe('강함');
    expect(result.score).toBe(4);
    expect(result.color).toBe('bg-green-500');
  });

  it('returns "매우 강함" for passwords with all 5 requirements met', () => {
    const result = getPasswordStrength('Abcdef12!');
    expect(result.label).toBe('매우 강함');
    expect(result.score).toBe(5);
    expect(result.color).toBe('bg-emerald-500');
  });

  it('provides detailed requirements breakdown', () => {
    const result = getPasswordStrength('Abc1!');

    expect(result.requirements).toHaveLength(5);
    expect(result.requirements[0].met).toBe(false); // < 6 chars
    expect(result.requirements[1].met).toBe(false); // < 8 chars
    expect(result.requirements[2].met).toBe(true);  // has uppercase
    expect(result.requirements[3].met).toBe(true);  // has number
    expect(result.requirements[4].met).toBe(true);  // has special char
  });
});

describe('Email Validation', () => {
  it('validates correct email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@example.co.kr')).toBe(true);
    expect(isValidEmail('user+tag@example.com')).toBe(true);
    expect(isValidEmail('user_name@sub.example.com')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('invalid@')).toBe(false);
    expect(isValidEmail('invalid@domain')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('user @example.com')).toBe(false);
  });
});

describe('Birth Year Validation', () => {
  const currentYear = new Date().getFullYear();

  it('validates years within valid range', () => {
    expect(isValidBirthYear(1900)).toBe(true);
    expect(isValidBirthYear(1990)).toBe(true);
    expect(isValidBirthYear(2000)).toBe(true);
    expect(isValidBirthYear(currentYear)).toBe(true);
  });

  it('rejects years outside valid range', () => {
    expect(isValidBirthYear(1899)).toBe(false);
    expect(isValidBirthYear(currentYear + 1)).toBe(false);
    expect(isValidBirthYear(3000)).toBe(false);
  });
});

describe('Birth Date Validation', () => {
  it('validates correct date strings', () => {
    expect(isValidBirthDate('1990-01-01')).toBe(true);
    expect(isValidBirthDate('2000-12-31')).toBe(true);
    expect(isValidBirthDate('1950-06-15')).toBe(true);
  });

  it('rejects invalid date strings', () => {
    expect(isValidBirthDate('')).toBe(false);
    expect(isValidBirthDate('invalid')).toBe(false);
    expect(isValidBirthDate('2024-13-01')).toBe(false); // Invalid month
  });

  it('rejects dates in the future', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateString = futureDate.toISOString().split('T')[0];

    expect(isValidBirthDate(futureDateString)).toBe(false);
  });

  it('rejects dates before 1900', () => {
    expect(isValidBirthDate('1899-12-31')).toBe(false);
    expect(isValidBirthDate('1800-01-01')).toBe(false);
  });
});
