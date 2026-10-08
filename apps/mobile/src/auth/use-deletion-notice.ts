import { create } from "zustand";

/**
 * 退会を受け付けた知らせ
 *
 * - `completed` — 全工程を終えた
 * - `pending` — 受け付けたが、一部の工程がまだ終わっていない（サーバーが続ける）
 */
export type DeletionNotice = "completed" | "pending";

const useDeletionNoticeStore = create<{
  readonly notice: DeletionNotice | undefined;
}>(() => ({ notice: undefined }));

/**
 * 退会を受け付けたことを画面に知らせる
 * 退会の知らせ
 *
 * 退会の画面で受け付けたときと、別の端末で退会した・成功の応答を失った後に
 * サーバーから「退会を受け付けた」と返ってきたとき（`account-api.ts`）に
 * 呼ぶ。設定のアカウントの節が出す。
 */
export function showDeletionNotice(notice: DeletionNotice): void {
  useDeletionNoticeStore.setState({ notice });
}

/** 知らせを閉じる */
export function dismissDeletionNotice(): void {
  useDeletionNoticeStore.setState({ notice: undefined });
}

/** 退会の知らせを読む */
export function useDeletionNotice(): DeletionNotice | undefined {
  return useDeletionNoticeStore((state) => state.notice);
}
