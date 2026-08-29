"use client";

import { useTranslations } from "next-intl";
import type { FuDetail } from "@mahjong-scoring/core";

interface FuBreakdownProps {
  /** 切り上げ前の符の内訳 */
  readonly details: readonly FuDetail[];
  /** 切り上げ後の符（正解） */
  readonly answer: number;
  /**
   * `breakdownTitle` / `breakdownTotal` / `roundUp` / `fuSuffix` を持つ
   * 翻訳名前空間（例: "totalFu"）
   */
  readonly translationNamespace: string;
}

/**
 * 合計符の内訳表示
 * 符内訳表示
 *
 * 回答後のフィードバックとして、副底から待ち符までの各構成要素と
 * その合計、そして10符単位への切り上げを示す。
 * 内訳の合計と正解が一致しない場合（例: 32符 → 40符）に切り上げ行を出す。
 */
export function FuBreakdown({
  details,
  answer,
  translationNamespace,
}: FuBreakdownProps) {
  const t = useTranslations(translationNamespace);
  const rawTotal = details.reduce((sum, detail) => sum + detail.fu, 0);

  return (
    <div className="rounded-xl border-3 border-ink bg-white p-4 text-sm">
      <p className="mb-2 font-bold text-surface-900">{t("breakdownTitle")}</p>

      <dl>
        {details.map((detail, i) => (
          <div
            key={i}
            className="flex justify-between border-b-2 border-dashed border-border/60 py-1.5 last:border-0"
          >
            <dt className="text-surface-600">{detail.reason}</dt>
            <dd className="text-surface-800">
              {t("fuSuffix", { value: detail.fu })}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-1 flex justify-between border-t-2 border-border pt-1.5 font-bold text-surface-900">
        <span>{t("breakdownTotal")}</span>
        <span>{t("fuSuffix", { value: rawTotal })}</span>
      </div>

      {rawTotal !== answer && (
        <p className="mt-1 text-right text-xs text-surface-500">
          {t("fuSuffix", { value: rawTotal })} &rarr;{" "}
          {t("fuSuffix", { value: answer })}（{t("roundUp")}）
        </p>
      )}
    </div>
  );
}
