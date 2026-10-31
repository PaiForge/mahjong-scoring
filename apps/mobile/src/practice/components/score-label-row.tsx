import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../lib/theme";
import { ScoreInputToggleButton } from "./score-input-toggle-button";

/**
 * 点数の欄のラベル行（web の `ScoreLabelRow`）
 * 点数のラベル行
 *
 * ラベルの右端に入力方式の切り替えボタン（{@link ScoreInputToggleButton}）を置く。
 * 点数の欄のすべての変種（`ScoreAnswerForm` の各分岐と和了形の点数計算の `ScoreField`）が
 * この行を使い、どの欄からでも方式を切り替えられるようにする。
 *
 * - **回答欄に置く理由:** 回答欄に無いと見つからない。web のゲストは設定ページ（会員限定）に
 *   入れないので回答欄が唯一の入口になり、入口を両プラットフォームで揃える。初回だけの
 *   ヒントやトーストは一度消えると二度と見つからないので採らない。「役」のラベル行に
 *   「役なし」を添える構造と同じ置き方なので、行は増えない
 * - **切り替えると欄の高さが変わり、下の「回答する / 次の問題へ」が一度動く。** これは
 *   許容している — 設定ページで方式を変えたときと同じ一回限りの動きで、タイル側の高さの
 *   確保（帯を切り替えても動かない）はそのまま
 */
export function ScoreLabelRow({
  label,
  disabled = false,
}: {
  readonly label: string;
  readonly disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <ScoreInputToggleButton disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface700,
  },
});
