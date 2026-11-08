import type { NavTarget } from "@/app/[locale]/(user)/_components/_lib/locale-links";
import { DOJO_PATH } from "@mahjong-scoring/features/routes";

/**
 * 受験ゲートの導線の型と既定値
 *
 * サーバーの解決（`exam-gate-links.ts`）とクライアントの Provider
 * （`_components/exam-gate-links.tsx`）の両方が読むため、どちらの指令も持たない
 * モジュールに置く。`"use client"` のモジュールから値（定数）を export して
 * サーバーで読むと、値ではなくクライアント参照が届く（文字列として使えない）。
 */

/** アカウント登録のページ（ロケール非依存のパス） */
export const EXAM_GATE_SIGN_UP_PATH = "/sign-up";

/**
 * 受験ゲートが受験できないときに送る先
 * 受験ゲートの導線
 *
 * どちらもサーバーで `resolveNavTargetFor`（今のページの言語で公開しているか）を
 * 引いた結果。クライアントの部品は公開状態の表（`route-policy.ts`。sitemap の
 * ルートのレジストリを読み込む）を持てないため、サーバーの親が解決して渡す。
 */
export interface ExamGateLinks {
  /** 未ログインの人を送るアカウント登録 */
  readonly signUp: NavTarget;
  /** 資格の無い級の試験を開いた人を送る道場 */
  readonly dojo: NavTarget;
}

/**
 * 既定の導線（日本語のページから張るときと同じ。言語をまたがない）
 *
 * Provider の外で描いたとき（日本語だけで出す場所・テスト）はこれになり、
 * 日本語の出力は Provider の有無で変わらない。
 */
export const DEFAULT_EXAM_GATE_LINKS: ExamGateLinks = {
  signUp: { href: EXAM_GATE_SIGN_UP_PATH, crossLocale: false },
  dojo: { href: DOJO_PATH, crossLocale: false },
};
