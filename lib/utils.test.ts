import { describe, it, expect } from 'vitest';
import { formatNumber, isShortVideo, getDayName, truncateTitle, getToday, daysAgo } from './utils';

describe('formatNumber', () => {
  it('formats numbers under 1K as-is', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(999)).toBe('999');
  });

  it('formats thousands with K', () => {
    expect(formatNumber(1000)).toBe('1K');
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(999999)).toBe('1000K');
  });

  it('formats millions with M', () => {
    expect(formatNumber(1_000_000)).toBe('1M');
    expect(formatNumber(2_500_000)).toBe('2.5M');
  });

  it('formats billions with B', () => {
    expect(formatNumber(1_000_000_000)).toBe('1B');
  });

  it('accepts string input', () => {
    expect(formatNumber('5000')).toBe('5K');
  });

  it('handles invalid input', () => {
    expect(formatNumber('abc')).toBe('0');
  });

  it('trims trailing .0', () => {
    expect(formatNumber(2_000_000)).toBe('2M');
    expect(formatNumber(3_000)).toBe('3K');
  });
});

describe('isShortVideo', () => {
  it('returns true for videos under 60 seconds', () => {
    expect(isShortVideo('PT55S', 'some video')).toBe(true);
  });

  it('returns true for exactly 180 seconds', () => {
    expect(isShortVideo('PT3M', 'some video')).toBe(true);
  });

  it('returns false for videos over 180 seconds', () => {
    expect(isShortVideo('PT3M1S', 'normal video')).toBe(false);
  });

  it('returns true if title contains #shorts regardless of duration', () => {
    expect(isShortVideo('PT10M', 'my video #shorts')).toBe(true);
    expect(isShortVideo('PT10M', 'MY VIDEO #SHORTS')).toBe(true);
  });

  it('returns false for long videos without #shorts', () => {
    expect(isShortVideo('PT30M', 'long video')).toBe(false);
    expect(isShortVideo('PT1H', 'hour long stream')).toBe(false);
  });

  it('handles hours in duration', () => {
    expect(isShortVideo('PT1H30M', 'video')).toBe(false);
  });

  it('returns false for malformed duration', () => {
    expect(isShortVideo('', 'video')).toBe(false);
    expect(isShortVideo('invalid', 'video')).toBe(false);
  });
});

describe('getDayName', () => {
  it('returns a valid day name', () => {
    const validDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Use a full ISO timestamp so Date parsing is unambiguous across timezones
    expect(validDays).toContain(getDayName('2024-01-01T12:00:00.000Z'));
  });

  it('returns different days for different dates', () => {
    const day1 = getDayName('2024-01-03T12:00:00.000Z'); // Wed UTC
    const day2 = getDayName('2024-01-04T12:00:00.000Z'); // Thu UTC
    expect(day1).not.toBe(day2);
  });
});

describe('truncateTitle', () => {
  it('does not truncate short titles', () => {
    expect(truncateTitle('hello')).toBe('hello');
  });

  it('truncates long titles with ellipsis', () => {
    const result = truncateTitle('this is a very long title', 10);
    expect(result).toBe('this is a …');
    expect(result.length).toBe(11);
  });

  it('uses default maxLen of 20', () => {
    const title = 'a'.repeat(25);
    const result = truncateTitle(title);
    expect(result).toBe('a'.repeat(20) + '…');
  });
});

describe('getToday', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    expect(getToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns the current date', () => {
    const expected = new Date().toISOString().split('T')[0];
    expect(getToday()).toBe(expected);
  });
});

describe('daysAgo', () => {
  it('returns a date in YYYY-MM-DD format', () => {
    expect(daysAgo(7)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns today when called with 0', () => {
    expect(daysAgo(0)).toBe(getToday());
  });

  it('returns a date in the past', () => {
    expect(daysAgo(7) < getToday()).toBe(true);
    expect(daysAgo(1) < getToday()).toBe(true);
  });
});
