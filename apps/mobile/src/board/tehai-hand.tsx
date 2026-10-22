import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { splitAgariHai } from "@mahjong-scoring/features/board/agari-hai";
import { presentTehai } from "@mahjong-scoring/features/board/hand-presentation";
import {
  AGARI_HAI_GAP,
  HAI_SM_HEIGHT,
  REFERENCE_HAND_WIDTH,
} from "@mahjong-scoring/features/board/hand-layout";

import { AutoScale } from "../components/auto-scale";
import { FuroTiles } from "./furo-tiles";
import { colors } from "../lib/theme";
import type { TehaiHandProps } from "@mahjong-scoring/features/board/tehai-hand-props";

/** 和了牌ラベルが牌の上に足す高さ（px） */
const AGARI_LABEL_HEIGHT = 12;

/**
 * 手牌の牌画像表示（純手牌 + 和了牌 + 副露 + 横幅自動縮小）
 * 手牌牌表示
 *
 * web の `TehaiHand` の移植。純手牌（既定は理牌した順。`presentation` で練習の盤面
 * だけ並べ直せる）を隙間なく並べ、間隔を空けて
 * 和了牌を右に置き（枠とツモ・ロンのラベル付き）、さらに広い間隔を空けて
 * 副露を並べる。行の高さは基準の手で固定し、広い手は行の中でさらに縮める。
 */
export const TehaiHand = memo(function TehaiHandComponent({
  tehai,
  agariHai,
  agariLabel,
  agariLabelTone = "dark",
  onScaleChange,
  presentation,
}: TehaiHandProps) {
  const presented = useMemo(
    () => presentTehai(splitAgariHai(tehai.closed, agariHai), presentation),
    [tehai.closed, agariHai, presentation],
  );

  return (
    <AutoScale
      referenceWidth={REFERENCE_HAND_WIDTH}
      naturalHeight={HAI_SM_HEIGHT + (agariLabel ? AGARI_LABEL_HEIGHT : 0)}
      onScaleChange={onScaleChange}
    >
      <View style={styles.group} pointerEvents="none">
        {presented.closed.map((tile, i) => (
          <Hai key={i} hai={tile.hai} size="sm" inverted={tile.inverted} />
        ))}
      </View>
      {presented.agari !== undefined && (
        <View style={styles.agari} pointerEvents="none">
          {agariLabel !== undefined && (
            <Text
              style={[
                styles.agariLabel,
                {
                  color:
                    agariLabelTone === "light"
                      ? colors.surface500
                      : "rgba(255,255,255,0.7)",
                },
              ]}
            >
              {agariLabel}
            </Text>
          )}
          <Hai
            hai={presented.agari.hai}
            size="sm"
            highlighted
            inverted={presented.agari.inverted}
          />
        </View>
      )}
      {tehai.exposed.length > 0 && (
        <View style={[styles.group, styles.exposed]} pointerEvents="none">
          {tehai.exposed.map((mentsu, i) => (
            <FuroTiles key={i} mentsu={mentsu} furo={mentsu.furo} size="sm" />
          ))}
        </View>
      )}
    </AutoScale>
  );
});

const styles = StyleSheet.create({
  group: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  agari: {
    marginLeft: AGARI_HAI_GAP,
    alignItems: "center",
  },
  agariLabel: {
    marginBottom: 2,
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 10,
  },
  exposed: {
    marginLeft: 32,
  },
});
