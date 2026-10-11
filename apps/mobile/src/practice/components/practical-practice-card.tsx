import { Hai } from "@pai-forge/mahjong-react-ui";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { HaiKind } from "@mahjong-scoring/core";
import { DEMO_MENTSU_HAND } from "@mahjong-scoring/features/board/demo-score-question";
import { splitAgariHai } from "@mahjong-scoring/features/board/agari-hai";
import {
  AGARI_SCORE_PRACTICE_HREF,
  TENPAI_SCORE_PRACTICE_HREF,
} from "@mahjong-scoring/features/routes";

import { TehaiHand } from "../../board/tehai-hand";
import { PracticeEntryQuota } from "../quota/practice-entry-quota";
import { ChevronRightIcon } from "../../components/icons/icons";
import { panelFrame } from "../../lib/panel-styles";
import { colors, radius } from "../../lib/theme";

/** 三筒で和了するデモから 1 枚抜いた、三筒・六筒待ちの聴牌形（web と同じ） */
const TENPAI_TILES = splitAgariHai(
  DEMO_MENTSU_HAND.closed,
  DEMO_MENTSU_HAND.agariHai,
).closedTiles;

/** 聴牌形の点数計算のプレビューで並べる待ち牌 */
const WAIT_TILES = [HaiKind.PinZu3, HaiKind.PinZu6] as const;

/**
 * 実戦練習のカード（web の `AgariScorePracticeBanner` / `TenpaiScorePracticeBanner`）
 * 実戦練習カード
 *
 * 終わりのない訓練（和了形の点数計算・聴牌形の点数計算）の入口。卓と同じ濃い緑に出題の
 * 縮図（和了形と「何点？」/ 聴牌形と待ちごとのロン・ツモ）を描き、練習名と
 * 説明を添える。押すと説明画面へ移動するだけで練習は始まらないので、練習
 * カードと同じ細枠で影を持たない（web と同じ）。
 *
 * カードの下に今日の利用枠（{@link PracticeEntryQuota}）を出す（web と同じ）。
 * 回数制限が掛かるのは iOS で Pro を販売中のときだけで、それ以外は何も出さない。
 * 利用枠はカードの外に置く — ゲストの「ログインすると…」は押せる文字なので、
 * カード全体の当たり判定の中に入れない。
 */
export function PracticalPracticeCard({
  menu,
}: {
  readonly menu: "agari-score" | "tenpai-score";
}) {
  const t = useTranslations("practice");
  const router = useRouter();
  const isScore = menu === "agari-score";
  const key = isScore ? "agariScoreBanner" : "tenpaiScoreBanner";
  const href = isScore ? AGARI_SCORE_PRACTICE_HREF : TENPAI_SCORE_PRACTICE_HREF;
  const title = t(`${key}.title`);

  return (
    <View style={styles.entry}>
      <Pressable
        onPress={() => router.push(href)}
        accessibilityRole="link"
        accessibilityLabel={title}
        testID={`practical-practice-card-${menu}`}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View
          style={styles.preview}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <TehaiHand
            tehai={{
              closed: isScore ? DEMO_MENTSU_HAND.closed : TENPAI_TILES,
              exposed: [],
            }}
            agariHai={isScore ? DEMO_MENTSU_HAND.agariHai : undefined}
            agariLabel={isScore ? t("preview.tsumo") : undefined}
          />
          {isScore ? (
            <Text style={styles.previewText}>{t("preview.score")}</Text>
          ) : (
            <View style={styles.waits}>
              {WAIT_TILES.map((tile) => (
                <View key={tile} style={styles.wait}>
                  <Hai hai={tile} size="sm" alt="" />
                  <Text style={styles.waitText}>
                    {t("preview.ron")}
                    {"\n"}
                    {t("preview.tsumoScore")}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{t(`${key}.description`)}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.detail}>{t("detail")}</Text>
          <ChevronRightIcon size={16} color={colors.action} />
        </View>
      </Pressable>
      <PracticeEntryQuota menu={menu} />
    </View>
  );
}

const styles = StyleSheet.create({
  entry: {
    gap: 8,
  },
  card: {
    ...panelFrame,
    padding: 20,
    gap: 16,
  },
  pressed: {
    backgroundColor: colors.surface50,
  },
  preview: {
    minHeight: 160,
    overflow: "hidden",
    borderRadius: radius.lg,
    backgroundColor: colors.primary800,
    padding: 12,
    justifyContent: "center",
    gap: 16,
  },
  previewText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
  waits: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  wait: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  waitText: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 24,
    color: colors.white,
  },
  body: {
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.surface900,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface500,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  detail: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.action,
  },
});
