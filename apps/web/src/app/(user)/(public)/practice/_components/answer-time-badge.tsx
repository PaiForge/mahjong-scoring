"use client";

import { useTranslations } from "next-intl";
import { formatElapsedSeconds } from "@mahjong-scoring/features/session/timer-display";
import { useElapsedMs } from "@mahjong-scoring/features/session/use-elapsed-ms";

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
  const seconds = formatElapsedSeconds(elapsedMs);

  return (
    <p className="text-center text-xs tabular-nums text-surface-500">
      {t("answerTime", { seconds })}
    </p>
  );
}
