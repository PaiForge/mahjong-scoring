import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import type { HaiKindId } from "@mahjong-scoring/core";

import { Tile } from "../../../components/tile";
import { colors } from "../../../lib/theme";
import { PromptLabel } from "../../components/prompt-label";

/**
 * 待ち符の出題提示（待ち牌 + 和了牌）
 * 待ち符出題提示
 *
 * web の `MachiFuPrompt` の移植。出題盤面と結果の問題別一覧で共有する、
 * 待ち形の「見せ方」の単一実装。web は md の牌を 1.25 倍に拡大しているので、
 * ここではそれに近い lg の牌で描く。
 */
export function MachiFuPrompt({
  tiles,
  agariHai,
}: {
  /** 待ちの形を作る牌 */
  readonly tiles: readonly HaiKindId[];
  /** 和了牌 */
  readonly agariHai: HaiKindId;
}) {
  const t = useTranslations("machiFu");

  return (
    <View style={styles.root}>
      <View style={styles.group}>
        <PromptLabel>{t("machiLabel")}</PromptLabel>
        <View style={styles.tiles}>
          {tiles.map((tile, i) => (
            <Tile key={i} hai={tile} size="lg" />
          ))}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.group}>
        <PromptLabel>{t("agariLabel")}</PromptLabel>
        <Tile hai={agariHai} size="lg" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    gap: 16,
  },
  group: {
    alignItems: "center",
    gap: 8,
  },
  tiles: {
    flexDirection: "row",
    gap: 2,
  },
  divider: {
    alignSelf: "stretch",
    height: 1,
    backgroundColor: colors.surface100,
  },
});
