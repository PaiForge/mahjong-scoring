import { useTranslations } from "use-intl";
import type { FuDetail, YakuDetail } from "@mahjong-scoring/core";
import type { BreakdownJudgement } from "@mahjong-scoring/features/results/breakdown-tabs";
import { buildScoreBreakdownTabs } from "@mahjong-scoring/features/results/score-breakdown-tabs";

import type { ScoreTableFocus } from "@mahjong-scoring/features/score-table/focus";
import { useScoreTableModal } from "@mahjong-scoring/features/score-table/use-score-table-modal";

import { TableIcon } from "../../components/icons/icons";
import { useFuHanOrder } from "../../hooks/use-display-settings-store";
import { colors } from "../../lib/theme";
import { ScoreTableModal } from "../endless/agari-score/score-table-modal";
import { ReferenceLinkButton } from "./reference-link-button";
import { BreakdownPanel, type BreakdownPanelSection } from "./breakdown-panel";
import { FuBreakdownTable } from "./fu-breakdown";
import { YakuBreakdownTable } from "./yaku-breakdown";

/**
 * 点数系の答え合わせに添える翻数・符の内訳（web の `ScoreBreakdownPanel`）
 * 点数内訳パネル
 *
 * 符の内訳と翻数の内訳を 1 つの入口から切り替えて読ませる（器は
 * {@link BreakdownPanel}）。昇級試験の答え合わせと結果の問題別詳細で使う。
 * 文言は共通の `challenge` 名前空間から引く。
 *
 * `scoreTableFocus` を渡すと、内訳の答えの値（翻数の合計・符）が正解のセルを
 * ハイライトした点数表を開き、内訳の下に「点数表を確認」（素の表）を添える。
 */
export function ScoreBreakdownPanel({
  fu,
  yakuDetails,
  yakuNote,
  judgement,
  scoreTableFocus,
  testID,
}: {
  /**
   * 符の内訳と正解の符。5 翻以上の問題（符が点数に効かない）では渡さない。
   * 符で満貫に届いた 4 翻以下の問題には渡す
   */
  readonly fu?: {
    readonly details: readonly FuDetail[];
    readonly answer: number;
  };
  /** 役の内訳（ドラ・裏ドラを含む） */
  readonly yakuDetails: readonly YakuDetail[];
  /** 翻数の合計の後に効く丸めの補足（役満止まりなど） */
  readonly yakuNote?: string;
  /** 翻数・符の正誤。分かる画面だけが渡し、開いたときに間違えたほうを選ぶ */
  readonly judgement?: BreakdownJudgement;
  /** この問題の正解の位置（親子・ロンツモ・翻・符）。渡すと点数表を開ける */
  readonly scoreTableFocus?: ScoreTableFocus;
  readonly testID?: string;
}) {
  const t = useTranslations("challenge.scoreBreakdown");
  const tScoreTable = useTranslations("scoreTable");
  // 値（翻数・符）を押したときだけ正解のセルをハイライトする
  // （「点数表を確認」からは素の表を開く。点数計算の答え合わせと同じ約束）
  const scoreTable = useScoreTableModal();
  const openScoreTable =
    scoreTableFocus === undefined ? undefined : scoreTable.open;
  const openHighlighted =
    openScoreTable === undefined ? undefined : () => openScoreTable(true);
  const fuHanOrder = useFuHanOrder();

  const { tabs, initial } = buildScoreBreakdownTabs(
    fuHanOrder,
    fu,
    yakuDetails,
    judgement,
  );

  const sections = tabs.map((tab): BreakdownPanelSection =>
    tab.kind === "fu"
      ? {
          kind: tab.kind,
          tabLabel: t("fuTab", { value: tab.fu.answer }),
          content: (
            <FuBreakdownTable
              details={tab.fu.details}
              answer={tab.fu.answer}
              translationNamespace="challenge.fuBreakdown"
              onOpenScoreTable={openHighlighted}
            />
          ),
        }
      : {
          kind: tab.kind,
          tabLabel: t("hanTab", { count: tab.hanTotal }),
          content: (
            <YakuBreakdownTable
              yakuDetails={tab.yakuDetails}
              note={yakuNote}
              onOpenScoreTable={openHighlighted}
            />
          ),
        },
  );

  return (
    <>
      <BreakdownPanel
        title={t("toggle")}
        sections={sections}
        initialKind={initial}
        testID={testID}
        action={
          openScoreTable === undefined ? undefined : (
            <ReferenceLinkButton
              icon={<TableIcon size={14} color={colors.mutedForeground} />}
              label={tScoreTable("viewScoreTable")}
              onPress={() => openScoreTable(false)}
            />
          )
        }
      />
      {scoreTableFocus !== undefined && (
        <ScoreTableModal
          isOpen={scoreTable.isOpen}
          onClose={scoreTable.close}
          focus={scoreTableFocus}
          highlighted={scoreTable.highlighted}
        />
      )}
    </>
  );
}
