import { Hai } from "@pai-forge/mahjong-react-ui";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { HaiKindId } from "@mahjong-scoring/core";

import { colors, radius } from "../../lib/theme";
import { lessonColors } from "../lesson-colors";

/**
 * 例示カード（web の `ExampleCard` = 白背景・角丸・細枠）
 * 例示カード
 */
export function ExampleCard({
  children,
  gap = 12,
}: {
  readonly children: ReactNode;
  readonly gap?: number;
}) {
  return <View style={[styles.card, { gap }]}>{children}</View>;
}

/** 注釈の意味づけと色（正しい結果 / 間違えやすく注意を促したい結果） */
const ANNOTATION_TONE_COLOR = {
  result: colors.primary600,
  caution: lessonColors.amber600,
} as const;

/**
 * 手牌の符の例（牌の並び ＋ 説明 ＋ 結論）（web の `TehaiFuExample`）
 * 手牌符例
 */
export function TehaiFuExample({
  tiles,
  agariHai,
  rotatedIndex,
  label,
  annotation,
  annotationTone = "result",
}: {
  readonly tiles: readonly HaiKindId[];
  readonly agariHai?: HaiKindId;
  readonly rotatedIndex?: number;
  readonly label: string;
  readonly annotation?: string;
  readonly annotationTone?: keyof typeof ANNOTATION_TONE_COLOR;
}) {
  return (
    <View style={styles.example}>
      <View style={styles.tilesRow}>
        <View style={styles.tiles}>
          {tiles.map((tile, i) => (
            <Hai key={i} hai={tile} rotated={i === rotatedIndex} />
          ))}
        </View>
        {agariHai !== undefined && (
          <>
            <Text style={styles.plus}>+</Text>
            <Hai hai={agariHai} />
          </>
        )}
      </View>
      <View style={styles.texts}>
        <Text style={styles.label}>{label}</Text>
        {annotation !== undefined && (
          <Text
            style={[
              styles.annotation,
              { color: ANNOTATION_TONE_COLOR[annotationTone] },
            ]}
          >
            {annotation}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.panel,
    borderRadius: radius.panel,
    backgroundColor: colors.white,
    padding: 20,
  },
  example: {
    gap: 8,
  },
  tilesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tiles: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  plus: {
    fontSize: 12,
    color: colors.surface400,
  },
  texts: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 2,
  },
  label: {
    fontSize: 14,
    color: colors.surface600,
  },
  annotation: {
    fontSize: 14,
    fontWeight: "600",
  },
});
