"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { FuDetail, YakuDetail } from "@mahjong-scoring/core";
import { useFuHanOrder } from "@/app/_hooks/use-display-settings-store";
import {
  resolveBreakdownTabs,
  type BreakdownJudgement,
} from "@mahjong-scoring/features/results/breakdown-tabs";
import { BreakdownPanel, type BreakdownPanelSection } from "./breakdown-panel";
import { FuBreakdownTable } from "./fu-breakdown";
import { YakuBreakdownTable } from "./yaku-breakdown";

interface ScoreBreakdownPanelProps {
  /**
   * 符の内訳と正解の符。満貫以上の問題（符が点数に効かない）と、内訳を
   * 保存する前の旧データでは渡さない
   */
  readonly fu?: {
    readonly details: readonly FuDetail[];
    readonly answer: number;
  };
  /** 役の内訳（ドラ・裏ドラを含む）。保存する前の旧データでは渡さない */
  readonly yakuDetails?: readonly YakuDetail[];
  /** 翻数の合計の後に効く丸めの補足（役満止まりなど） */
  readonly yakuNote?: ReactNode;
  /** 翻数・符の正誤。分かる画面だけが渡し、開いたときに間違えたほうを選ぶ */
  readonly judgement?: BreakdownJudgement;
}

/**
 * 点数系の答え合わせに添える翻数・符の内訳
 * 点数内訳パネル
 *
 * 符の内訳（{@link FuBreakdownTable}）と翻数の内訳（{@link YakuBreakdownTable}）を
 * 1 つの入口から切り替えて読ませる（器は {@link BreakdownPanel}）。昇級試験の
 * 答え合わせと結果ページの問題別詳細で使う。以前は 2 つの開閉を縦に積んで
 * いたが、両方開くと手牌・答え合わせの間が内訳で埋まった。
 *
 * 文言は共通の `challenge` 名前空間から引く（翻数の内訳と同じ理由で、練習
 * ごとの辞書に同じ語を持たせない）。
 */
export function ScoreBreakdownPanel({
  fu,
  yakuDetails,
  yakuNote,
  judgement,
}: ScoreBreakdownPanelProps) {
  const t = useTranslations("challenge.scoreBreakdown");
  const fuHanOrder = useFuHanOrder();

  const hasYaku = yakuDetails !== undefined && yakuDetails.length > 0;
  const { kinds, initial } = resolveBreakdownTabs(
    fuHanOrder,
    { han: hasYaku, fu: fu !== undefined },
    judgement,
  );

  const sections = kinds.flatMap((kind): BreakdownPanelSection[] => {
    if (kind === "fu" && fu !== undefined) {
      return [
        {
          kind,
          tabLabel: t("fuTab", { value: fu.answer }),
          content: (
            <FuBreakdownTable
              details={fu.details}
              answer={fu.answer}
              translationNamespace="challenge.fuBreakdown"
            />
          ),
        },
      ];
    }
    if (kind === "han" && yakuDetails !== undefined) {
      return [
        {
          kind,
          tabLabel: t("hanTab", {
            count: yakuDetails.reduce((sum, detail) => sum + detail.han, 0),
          }),
          content: (
            <YakuBreakdownTable yakuDetails={yakuDetails} note={yakuNote} />
          ),
        },
      ];
    }
    return [];
  });

  return (
    <BreakdownPanel
      title={t("toggle")}
      sections={sections}
      initialKind={initial}
    />
  );
}
