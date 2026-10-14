import { StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";
import { resolveYakuCheatsheetName } from "@mahjong-scoring/features/yaku/examples";

import { linkStyles } from "../../../lib/link-styles";
import { DetailTable } from "../../components/detail-table";

/** 内訳の 1 行（役名と翻数 / 符の理由と符） */
export interface DetailItem {
  readonly name: string;
  readonly value: number;
}

/**
 * 答え合わせの内訳の表（web の `ResultBreakdownTable`）
 * 符詳細・役詳細の表
 *
 * 翻数・符の内訳の行と合計を {@link DetailTable} で並べる。開閉と切り替えは
 * 置く側の `BreakdownPanel` が持つ。符の切り上げは合計の下に「切り上げ後 40符」
 * として据える（理由は {@link DetailTable} の `conclusion`）。
 *
 * 翻数の内訳の役名は、ほかの練習の翻数の内訳（`YakuBreakdown`）と同じく
 * 押すと役一覧がその役で開く。表の「役」の行の役チップは役も答える設定の
 * ときにしか出ないため、既定の設定ではここが役一覧を役の位置で開く導線になる。
 */
export function ResultBreakdownTable({
  items,
  total,
  suffix,
  roundedTotal,
  onOpenScoreTable,
  onOpenYakuList,
}: {
  readonly items: readonly DetailItem[];
  /** 内訳の合計（切り上げの前） */
  readonly total: number;
  /** 値の単位（「翻」「符」） */
  readonly suffix: string;
  /** 切り上げた後の値（符の正解）。合計と同じなら切り上げの行を出さない */
  readonly roundedTotal?: number;
  /**
   * 答えの値（切り上げ後、切り上げが無ければ合計）を押したときの処理。
   * 渡すとその値が点数表を開く（{@link DetailTable} の `answerLink`）
   */
  readonly onOpenScoreTable?: () => void;
  /**
   * 役名を押したときの処理（翻数の内訳だけで渡す）。渡すと早見表に載る役の
   * 行の役名が押せる文字になる。状況役・ドラは一覧に無いため文字のまま
   */
  readonly onOpenYakuList?: (yakuName: string) => void;
}) {
  const t = useTranslations("agariScore");
  const tChallenge = useTranslations("challenge");
  const withSuffix = (value: number) => `${value}${suffix}`;
  const itemLabel = (name: string) =>
    onOpenYakuList !== undefined &&
    resolveYakuCheatsheetName(name) !== undefined ? (
      <Text
        onPress={() => onOpenYakuList(name)}
        accessibilityRole="link"
        accessibilityHint={tChallenge("openInYakuList")}
        style={[styles.yakuLink, linkStyles.textButton]}
      >
        {name}
      </Text>
    ) : (
      name
    );

  return (
    <DetailTable
      rows={items.map((detail) => ({
        label: itemLabel(detail.name),
        value: withSuffix(detail.value),
      }))}
      total={{
        label: t("result.details.total"),
        value: withSuffix(total),
      }}
      conclusion={
        roundedTotal !== undefined && total !== roundedTotal
          ? {
              label: t("result.details.roundedUp"),
              value: withSuffix(roundedTotal),
            }
          : undefined
      }
      answerLink={
        onOpenScoreTable === undefined
          ? undefined
          : {
              onPress: onOpenScoreTable,
              accessibilityHint: t("result.openInScoreTable"),
            }
      }
    />
  );
}

const styles = StyleSheet.create({
  // 行見出しの文字の大きさ（DetailTable）に揃える。翻数の内訳（YakuBreakdown）と同じ
  yakuLink: {
    fontSize: 14,
  },
});
