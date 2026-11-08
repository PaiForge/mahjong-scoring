"use client";

import { useEffect } from "react";
import { useRecordedResults } from "@mahjong-scoring/features/challenge/use-recorded-results";
import { packStoredResults } from "@mahjong-scoring/features/challenge/challenge-run";
import type { FinalResult } from "@mahjong-scoring/features/session/use-timed-session";
import { safeSessionStorage } from "@/lib/safe-storage";

/**
 * 各問題の結果を蓄積し、チャレンジ終了時に sessionStorage へ保存するフック
 * 問題結果の保存
 *
 * 積み方（時間切れの問題を末尾に残す規則を含む）は features の
 * `useRecordedResults` が持ち、ここは終了が確定した時点で storageKey へ
 * JSON 保存する。保存する形は回 ID（終了時刻）付きの封筒
 * （{@link packStoredResults}）で、結果ページは URL の `?run=` と一致する
 * 回の一覧だけを読む。保存できない環境（容量超過・プライベートモード）では
 * 黙って捨て、結果ページは保存が無いときと同じく問題別の一覧を出さない。
 *
 * @param storageKey - sessionStorage のキー（undefined の場合は記録のみで保存しない）
 * @param finalResult - 終了スナップショット。確定するまで undefined
 */
export function useStoredRecordedResults<T>(
  storageKey: string | undefined,
  finalResult: FinalResult | undefined,
): {
  recordResult: (result: T) => void;
  presentQuestion: (unanswered: T) => void;
} {
  const { recordResult, presentQuestion, collect } = useRecordedResults<T>();

  useEffect(() => {
    if (storageKey === undefined || finalResult === undefined) return;
    safeSessionStorage.setItem(
      storageKey,
      packStoredResults(
        finalResult.finishedAt,
        collect(finalResult.reason === "timeUp"),
      ),
    );
  }, [storageKey, finalResult, collect]);

  return { recordResult, presentQuestion };
}
