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
import { containsProhibitedWord } from "../profile/prohibited-words";
import { isReservedUsername } from "./reserved-usernames";

const USERNAME_REGEX = /^[a-z](?:[a-z0-9]_?)*[a-z0-9]$/;
const USERNAME_MIN_LENGTH = 2;

/**
 * ユーザー名の最大長。
 *
 * 入力欄の `maxLength` もここから引くこと。フォーム側に数値を書き写すと、
 * 上限を変えたときに入力欄と {@link validateUsernameFormat} が静かに食い違う。
 */
export const USERNAME_MAX_LENGTH = 20;

export type UsernameFormatError = "too_short" | "too_long" | "invalid_format";
export type UsernameValidationError =
  UsernameFormatError | "reserved" | "prohibited";

/**
 * Validate username format only (length, characters, pattern).
 * Use this when checking an existing username (e.g., profile lookup)
 * where reserved word checking is unnecessary.
 *
 * ユーザー名フォーマットバリデーション
 */
export function validateUsernameFormat(
  username: string,
): UsernameFormatError | undefined {
  if (username.length < USERNAME_MIN_LENGTH) {
    return "too_short";
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return "too_long";
  }
  if (!USERNAME_REGEX.test(username)) {
    return "invalid_format";
  }
  return undefined;
}

/**
 * Full username validation including reserved word check.
 * Use this for registration and username change flows.
 *
 * ユーザー名バリデーション（予約語・禁止語句チェック込み）
 */
export function validateUsername(
  username: string,
): UsernameValidationError | undefined {
  const formatError = validateUsernameFormat(username);
  if (formatError) {
    return formatError;
  }
  if (isReservedUsername(username)) {
    return "reserved";
  }
  // ユーザー名は公開プロフィールの URL とランキングに出る（`profile/prohibited-words.ts`）
  if (containsProhibitedWord(username)) {
    return "prohibited";
  }
  return undefined;
}

/** {@link generateUsername} の接頭辞。予約語（完全一致）の "player" とは別物 */
const GENERATED_USERNAME_PREFIX = "player_";

/**
 * 指定した長さの乱数バイト列を返す関数
 *
 * {@link generateUsername} の乱数源。React Native の JS エンジン（Hermes）には
 * `crypto` が無いため、アプリは expo-crypto の `getRandomBytes` を渡す。
 */
export type RandomBytes = (length: number) => Uint8Array;

/** 既定の乱数源。ブラウザと Node の `crypto.getRandomValues` を使う */
const defaultRandomBytes: RandomBytes = (length) =>
  crypto.getRandomValues(new Uint8Array(length));

/**
 * 必ず {@link validateUsername} を通るランダムなユーザー名を作る。
 * ランダムユーザー名生成
 *
 * 名前を考えるのが手間で登録を止める人に、そのまま使える／書き換えて使える
 * 叩き台を渡すためのもの。接尾辞は 16 進 10 桁（40 bit）で、
 * `player_` と合わせて 17 文字に収まる。重複はサーバー側の一意制約が弾く。
 *
 * @param randomBytes - 乱数源（省略時は `crypto.getRandomValues`）
 */
export function generateUsername(
  randomBytes: RandomBytes = defaultRandomBytes,
): string {
  const suffix = Array.from(randomBytes(5), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `${GENERATED_USERNAME_PREFIX}${suffix}`;
}
