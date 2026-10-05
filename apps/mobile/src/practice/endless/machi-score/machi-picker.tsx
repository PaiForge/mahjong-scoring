import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { HaiKind, haiIdToMspz } from "@mahjong-scoring/core";
import type { HaiKindId, MachiSelectionJudgement } from "@mahjong-scoring/core";
import {
  machiTileMark,
  type MachiTileMark,
} from "@mahjong-scoring/features/practice/machi-score/machi-tile-mark";

import { Grid } from "../../../components/grid";
import { PressableSurface } from "../../../components/pressable-surface";
import { Tile } from "../../../components/tile";
import { colors, radius } from "../../../lib/theme";
import { MACHI_TILE_MARK_STYLES } from "./machi-tile-mark-styles";

/**
 * 牌種を種類ごとに並べた選択肢の行
 * 牌の行
 *
 * 数牌は 1〜9、字牌は東南西北白發中の順。牌種 ID は種類ごとに連番なので
 * 先頭の ID から 9 つ（字牌は 7 つ）を並べる。
 */
const TILE_ROWS = [
  { key: "manzu", from: HaiKind.ManZu1, count: 9 },
  { key: "pinzu", from: HaiKind.PinZu1, count: 9 },
  { key: "souzu", from: HaiKind.SouZu1, count: 9 },
  { key: "jihai", from: HaiKind.Ton, count: 7 },
] as const;

/** 行の牌種 ID を列挙する（ID は連番なので範囲で拾う） */
function tilesOf(row: (typeof TILE_ROWS)[number]): readonly HaiKindId[] {
  return Object.values(HaiKind).filter(
    (id) => id >= row.from && id < row.from + row.count,
  );
}

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
  const t = useTranslations("machiScore.machi");
  const judged = judgement !== undefined;

  return (
    <View style={styles.rows}>
      {TILE_ROWS.map((row) => (
        <View key={row.key} accessibilityLabel={t(`suits.${row.key}`)}>
          <Grid columns={9} gap={4}>
            {tilesOf(row).map((hai) => {
              const isSelected = selected.includes(hai);
              const mark = machiTileMark(hai, isSelected, judgement);
              return (
                <PressableSurface
                  key={hai}
                  onPress={() => onToggle(hai)}
                  disabled={judged}
                  accessibilityLabel={haiIdToMspz(hai)}
                  accessibilityState={{ selected: isSelected }}
                  testID={`machi-tile-${hai}`}
                  style={[styles.tile, tileStyle(isSelected, mark, judged)]}
                >
                  <Tile hai={hai} size="xs" />
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
