"use client";

import { useTranslations } from "next-intl";
import type { YakuDetail } from "@mahjong-scoring/core";

interface HanBreakdownProps {
  /** 役の内訳（ドラ・裏ドラを含む） */
  readonly yakuDetails: readonly YakuDetail[];
  /** 正解の翻数（役満に丸めた後） */
  readonly correctHan: number;
}

/**
 * 翻数の内訳表示
 * 翻内訳表示
 *
 * 回答後のフィードバックとして、成立していた役とその翻数、合計を示す。
 * 「何翻だったか」だけでは翻数の数え間違いを直せない — どの役を見落とし、
 * どの役を数えすぎたのかは内訳を並べて初めて分かる。
 *
 * 合計が正解と一致しない場合（例: 16翻 → 役満）は丸めの行を出す。
 */
export function HanBreakdown({ yakuDetails, correctHan }: HanBreakdownProps) {
  const t = useTranslations("hanCountChallenge");

  if (yakuDetails.length === 0) return undefined;

  const rawTotal = yakuDetails.reduce((sum, detail) => sum + detail.han, 0);

  return (
    <div className="rounded-xl border-3 border-ink bg-white p-4 text-sm">
      <p className="mb-2 font-bold text-surface-900">{t("breakdownTitle")}</p>

      <dl>
        {yakuDetails.map((detail, i) => (
          <div
            key={i}
            className="flex justify-between border-b-2 border-dashed border-border/60 py-1.5 last:border-0"
          >
            <dt className="text-surface-600">{detail.name}</dt>
            <dd className="text-surface-800">
              {t("hanOption", { count: detail.han })}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-1 flex justify-between border-t-2 border-border pt-1.5 font-bold text-surface-900">
        <span>{t("breakdownTotal")}</span>
        <span>{t("hanOption", { count: rawTotal })}</span>
      </div>

      {rawTotal !== correctHan && (
        <p className="mt-1 text-right text-xs text-surface-500">
          {t("hanOption", { count: rawTotal })} &rarr; {t("yakuman")}（
          {t("yakumanNote")}）
        </p>
      )}
    </div>
  );
}
