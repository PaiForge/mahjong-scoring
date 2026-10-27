import { moderationActions } from "../../../lib/db";
import type { TransactionClient } from "../../../lib/db";

/**
 * 利用者以外を対象にした管理者の操作の種類（`moderation_actions.action` の値）
 * コンテンツ操作種別
 *
 * 広告・お知らせ・トラッキング ID の Server Action と 1 対 1。利用者を対象にした
 * 操作は `admin/users/_lib/moderation.ts` の `ModerationActionKind`。どちらも
 * 監査ログの絞り込み（`audit-log/page.tsx`）の選択肢と同じ文字列。
 */
export const ContentActionKind = {
  CreateAdCreative: "create_ad_creative",
  UpdateAdCreative: "update_ad_creative",
  /** スロット内の並びを動かした（端で動かせなかったときは記録しない） */
  MoveAdCreative: "move_ad_creative",
  SetAdCreativeActive: "set_ad_creative_active",
  /** 同じ題の広告の掲載 / 停止をまとめて切り替えた */
  SetAdCreativeActiveByTitle: "set_ad_creative_active_by_title",
  /** 同じ題の広告のリンクをまとめて書き換えた */
  SetAdCreativeHrefByTitle: "set_ad_creative_href_by_title",
  /** Amazon のトラッキング ID を設定・差し替え・削除した */
  SetAmazonTrackingId: "set_amazon_tracking_id",
  CreateAnnouncement: "create_announcement",
  UpdateAnnouncement: "update_announcement",
  DeleteAnnouncement: "delete_announcement",
} as const;
export type ContentActionKind =
  (typeof ContentActionKind)[keyof typeof ContentActionKind];

/**
 * 利用者以外の対象の種別（`moderation_actions.target_type` の値）
 * コンテンツ操作対象種別
 *
 * 対象は `target_key`（文字列）で指す。
 * - `ad_creative` — 広告の id
 * - `ad_title` — 既定ロケールの題。題で束ねる操作は画面で束ねた時点の題を
 *   鍵にするので、改題すると同じ束を鍵で追えなくなる（行の id は metadata に残す）
 * - `ad_network_setting` — {@link adNetworkSettingKey} の形（`amazon_jp:web`）
 * - `announcement` — お知らせの id
 */
export const ContentActionTargetType = {
  AdCreative: "ad_creative",
  AdTitle: "ad_title",
  AdNetworkSetting: "ad_network_setting",
  Announcement: "announcement",
} as const;
export type ContentActionTargetType =
  (typeof ContentActionTargetType)[keyof typeof ContentActionTargetType];

/** 広告ネットワーク設定の `target_key`（`<network>:<platform>`） */
export function adNetworkSettingKey(network: string, platform: string): string {
  return `${network}:${platform}`;
}

/** コンテンツ操作の対象 */
export interface ContentActionTarget {
  readonly type: ContentActionTargetType;
  readonly key: string;
}

/** コンテンツ操作の記録内容 */
interface ContentActionRecord {
  readonly actorId: string;
  readonly action: ContentActionKind;
  readonly target: ContentActionTarget;
  readonly ipAddress: string | undefined;
  /**
   * 操作の付随情報。変更前後の値を `before` / `after` に入れる。一括の操作は
   * 行ごとに前の値が違うので `before` を行の配列にする
   */
  readonly metadata: Record<string, unknown>;
}

/**
 * 利用者以外を対象にした操作を監査ログ（`moderation_actions`）に残す
 * コンテンツ操作記録
 *
 * 本体の書き込みと同じトランザクションで呼ぶ。記録が書けなければ操作も
 * 失敗にする（`moderation_actions` の TSDoc）。`target_id` は持たず、対象は
 * `target_key` に入れる（CHECK が両立を弾く）。
 */
export async function recordContentAction(
  tx: TransactionClient,
  record: ContentActionRecord,
): Promise<void> {
  await tx.insert(moderationActions).values({
    actorId: record.actorId,
    action: record.action,
    targetType: record.target.type,
    targetKey: record.target.key,
    ipAddress: record.ipAddress,
    metadata: record.metadata,
  });
}
