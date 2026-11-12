import { Stack } from "expo-router";

import { stackScreenOptions } from "../../lib/stack-options";

/**
 * 解答中の画面と結果のスタック
 * セッションのモーダル
 *
 * @description
 * 練習のチャレンジ・トレーニング・結果（`practice/[slug]/{play,training,result}`）、
 * 無限訓練の盤面（`practice/{agari-score,tenpai-score}/play`）、昇級試験の本番・
 * 模試・結果（`exam/[exam]/{play,training,result}`）をまとめるグループ。URL は
 * グループ名を含まないので、移す前と変わらない。
 *
 * ルートのスタック（`app/_layout.tsx`）がこのグループを
 * `presentation: "fullScreenModal"` で下から全画面に出し、ヘッダー左の × で閉じる
 * （`useCloseSession`）。全画面のモーダルには端からの戻るスワイプが無いので、
 * 以前のように `gestureEnabled: false` でスワイプを切る必要が無い（スワイプの
 * 行き先が下の画面、× の行き先が説明画面と食い違うため切っていた）。
 *
 * 解答 → 結果・「もう一度」・トレーニング → チャレンジは、このモーダルの中の
 * スタックでの `replace` で行う。画面ごとに別のモーダルにしないのは、iOS で
 * モーダルを別のモーダルで置き換えると「閉じる → 出す」が続けて走り、その間に
 * 下の画面が見えるため。
 *
 * 採らなかった形: 通常の画面（card）を `slide_from_bottom` で出して
 * `gestureEnabled: false` を付ける形。見た目は近いが、スワイプを設定で切る形の
 * ままで、閉じる行き先も画面ごとに決め直すことになる。
 */
export default function SessionLayout() {
  return <Stack screenOptions={stackScreenOptions} />;
}
