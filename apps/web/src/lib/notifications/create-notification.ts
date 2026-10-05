import "server-only";

import {
  db,
  notifications,
  type NewNotification,
  type TransactionClient,
} from "@/lib/db";
import { logExternalError } from "@/lib/log-error";

import type { NotificationMetadata } from "./metadata";
import type { NotificationTargetType, NotificationType } from "./types";

/**
 * 通知の書き込み — 唯一の入口
 * 通知作成
 *
 * アプリが通知を作る場所はすべてここを通す。将来の「受け取る人がこの種別を
 * ミュートしている」「行為者をブロックしている」のような抑止は、呼び出し側を
 * 触らずこの関数の中に足す。
 */

/** 1 通知の内容 */
export interface NotificationInput {
  /** 受け取る人 */
  readonly userId: string;
  /** 種別（`types.ts` に登録済みのもの） */
  readonly type: NotificationType;
  /** 対象の表と行。「同じ事実には 1 通知」の鍵になる */
  readonly target: {
    readonly type: NotificationTargetType;
    readonly id: string;
  };
  /** 文面に差し込む値 */
  readonly metadata?: NotificationMetadata;
}

function toRow(input: NotificationInput): NewNotification {
  return {
    userId: input.userId,
    type: input.type,
    targetType: input.target.type,
    targetId: input.target.id,
    metadata: input.metadata ?? {},
  };
}

/**
 * 通知を作る。同じ事実の通知が既にあれば何もしない
 * 通知挿入
 *
 * 中身は {@link insertNotifications} の 1 件版。抑止条件（将来のミュート等）は
 * 複数件の側に書けば単件にも効く。
 *
 * @returns 新しく作ったら true、既にあって何もしなかったら false
 */
export async function insertNotification(
  executor: TransactionClient | typeof db,
  input: NotificationInput,
): Promise<boolean> {
  return (await insertNotifications(executor, [input])) > 0;
}

/**
 * 複数の通知をまとめて作る。既にある事実は飛ばす
 * 通知一括挿入
 *
 * `(user_id, type, target_type, target_id)` の一意インデックスに
 * `ON CONFLICT DO NOTHING` で乗る。Checkout の着地と Webhook が同じ購入を
 * 同時に記録しても、日次バッチが同じ期限切れを翌日もう一度拾っても 1 通になる。
 * トランザクションの中からも外からも呼べるよう、実行する接続を受け取る。
 *
 * 単件（{@link insertNotification}）もここを通る。通知を抑止する条件を足すときは
 * この関数の中に書く。空なら DB に行かない。
 *
 * @returns 新しく作った件数
 */
export async function insertNotifications(
  executor: TransactionClient | typeof db,
  inputs: readonly NotificationInput[],
): Promise<number> {
  if (inputs.length === 0) return 0;
  const inserted = await executor
    .insert(notifications)
    .values(inputs.map(toRow))
    .onConflictDoNothing({
      target: [
        notifications.userId,
        notifications.type,
        notifications.targetType,
        notifications.targetId,
      ],
    })
    .returning({ id: notifications.id });
  return inserted.length;
}

/**
 * 通知を作る。失敗しても呼び出し元を巻き込まない
 * 通知作成（例外なし）
 *
 * 購入の記録や付与のような本来の処理の **後** に呼ぶ。通知は本来の処理の
 * 付随物で、通知の失敗で購入を失敗させたり Webhook に 500 を返させたりしない。
 * ただし投げ捨て（await しない）にはしない — サーバーレスでは応答を返した
 * 時点で関数が止まり、INSERT が届かないことがある。失敗はログに残す。
 */
export async function notifyQuietly(input: NotificationInput): Promise<void> {
  try {
    await insertNotification(db, input);
  } catch (error) {
    logExternalError(
      "notifyQuietly",
      `failed to create ${input.type} notification for ${input.userId}`,
      error,
    );
  }
}
