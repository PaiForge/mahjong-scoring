"use client";

import { useTranslations } from "next-intl";

import { QuestionPrompt } from "../../_components/question-prompt";

interface ScoreTablePromptProps {
  readonly isOya: boolean;
  readonly isTsumo: boolean;
  readonly han: number;
  /** 符。満貫以上は点数が符に依存しないため省く */
  readonly fu?: number;
}

/**
 * 点数表早引きの出題提示（親子・ツモロン・翻・符）
 * 点数表出題提示
 *
 * 出題盤面（ScoreTableBoard）と遊び方デモ（ScoreTableHowToPlay）で共有する、
 * 出題条件の「見せ方」の単一実装。盤面を変えるとデモも追従する
 * （machi-fu / yaku-han の *-prompt.tsx と同じ位置づけ）。
 */
export function ScoreTablePrompt({
  isOya,
  isTsumo,
  han,
  fu,
}: ScoreTablePromptProps) {
  const t = useTranslations("scoreTableChallenge");

  return (
    <>
      <div className="flex justify-center gap-6">
        <span className="text-2xl font-bold text-surface-900">
          {isOya ? t("oya") : t("ko")}
        </span>
        <span className="text-2xl font-bold text-surface-900">
          {isTsumo ? t("tsumo") : t("ron")}
        </span>
      </div>

      <div className="flex justify-center gap-6">
        <span className="text-2xl font-bold text-primary-600">
          {t("han", { count: han })}
        </span>
        {fu !== undefined && (
          <span className="text-2xl font-bold text-primary-600">
            {t("fu", { count: fu })}
          </span>
        )}
      </div>

      <QuestionPrompt>{t("questionLabel")}</QuestionPrompt>
    </>
  );
}
