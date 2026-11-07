"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { NavTarget } from "@/app/[locale]/(user)/_components/_lib/locale-links";
import { DOJO_PATH } from "@mahjong-scoring/features/routes";

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
const DEFAULT_EXAM_GATE_LINKS: ExamGateLinks = {
  signUp: { href: EXAM_GATE_SIGN_UP_PATH, crossLocale: false },
  dojo: { href: DOJO_PATH, crossLocale: false },
};

const ExamGateLinksContext = createContext<ExamGateLinks>(
  DEFAULT_EXAM_GATE_LINKS,
);

/**
 * 受験ゲートの導線を配下へ渡す
 * 受験ゲートの導線Provider
 *
 * @design props ではなく context で渡す理由
 * 受験ゲート（`ExamStartGate`）は説明ページの開始導線のほか、模試の画面末尾
 * （練習の共有の部品 `createTrainingView` → `TrainingChallengeCta` の中）にも
 * 置かれる。模試の page.tsx からゲートまでの間はすべてクライアントの共有部品で、
 * そこへ導線の props を 1 本ずつ通すと試験のための引数が練習の部品に増える。
 * 試験のページがこの Provider で包めば、間の部品は導線を知らずに済む。
 */
export function ExamGateLinksProvider({
  links,
  children,
}: {
  readonly links: ExamGateLinks;
  readonly children: ReactNode;
}) {
  return (
    <ExamGateLinksContext.Provider value={links}>
      {children}
    </ExamGateLinksContext.Provider>
  );
}

/** 受験ゲートの導線（Provider の外では言語をまたがない既定の導線） */
export function useExamGateLinks(): ExamGateLinks {
  return useContext(ExamGateLinksContext);
}
