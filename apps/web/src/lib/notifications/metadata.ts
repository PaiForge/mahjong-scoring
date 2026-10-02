import { z } from "zod";

/**
 * 通知の `metadata` — 文面に差し込む値
 * 通知メタデータ
 *
 * 書き込み側は {@link NotificationMetadata} の形で入れ、読み取り側は
 * {@link parseNotificationMetadata} で検証してから使う。jsonb なので DB は形を
 * 守らず、古い行や手で直した行が壊れていても一覧が落ちないように、検証に
 * 失敗した行は「値なし」として汎用の文面に落とす。
 *
 * すべて任意。種別ごとに使う値が違うが、種別別のスキーマに分けるほどの量は無い。
 * 日時は ISO 8601 の文字列（jsonb に Date は入らない）。
 */
const notificationMetadataSchema = z.object({
  /** プラン（`lib/billing/plans.ts` の `PlanKey`） */
  plan: z.string().optional(),
  /** 売り方（`PurchaseKind`）。購入の通知だけ */
  kind: z.enum(["pass", "lifetime"]).optional(),
  /** 特典の終了。無期限なら持たない */
  expiresAt: z.string().datetime({ offset: true }).optional(),
  /** 取り消しの理由（`PurchaseRevokeReason`）。購入の取り消しだけ */
  revokeReason: z.enum(["refunded", "fraud"]).optional(),
});

export type NotificationMetadata = z.infer<typeof notificationMetadataSchema>;

/** 検証に失敗したときの値（すべて未設定） */
const EMPTY_METADATA: NotificationMetadata = {};

/**
 * jsonb の値を検証して返す。形が違えば空の値
 * 通知メタデータ解析
 */
export function parseNotificationMetadata(
  value: unknown,
): NotificationMetadata {
  const parsed = notificationMetadataSchema.safeParse(value);
  return parsed.success ? parsed.data : EMPTY_METADATA;
}
