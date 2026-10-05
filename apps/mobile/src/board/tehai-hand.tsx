import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Hai } from "@pai-forge/mahjong-react-ui";
import type { HaiKindId, Tehai } from "@mahjong-scoring/core";
import { splitAgariHai } from "@mahjong-scoring/features/board/agari-hai";

import { AutoScale } from "../components/auto-scale";
import { FuroTiles } from "./furo-tiles";
import { colors } from "../lib/theme";

/** size="sm" の牌の高さ（px）。ライブラリの `sm` の寸法 */
export const HAI_SM_HEIGHT = 45;
/** size="sm" の牌の幅（px） */
const HAI_SM_WIDTH = 32;
/** 和了牌ラベルが牌の上に足す高さ（px） */
const AGARI_LABEL_HEIGHT = 12;
/** 和了牌を純手牌から離す間隔（px） */
const AGARI_GAP = 16;

/**
 * 行の高さの基準にする手の自然幅（px）
 * 基準手牌幅
 *
 * 門前の 13 枚に間隔を空けて和了牌を置いた並び（web の `REFERENCE_HAND_WIDTH`）。
 */
export const REFERENCE_HAND_WIDTH =
  13 * HAI_SM_WIDTH + AGARI_GAP + HAI_SM_WIDTH;

interface TehaiHandProps {
  /** 表示する手牌（純手牌 + 副露） */
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  /** 和了牌。渡すと純手牌から 1 枚抜き、間隔を空けて右側に開示する */
  readonly agariHai?: HaiKindId;
  /** 和了牌に添えるラベル（「ツモ」「ロン」） */
  readonly agariLabel?: string;
  /** 和了ラベルを載せる面の明暗（既定は濃い出題盤面） */
  readonly agariLabelTone?: "dark" | "light";
  /** 自動縮小の倍率の通知（状況行のドラ牌を同じ倍率に揃える） */
  readonly onScaleChange?: (scale: number) => void;
}

/**
 * 手牌の牌画像表示（純手牌 + 和了牌 + 副露 + 横幅自動縮小）
 * 手牌牌表示
 *
 * web の `TehaiHand` の移植。理牌した純手牌を隙間なく並べ、間隔を空けて
 * 和了牌を右に置き（枠とツモ・ロンのラベル付き）、さらに広い間隔を空けて
 * 副露を並べる。行の高さは基準の手で固定し、広い手は行の中でさらに縮める。
 */
export const TehaiHand = memo(function TehaiHandComponent({
  tehai,
  agariHai,
  agariLabel,
  agariLabelTone = "dark",
  onScaleChange,
}: TehaiHandProps) {
  const { closedTiles, separatedAgariHai } = useMemo(
    () => splitAgariHai(tehai.closed, agariHai),
    [tehai.closed, agariHai],
  );

  return (
    <AutoScale
      referenceWidth={REFERENCE_HAND_WIDTH}
      naturalHeight={HAI_SM_HEIGHT + (agariLabel ? AGARI_LABEL_HEIGHT : 0)}
      onScaleChange={onScaleChange}
    >
      <View style={styles.group} pointerEvents="none">
        {closedTiles.map((kindId, i) => (
          <Hai key={i} hai={kindId} size="sm" />
        ))}
      </View>
      {separatedAgariHai !== undefined && (
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
          <Hai hai={separatedAgariHai} size="sm" highlighted />
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
    marginLeft: AGARI_GAP,
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
