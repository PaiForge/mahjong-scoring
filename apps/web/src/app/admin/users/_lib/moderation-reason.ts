/**
 * 管理者の操作理由の最大文字数
 * モデレーション理由の上限
 *
 * サーバーの検証（`normalizeModerationReason`）と入力欄の `maxLength` が
 * 同じ値を使う。`moderation.ts` は DB を import するため、クライアントからも
 * 読めるようこのファイルに分けている。
 */
export const MODERATION_REASON_MAX_LENGTH = 1000;

/**
 * 管理者の操作理由を検証し、前後の空白を除いた値を返す
 * モデレーション理由の検証
 *
 * BAN / 特典の付与 / 付与の取り消しで共通の規則。空、または上限を超える
 * 理由は `undefined`。
 *
 * @param reason - 入力された理由
 */
export function normalizeModerationReason(reason: string): string | undefined {
  const trimmed = reason.trim();
  if (trimmed.length === 0 || trimmed.length > MODERATION_REASON_MAX_LENGTH) {
    return undefined;
  }
  return trimmed;
}
