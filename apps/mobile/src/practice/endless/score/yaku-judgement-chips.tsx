import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type {
  YakuSelectionJudgement,
  YakuSelectionState,
} from "@mahjong-scoring/core";

import { colors, radius } from "../../../lib/theme";
import { YAKU_SELECTION_STYLES } from "../../yaku-selection-styles";

/**
 * 色だけに頼らず正誤が読めるようにチップへ添える記号。選び忘れは記号では
 * なく「選び忘れ」の語を添える（見落としが本題なので明示する）
 */
const CHIP_MARKS: Readonly<Record<YakuSelectionState, string | undefined>> = {
  correct: "✓",
  incorrect: "✗",
  missed: undefined,
};

/**
 * 役の答え合わせチップ列（web の `YakuJudgementChips`）
 * 役別判定チップ
 *
 * 役ごとに正誤を持たせる。1 つ余分に選んだだけで回答全体が赤くなると、
 * 合っていた役まで間違いに見えてしまうため。
 *
 * web は早見表に例示手牌を持つ役のチップを押すと役一覧を開くが、モバイルには
 * 役一覧が無いためチップは押せない。
 */
export function YakuJudgementChips({
  judgements,
  emptyLabel,
}: {
  readonly judgements: readonly YakuSelectionJudgement[];
  /** 表示する役が 1 つも無いときの代替テキスト */
  readonly emptyLabel: string;
}) {
  const t = useTranslations("score.result");

  if (judgements.length === 0) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.list}>
      {judgements.map((judgement) => {
        const tone = YAKU_SELECTION_STYLES[judgement.state];
        const mark = CHIP_MARKS[judgement.state];
        const stateLabel = t(`yakuJudgement.${judgement.state}`);
        return (
          <View
            key={judgement.name}
            style={[
              styles.chip,
              {
                borderColor: tone.borderColor,
                backgroundColor: tone.backgroundColor,
              },
            ]}
            accessible
            accessibilityLabel={`${judgement.name} ${stateLabel}`}
          >
            <Text style={[styles.name, { color: tone.color }]}>
              {judgement.name}
            </Text>
            <Text
              style={[
                mark === undefined ? styles.stateWord : styles.mark,
                { color: tone.color },
              ]}
            >
              {mark ?? stateLabel}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 4,
  },
  chip: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 4,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  name: {
    fontSize: 12,
  },
  mark: {
    fontSize: 12,
    fontWeight: "700",
  },
  stateWord: {
    fontSize: 10,
    fontWeight: "500",
  },
  empty: {
    textAlign: "right",
    fontSize: 14,
    color: colors.surface400,
  },
});
