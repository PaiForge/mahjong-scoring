import { useTranslations } from "use-intl";
import { buildScoreBreakdownTabs } from "@mahjong-scoring/features/results/score-breakdown-tabs";

import { useScoreTableModal } from "@mahjong-scoring/features/score-table/use-score-table-modal";

import { TableIcon } from "../../components/icons/icons";
import { useFuHanOrder } from "../../hooks/use-display-settings-store";
import { colors } from "../../lib/theme";
import { ScoreTableModal } from "../endless/agari-score/score-table-modal";
import { ReferenceLinkButton } from "./reference-link-button";
import { BreakdownPanel, type BreakdownPanelSection } from "./breakdown-panel";
import { FuBreakdownTable } from "./fu-breakdown";
import { YakuBreakdownTable } from "./yaku-breakdown";
import type { ScoreBreakdownPanelProps } from "@mahjong-scoring/features/results/breakdown-props";

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
}: ScoreBreakdownPanelProps & { readonly testID?: string }) {
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
