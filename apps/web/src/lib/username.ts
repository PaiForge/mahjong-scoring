/**
 * Username validation rules:
 * - Length: 2-20 characters
 * - Allowed characters: lowercase letters a-z, digits 0-9, underscore _
 * - Must start with a lowercase letter
 * - Must end with a lowercase letter or digit
 * - No consecutive underscores
 * - No uppercase, no hyphens
 *
 * ユーザー名バリデーション
 */
import { isReservedUsername } from './reserved-usernames';

const USERNAME_REGEX = /^[a-z](?:[a-z0-9]_?)*[a-z0-9]$/;
const USERNAME_MIN_LENGTH = 2;
const USERNAME_MAX_LENGTH = 20;

export type UsernameFormatError = 'too_short' | 'too_long' | 'invalid_format';
export type UsernameValidationError = UsernameFormatError | 'reserved';

/**
 * Validate username format only (length, characters, pattern).
 * Use this when checking an existing username (e.g., profile lookup)
 * where reserved word checking is unnecessary.
 *
 * ユーザー名フォーマットバリデーション
 */
export function validateUsernameFormat(username: string): UsernameFormatError | undefined {
  if (username.length < USERNAME_MIN_LENGTH) {
    return 'too_short';
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return 'too_long';
  }
  if (!USERNAME_REGEX.test(username)) {
    return 'invalid_format';
  }
  return undefined;
}

/**
 * Full username validation including reserved word check.
 * Use this for registration and username change flows.
 *
 * ユーザー名バリデーション（予約語チェック込み）
 */
export function validateUsername(username: string): UsernameValidationError | undefined {
  const formatError = validateUsernameFormat(username);
  if (formatError) {
    return formatError;
  }
  if (isReservedUsername(username)) {
    return 'reserved';
  }
  return undefined;
}
