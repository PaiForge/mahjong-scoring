import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { panelFrame } from "../../lib/panel-styles";

/**
 * トレーニングの答え合わせの資料をまとめる面（web の `AnswerReviewPanel`）
 * 答え合わせ資料の面
 *
 * トレーニング・模試で止まっている間、盤面の末尾に出す「面子分解」の行と
 * 「内訳を確認」の入口を 1 枚の白い面（`panelFrame`）に入れる。直下には全幅の
 * 「次の問題へ」が続く。押せる行が面無しで並ぶと、行とボタンの境目は余白
 * だけになり、「内訳を確認」の文字を狙って下に落ちた指をボタンが受けて
 * 問題が進む（取り消せず、見ようとした内訳ごと手牌が消える）。枠の線が
 * 「ここまでが読む資料、ここからが進む操作」の境目を見せる。シェル側は
 * この面とボタンの間隔を一段広く取る（`TrainingShell`）。
 *
 * 中に置く内訳は `surface="sunken"` で沈める（白い枠を入れ子にしない。
 * `BreakdownPanel` 参照）。行の間に罫線は引かない — 面子分解を描かない手
 * （七対子・国士無双等）があり、子の有無をこの面からは知れないため
 * （web は `divide-y` が自動で省く）。上下の余白は行の当たり判定（44px）に
 * 4px を足すだけにして、閉じている間の丈を抑える。
 */
export function AnswerReviewPanel({
  children,
}: {
  readonly children: ReactNode;
}) {
  return <View style={styles.panel}>{children}</View>;
}

const styles = StyleSheet.create({
  panel: {
    ...panelFrame,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
