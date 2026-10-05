import { StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useTranslations } from "use-intl";
import { HaiKind, MentsuType } from "@mahjong-scoring/core";
import {
  DEMO_FU_CONTEXT,
  DEMO_FU_TEHAI,
} from "@mahjong-scoring/features/board/demo-tehai";
import { FU_OPTIONS } from "@mahjong-scoring/features/practice/fu-options";
import {
  findAgariHighlight,
  type AgariHighlightItem,
} from "@mahjong-scoring/features/practice/mentsu-jantou-fu/find-agari-highlight";

import { TehaiDisplay } from "../../../board/tehai-display";
import { Grid } from "../../../components/grid";
import { colors, radius } from "../../../lib/theme";
import { QuestionPrompt } from "../../components/question-prompt";
import { FuItemTiles } from "./fu-item-tiles";

/**
 * デモ用の固定例（{@link DEMO_FU_TEHAI}）の各要素
 * 234m / 567p / 中中中(暗刻) / 678s / 南南(雀頭)
 */
const DEMO_ITEMS: readonly AgariHighlightItem[] = [
  {
    id: "234m",
    tiles: [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4],
    type: MentsuType.Shuntsu,
    isOpen: false,
  },
  {
    id: "567p",
    tiles: [HaiKind.PinZu5, HaiKind.PinZu6, HaiKind.PinZu7],
    type: MentsuType.Shuntsu,
    isOpen: false,
  },
  {
    id: "chun",
    tiles: [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun],
    type: MentsuType.Koutsu,
    isOpen: false,
  },
  {
    id: "678s",
    tiles: [HaiKind.SouZu6, HaiKind.SouZu7, HaiKind.SouZu8],
    type: MentsuType.Shuntsu,
    isOpen: false,
  },
  {
    id: "nan",
    tiles: [HaiKind.Nan, HaiKind.Nan],
    type: "Pair",
    isOpen: false,
  },
];

/** デモの和了牌（七筒ツモ）を示す位置。出題盤面と同じ判定から求める */
const DEMO_AGARI_HIGHLIGHT = findAgariHighlight(
  DEMO_ITEMS,
  DEMO_FU_CONTEXT.agariHai,
);

/** 回答行を切る高さ（web の `max-h-80`）。2 要素分 + 3 要素目の牌が見える */
const ROWS_MAX_HEIGHT = 320;
/** 下端を背景へ溶かす帯の高さ（web のマスクの透明側 22%） */
const FADE_HEIGHT = ROWS_MAX_HEIGHT * 0.22;

/**
 * 面子と雀頭の符計算の「問題方式」ビジュアルデモ
 * 面子・雀頭符 遊び方デモ
 *
 * web の `MentsuJantouFuHowToPlay` の移植。実際の出題盤面（手牌の提示と
 * 要素ごとの符入力）を、出題時（未回答）のまま固定の手牌で静的に再現する。
 * 各行の体裁は盤面の `FuItemRow` の未入力時に合わせ、和了牌の枠も盤面と
 * 同じ判定（{@link findAgariHighlight}）から出す。
 *
 * 回答行は 5 要素すべてを並べると説明画面の本題である開始ボタンが画面外へ
 * 押し出されるため、3 要素目の途中で高さを切り、下端を背景（デモの枠の
 * `surface50`）へ溶かして「まだ続く」ことだけを見せる。
 */
export function MentsuJantouFuHowToPlay() {
  const t = useTranslations("mentsuJantouFu");

  return (
    <View style={styles.root}>
      <TehaiDisplay tehai={DEMO_FU_TEHAI} context={DEMO_FU_CONTEXT} />
      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>

      <View style={styles.clip}>
        <View style={styles.items}>
          {DEMO_ITEMS.map((item) => (
            <View key={item.id} style={styles.row}>
              <FuItemTiles
                item={item}
                highlightedTileIndex={
                  DEMO_AGARI_HIGHLIGHT?.itemId === item.id
                    ? DEMO_AGARI_HIGHLIGHT.tileIndex
                    : undefined
                }
              />
              <Grid columns={FU_OPTIONS.length} gap={6}>
                {FU_OPTIONS.map((fu) => (
                  <View key={fu} style={styles.option}>
                    <Text style={styles.optionLabel}>{fu}</Text>
                  </View>
                ))}
              </Grid>
            </View>
          ))}
        </View>
        <Svg style={styles.fade} width="100%" height={FADE_HEIGHT}>
          <Defs>
            <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.surface50} stopOpacity={0} />
              <Stop offset="1" stopColor={colors.surface50} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#fade)" />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
  clip: {
    maxHeight: ROWS_MAX_HEIGHT,
    overflow: "hidden",
  },
  items: {
    gap: 8,
  },
  row: {
    gap: 10,
    borderWidth: 1,
    borderColor: colors.surface200,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    padding: 12,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.surface200,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    paddingVertical: 10,
    alignItems: "center",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface600,
  },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
