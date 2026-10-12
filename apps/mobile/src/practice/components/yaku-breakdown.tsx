import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";
import type { YakuDetail } from "@mahjong-scoring/core";
import { sumYakuHan } from "@mahjong-scoring/core";
import { orderYakuDetails } from "@mahjong-scoring/features/results/order-yaku-details";

import { useYakuOrder } from "../../hooks/use-yaku-order-store";
import { linkStyles } from "../../lib/link-styles";
import { useYakuCheatsheetModal } from "../use-yaku-cheatsheet-modal";
import { BreakdownPanel } from "./breakdown-panel";
import { DetailTable } from "./detail-table";

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
 * （web と同じ）。
 */
export function YakuBreakdown(props: YakuBreakdownProps) {
  const t = useTranslations("challenge.scoreBreakdown");

  if (props.yakuDetails.length === 0) return undefined;

  const total = sumYakuHan(props.yakuDetails);

  return (
    <BreakdownPanel
      title={t("toggle")}
      sections={[
        {
          kind: "han",
          tabLabel: t("hanTab", { count: total }),
          content: <YakuBreakdownTable {...props} />,
        },
      ]}
    />
  );
}

interface YakuBreakdownProps {
  /** 役の内訳（ドラ・裏ドラを含む） */
  readonly yakuDetails: readonly YakuDetail[];
  /** 合計の後に効く丸めの補足（役満止まりなど）。持たない画面もある */
  readonly note?: string;
  /**
   * 合計がそのまま答えにならないときの答えの行（翻数即答の「13翻以上は 役満」）。
   * 符の内訳の「切り上げ後 40符」と同じく、合計の下に結論として据える
   */
  readonly conclusion?: { readonly label: string; readonly value: string };
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
}: YakuBreakdownProps & {
  /** 合計の翻数を押したときの処理。渡すとその値が点数表を開く */
  readonly onOpenScoreTable?: () => void;
}) {
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
