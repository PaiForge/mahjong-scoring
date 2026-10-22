"use client";

import { useEffect, useRef } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { canResumePractice } from "../../_hooks/use-practice-quota";
import { parseGeneratorOptionsFromParams } from "../../agari-score/_lib/parse-practice-params";
import { useTenpaiScoreStore } from "./use-tenpai-score-store";

/**
 * URL のクエリ（出題条件）を聴牌形の点数計算のストアに適用し、最初の問題を求める
 * 出題条件の適用
 *
 * 出題条件の適用はクエリの変化で判定する（理由は和了形の点数計算の盤面と同じ:
 * 問題の有無で見ると前回の問題が残ったまま条件が無視され、マウント一度きり
 * ではクエリだけ変わる遷移に追随できず、生成失敗時には初期化が止まらない）。
 * ストアの `appliedQuery` が同じなら盤面を離れて戻ってきただけなので、
 * 解答中の問題を引き継いで無料枠を消費し直さない（これも和了形の点数計算と同じ）。
 *
 * @param isClient - hydration が済んだか。済むまでは何もしない
 * @param requestQuestion - 回数制限のゲートを通して問題を生成する
 * @param refreshGate - 引き継いだ問題のまま、無料枠の残りだけ読み直す
 */
export function useTenpaiScoreQuery({
  isClient,
  searchParams,
  requestQuestion,
  refreshGate,
}: {
  readonly isClient: boolean;
  readonly searchParams: ReadonlyURLSearchParams;
  readonly requestQuestion: () => Promise<void>;
  readonly refreshGate: () => Promise<void>;
}): void {
  const appliedQueryRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!isClient) return;

    const query = searchParams.toString();
    if (appliedQueryRef.current === query) return;
    appliedQueryRef.current = query;

    const store = useTenpaiScoreStore.getState();
    if (
      store.appliedQuery === query &&
      canResumePractice("tenpai-score", {
        hasQuestion: store.currentQuestion !== undefined,
        generationFailed: store.generationFailed,
      })
    ) {
      if (store.currentQuestion) void refreshGate();
      return;
    }

    const { allowedRanges, includeParent, includeChild, includeFuro } =
      parseGeneratorOptionsFromParams(new URLSearchParams(query));
    // 前回の問題もサーバーの返事を待つ前に消す（理由は和了形の点数計算の盤面と同じ）
    store.applyPracticeQuery(query, {
      allowedRanges,
      includeParent,
      includeChild,
      includeFuro,
    });
    void requestQuestion();
  }, [isClient, searchParams, requestQuestion, refreshGate]);
}
