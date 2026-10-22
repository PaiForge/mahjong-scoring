import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";
import { sumYakuHan } from "@mahjong-scoring/core";
import { orderYakuDetails } from "@mahjong-scoring/features/results/order-yaku-details";

import { useYakuOrder } from "../../hooks/use-yaku-order-store";
import { linkStyles } from "../../lib/link-styles";
import { useYakuCheatsheetModal } from "../use-yaku-cheatsheet-modal";
import { BreakdownPanel } from "./breakdown-panel";
import { DetailTable } from "./detail-table";
import type {
  YakuBreakdownProps,
  YakuBreakdownTableProps,
} from "@mahjong-scoring/features/results/breakdown-props";

/**
 * 翻数の内訳表示（web の `YakuBreakdown`）
 * 翻内訳表示
 *
 * 成立していた役とその翻数、合計を示す。並びは役選択練習の選択肢と同じ順
 * （{@link orderYakuDetails}）。文言は共通の `challenge.yakuBreakdown` から
 * 引く。器は点数系と同じ {@link BreakdownPanel}（既定で閉じる「内訳を確認」の
 * 入口）で、内訳が翻数だけなので切り替えは出ない。
 *
 * 早見表に載る役の名前は押せて、押すと役一覧のシートをその役で開く
 * （web と同じ）。開いた表の面（`surface`）は置く側が決める。
 */
export function YakuBreakdown({ surface, ...tableProps }: YakuBreakdownProps) {
  const t = useTranslations("challenge.scoreBreakdown");

  if (tableProps.yakuDetails.length === 0) return undefined;

  const total = sumYakuHan(tableProps.yakuDetails);

  return (
    <BreakdownPanel
      title={t("toggle")}
      surface={surface}
      sections={[
        {
          kind: "han",
          tabLabel: t("hanTab", { count: total }),
          content: <YakuBreakdownTable {...tableProps} />,
        },
      ]}
    />
  );
}

/**
 * 翻数の内訳の表（開閉の器なし。web の `YakuBreakdownTable`）
 * 翻内訳表
 *
 * 符の内訳と切り替えて出す場所（`ScoreBreakdownPanel`）では、開閉は
 * 置く側が持つので表だけを使う。
 */
export function YakuBreakdownTable({
  yakuDetails,
  note,
  conclusion,
  onOpenScoreTable,
}: YakuBreakdownTableProps) {
  const t = useTranslations("challenge.yakuBreakdown");
  const tChallenge = useTranslations("challenge");
  const yakuOrder = useYakuOrder();
  const yakuNames = useMemo(
    () => yakuDetails.map((detail) => detail.name),
    [yakuDetails],
  );
  const { canOpenYakuCheatsheet, openYakuCheatsheet, yakuCheatsheetModal } =
    useYakuCheatsheetModal(yakuNames);

  if (yakuDetails.length === 0) return undefined;

  const ordered = orderYakuDetails(yakuDetails, yakuOrder);
  const total = sumYakuHan(ordered);

  return (
    <>
      <DetailTable
        // 見出しは開閉の入口が持つため、表側の見出しは出さない
        rows={ordered.map((detail) => ({
          label: canOpenYakuCheatsheet(detail.name) ? (
            <Text
              onPress={() => openYakuCheatsheet(detail.name)}
              accessibilityRole="link"
              accessibilityHint={tChallenge("openInYakuList")}
              style={[styles.yakuLink, linkStyles.textButton]}
            >
              {detail.name}
            </Text>
          ) : (
            detail.name
          ),
          value: t("han", { count: detail.han }),
        }))}
        total={{ label: t("total"), value: t("han", { count: total }) }}
        conclusion={conclusion}
        note={note}
        answerLink={
          onOpenScoreTable === undefined
            ? undefined
            : {
                onPress: onOpenScoreTable,
                accessibilityHint: tChallenge("openInScoreTable"),
              }
        }
      />
      {yakuCheatsheetModal}
    </>
  );
}

const styles = StyleSheet.create({
  yakuLink: {
    fontSize: 14,
  },
});
