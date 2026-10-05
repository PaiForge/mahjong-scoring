"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * マウントからの経過ミリ秒。`running` が false になった時点で止まる
 * 経過時間
 *
 * 計測の起点はマウント。問題ごとに `key` を変えて付け直すことで、
 * 新しい問題で 0 から数え直す（状態のリセットを effect で書かない）。
 */
function useElapsedMs(running: boolean): number {
  const [startedAt] = useState(() => Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!running) return;
    const tick = () => setElapsedMs(Date.now() - startedAt);
    tick();
    const id = window.setInterval(tick, 100);
    return () => {
      window.clearInterval(id);
      // 止まった瞬間の値で固定する（次の tick を待たない）
      tick();
    };
  }, [running, startedAt]);

  return elapsedMs;
}

interface AnswerTimeBadgeProps {
  /** 計測中か。回答すると false にして値を止める */
  readonly running: boolean;
}

/**
 * 回答時間の表示（Pro の拡張機能）
 * 回答時間バッジ
 *
 * 問題が出てから回答するまでの秒数を 0.1 秒刻みで出す。問題ごとに
 * `key={questionSeq}` を付けて使い、マウントを起点に数える。保存はしない
 * （記録なしのトレーニングという位置づけ）。
 */
export function AnswerTimeBadge({ running }: AnswerTimeBadgeProps) {
  const t = useTranslations("practiceQuota");
  const elapsedMs = useElapsedMs(running);
  const seconds = (elapsedMs / 1000).toFixed(1);

  return (
    <p className="text-center text-xs tabular-nums text-surface-500">
      {t("answerTime", { seconds })}
    </p>
  );
}
