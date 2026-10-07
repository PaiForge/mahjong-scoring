import { Hai } from "@pai-forge/mahjong-react-ui";
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { haiIdToMpsz } from "@mahjong-scoring/core";
import type { HaiKindId, MachiSelectionJudgement } from "@mahjong-scoring/core";
import {
  machiTileMark,
  type MachiTileMark,
} from "@mahjong-scoring/features/practice/tenpai-score/machi-tile-mark";
import { MACHI_PICKER_ROWS } from "@mahjong-scoring/features/practice/tenpai-score/picker-rows";

import { Grid } from "../../../components/grid";
import { PressableSurface } from "../../../components/pressable-surface";
import { colors, radius } from "../../../lib/theme";
import { MACHI_TILE_MARK_STYLES } from "./machi-tile-mark-styles";

/** 牌の枠と背景（判定前は選択、判定後は正誤の配色。web の `tileClasses`） */
function tileStyle(
  selected: boolean,
  mark: MachiTileMark | undefined,
  judged: boolean,
) {
  if (!judged) return selected ? styles.selected : styles.idle;
  return mark ? MACHI_TILE_MARK_STYLES[mark] : [styles.idle, styles.dimmed];
}

/**
 * 待ち牌を選ぶ 34 種の牌の一覧（web の `MachiPicker`）
 * 待ち牌選択
 *
 * 種類ごとに 1 行、9 列がそのまま収まるよう牌を小さく出す。押せる面なので
 * 太枠 + ハードシャドウ + 押し込み。判定後は牌ごとに枠の色で「正解（緑）/
 * 待ちではない（赤）/ 見落とし（緑の破線）」を示し、押せなくする。
 * 文字は添えない — 牌の下に 1 行足すと判定の瞬間に下のボタンがずれる。
 */
export const MachiPicker = memo(function MachiPickerComponent({
  selected,
  onToggle,
  judgement,
}: {
  readonly selected: readonly HaiKindId[];
  readonly onToggle: (hai: HaiKindId) => void;
  /** 回答後の判定。渡すと正誤の配色で描き、押せなくする */
  readonly judgement?: MachiSelectionJudgement;
}) {
  const t = useTranslations("tenpaiScore.machi");
  const judged = judgement !== undefined;

  return (
    <View style={styles.rows}>
      {MACHI_PICKER_ROWS.map((row) => (
        <View key={row.key} accessibilityLabel={t(`suits.${row.key}`)}>
          <Grid columns={9} gap={4}>
            {row.tiles.map((hai) => {
              const isSelected = selected.includes(hai);
              const mark = machiTileMark(hai, isSelected, judgement);
              return (
                <PressableSurface
                  key={hai}
                  onPress={() => onToggle(hai)}
                  disabled={judged}
                  accessibilityLabel={haiIdToMpsz(hai)}
                  accessibilityState={{ selected: isSelected }}
                  testID={`machi-tile-${hai}`}
                  style={[styles.tile, tileStyle(isSelected, mark, judged)]}
                >
                  <Hai hai={hai} size="xs" />
                </PressableSurface>
              );
            })}
          </Grid>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  rows: {
    gap: 8,
  },
  tile: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: radius.md,
    paddingVertical: 4,
    overflow: "hidden",
  },
  idle: {
    borderColor: colors.ink,
    backgroundColor: colors.white,
  },
  selected: {
    borderColor: colors.primary500,
    backgroundColor: colors.primary50,
  },
  dimmed: {
    opacity: 0.4,
  },
});
