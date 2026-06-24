"use client";

import { useTranslations } from "next-intl";

/**
 * 点数表早引き練習の「問題方式」ビジュアルデモ
 * 点数表 遊び方デモ
 *
 * 実際の出題（親子・ツモロン・翻・符の提示）を静的に再現し、出題形式を端的に示す。
 * 例: 子・ロン・3翻・30符。
 */
export function ScoreTableHowToPlay() {
  const t = useTranslations("scoreTableChallenge");

  return (
    <div className="space-y-4">
      <p className="text-center text-sm font-medium text-surface-500">
        {t("questionLabel")}
      </p>

      <div className="flex justify-center gap-6">
        <span className="text-2xl font-bold text-surface-900">{t("ko")}</span>
        <span className="text-2xl font-bold text-surface-900">{t("ron")}</span>
      </div>

      <div className="flex justify-center gap-6">
        <span className="text-2xl font-bold text-primary-600">
          {t("han", { count: 3 })}
        </span>
        <span className="text-2xl font-bold text-primary-600">
          {t("fu", { count: 30 })}
        </span>
      </div>
    </div>
  );
}
