/**
 * 退会の進み具合
 * 退会状態
 *
 * - `pending` — 受け付けたが、まだ終わっていない工程がある（サーバーが再開する。
 *   アプリはやり直さない）
 * - `completed` — 全工程を終えた
 *
 * web の退会の処理が返し、アプリ向け API の応答（`MobileDeleteAccountResponse`）と
 * アプリの退会の知らせが同じ値で受け取る。
 */
export type AccountDeletionStatus = "pending" | "completed";
