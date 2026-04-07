import { describe, it, expect } from 'vitest';

import { escapeLikePattern } from './escape-like-pattern';

describe('escapeLikePattern', () => {
  it('returns a normal string unchanged', () => {
    expect(escapeLikePattern('hello')).toBe('hello');
  });

  it('escapes percent sign', () => {
    expect(escapeLikePattern('100%')).toBe('100\\%');
  });

  it('escapes underscore', () => {
    expect(escapeLikePattern('user_name')).toBe('user\\_name');
  });

  it('escapes backslash', () => {
    expect(escapeLikePattern('path\\to')).toBe('path\\\\to');
  });

  it('escapes all special characters in a mixed string', () => {
    expect(escapeLikePattern('%_\\')).toBe('\\%\\_\\\\');
  });

  it('returns an empty string unchanged', () => {
    expect(escapeLikePattern('')).toBe('');
  });
});
