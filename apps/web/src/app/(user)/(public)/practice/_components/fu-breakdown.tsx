"use client";

import { useTranslations } from "next-intl";
import type { FuDetail } from "@mahjong-scoring/core";
import { CollapsibleDetail } from "./collapsible-detail";
import { DetailTable } from "./detail-table";

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
 * 内訳の合計と正解が一致しない場合（例: 32符 → 40符）に切り上げの補足を出す。
 *
 * 翻数の内訳（{@link import("./yaku-breakdown").YakuBreakdown}）と同じく
 * 閉じた状態から始める（理由は {@link CollapsibleDetail}）。トレーニングの
 * 答え合わせと結果ページの問題別詳細のどちらでも、内訳の開き方が符と翻数で
 * 変わらない。
 */
export function FuBreakdown({
  details,
  answer,
  translationNamespace,
}: FuBreakdownProps) {
  const t = useTranslations(translationNamespace);
  const rawTotal = details.reduce((sum, detail) => sum + detail.fu, 0);

  return (
    <CollapsibleDetail title={t("breakdownTitle")}>
      <DetailTable
        rows={details.map((detail) => ({
          label: detail.reason,
          value: t("fuSuffix", { value: detail.fu }),
        }))}
        total={{
          label: t("breakdownTotal"),
          value: t("fuSuffix", { value: rawTotal }),
        }}
        note={
          rawTotal === answer ? undefined : (
            <>
              {t("fuSuffix", { value: rawTotal })} &rarr;{" "}
              {t("fuSuffix", { value: answer })}（{t("roundUp")}）
            </>
          )
        }
      />
    </CollapsibleDetail>
  );
}
