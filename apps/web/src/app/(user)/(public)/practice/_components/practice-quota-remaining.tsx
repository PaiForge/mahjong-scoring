"use client";

import { useTranslations } from "next-intl";

interface PracticeQuotaRemainingProps {
  /** 今日の残り。Pro（`"unlimited"`）とまだ聞いていない（undefined）は出さない */
  readonly remaining: number | "unlimited" | undefined;
}

/**
 * 無料枠の残り回数の表示
 * 残り回数表示
 *
 * 「今日はあと n 問」。0 なら「この問題で終わり」。無制限のときは何も出さない
 * （Pro に残数の概念はない）。
 */
export function PracticeQuotaRemaining({
  remaining,
}: PracticeQuotaRemainingProps) {
  const t = useTranslations("practiceQuota");
  if (typeof remaining !== "number") return null;

  return (
    <p className="text-center text-xs text-surface-500">
      {t("remaining", { count: remaining })}
    </p>
  );
}
