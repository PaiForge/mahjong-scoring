"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { PlanBenefit } from "@/lib/billing/plans";
import type { QuotaMenu } from "@/lib/practice-quota/limits";

import { beginPracticeQuestion } from "../_actions/begin-practice-question";

/**
 * 直近の出題許可の結果
 * 出題ゲート
 *
 * - `open` — 直前の問題は許可された。`remaining` は今日の残り（Pro は `"unlimited"`）
 * - `blocked` — 無料枠を使い切った。問題は生成していない
 * - `rateLimited` — IP のレート制限に掛かった（連打・自動化）。問題は生成していない
 */
export type PracticeQuotaGate =
  | {
      readonly kind: "open";
      readonly remaining: number | "unlimited";
      readonly limit: number | "unlimited";
      readonly benefits: readonly PlanBenefit[];
    }
  | {
      readonly kind: "blocked";
      readonly limit: number;
      readonly signedIn: boolean;
      readonly benefits: readonly PlanBenefit[];
    }
  | { readonly kind: "rateLimited" };

export interface PracticeQuotaControl {
  /**
   * 1 問始める。サーバーに無料枠の消費を聞き、許可されたら `generate` を呼ぶ。
   * 許可されなければ `gate` が `blocked` になり、呼び出し側はペイウォールを出す
   */
  readonly requestQuestion: () => Promise<void>;
  /** サーバーの返事を待っている間 true。「次の問題へ」はこの間押せなくする */
  readonly isChecking: boolean;
  /** 直近の結果。まだ一度も聞いていなければ undefined */
  readonly gate: PracticeQuotaGate | undefined;
}

/**
 * エンドレス練習の無料枠ゲート
 * 練習回数ゲート
 *
 * 問題の生成（ブラウザ側・同期）の前に Server Action `beginPracticeQuestion`
 * を 1 回挟む。盤面は「生成する」の代わりに `requestQuestion()` を呼ぶだけで、
 * 消費の仕組み（DB / cookie / Pro の無制限）を知らない。
 *
 * @design 通信の失敗は許可して通す（fail-open）
 *
 * Server Action に届かない（オフライン・一時障害）ときは問題を生成する。
 * 練習が止まる方が、無料枠を 1 問多く使われるより損が大きい。サーバーが
 * 明示的に「上限」「レート制限」と答えたときだけ止める。
 *
 * @design 古い返事は捨てる
 *
 * 連打や自動次へで要求が重なったとき、後から始めた要求の返事だけを採用する。
 * 先の返事で生成し、後の返事でも生成すると 1 回の操作で 2 問進む。
 *
 * @param menu - 練習（回数制限の単位）
 * @param generate - 許可されたときに呼ぶ生成処理。参照が変わっても最新のものを呼ぶ
 */
export function usePracticeQuota(
  menu: QuotaMenu,
  generate: () => void,
): PracticeQuotaControl {
  const [isChecking, setIsChecking] = useState(false);
  const [gate, setGate] = useState<PracticeQuotaGate | undefined>(undefined);
  const generateRef = useRef(generate);
  const requestSeq = useRef(0);
  const mountedRef = useRef(true);

  // 最新の generate を効果の中で控える（描画中に ref へ書かない）
  useEffect(() => {
    generateRef.current = generate;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const requestQuestion = useCallback(async () => {
    const seq = ++requestSeq.current;
    const isCurrent = () => mountedRef.current && requestSeq.current === seq;
    setIsChecking(true);

    try {
      const result = await beginPracticeQuestion(menu);
      if (!isCurrent()) return;

      if ("error" in result) {
        if (result.error === "rateLimited") {
          setGate({ kind: "rateLimited" });
          return;
        }
        // invalidMenu は UI のバグ。利用者を止める理由にはならない
        console.warn("beginPracticeQuestion rejected the menu:", menu);
        generateRef.current();
        return;
      }

      if (result.allowed) {
        generateRef.current();
        setGate({
          kind: "open",
          remaining: result.remaining,
          limit: result.limit,
          benefits: result.benefits,
        });
      } else {
        setGate({
          kind: "blocked",
          limit: typeof result.limit === "number" ? result.limit : 0,
          signedIn: result.signedIn,
          benefits: result.benefits,
        });
      }
    } catch (error) {
      if (!isCurrent()) return;
      console.warn(
        "beginPracticeQuestion failed; allowing the question:",
        error,
      );
      generateRef.current();
    } finally {
      if (isCurrent()) setIsChecking(false);
    }
  }, [menu]);

  return { requestQuestion, isChecking, gate };
}
