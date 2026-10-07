import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type {
  YakuSelectionJudgement,
  YakuSelectionState,
} from "@mahjong-scoring/core";
import { resolveYakuCheatsheetName } from "@mahjong-scoring/features/yaku/examples";

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
 * 早見表に例示手牌を持つ役のチップは押せて、押すと役一覧をその役で開く
 * （web と同じ）。
 */
export function YakuJudgementChips({
  judgements,
  emptyLabel,
  onSelect,
}: {
  readonly judgements: readonly YakuSelectionJudgement[];
  /** 表示する役が 1 つも無いときの代替テキスト */
  readonly emptyLabel: string;
  /**
   * 役を押したときの通知（役一覧をその役で開く）。渡すのは早見表の項目名で、
   * 「役牌 白」のような牌まで含んだ役名は「役牌」に寄せる。早見表に載らない
   * 役（状況役）は押せない
   */
  readonly onSelect?: (cheatsheetYakuName: string) => void;
}) {
  const t = useTranslations("score.result");
  const tChallenge = useTranslations("challenge");

  if (judgements.length === 0) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.list}>
      {judgements.map((judgement) => {
        const tone = YAKU_SELECTION_STYLES[judgement.state];
        const mark = CHIP_MARKS[judgement.state];
        const stateLabel = t(`yakuJudgement.${judgement.state}`);
        const cheatsheetName = resolveYakuCheatsheetName(judgement.name);
        const chip = (
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
        if (onSelect === undefined || cheatsheetName === undefined) return chip;
        return (
          <Pressable
            key={judgement.name}
            onPress={() => onSelect(cheatsheetName)}
            accessibilityRole="button"
            accessibilityHint={tChallenge("openInYakuList")}
            hitSlop={4}
            style={({ pressed }) => pressed && styles.pressed}
          >
            {chip}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.6,
  },
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
