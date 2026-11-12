import { Stack } from "expo-router";

import { stackScreenOptions } from "../../lib/stack-options";

/**
 * マイページ・設定・認証のスタック（モーダルの中）
 * アカウントのモーダル
 *
 * マイページ以下（`mypage/**`）・設定（`preferences/**`）・ログイン（`sign-in`）・
 * 登録（`sign-up/**`）・パスワードの再設定（`forgot-password`）・ランキング
 * （`leaderboard`）を 1 つのグループに集め、ルートのスタック
 * （`app/_layout.tsx`）から `presentation: "modal"` で出す。中はこのスタックで、
 * グループの中の画面どうしはモーダルを閉じずに積む（`router.push` のまま）。
 *
 * モーダルにする理由: iOS では、モーダルの後に積んだ通常の画面（card）は
 * モーダルの下に入って見えない（ネイティブのスタックはモーダルの列を push の
 * 列の上に提示する）。解答中の画面と結果は全画面のモーダルで、そこから開く画面
 * （ドラ表示の設定・ペイウォールのログイン / 登録 / プラン・ユーザー名の設定・
 * マイレコード）はすべてこの集まりに入る。これをモーダルにすれば解答中の上に
 * 重なり、閉じれば解答中へそのまま戻る。ホームのアバターから開くアカウントの
 * 画面をシートで出すのは iOS の定石でもある。
 *
 * 採らなかった案: 外へ出るたびに解答中を閉じる — 挑戦中のチャレンジを黙って
 * 捨てることになる。
 *
 * グループの中から外の通常の画面（練習の説明等）へ進むときは、上に重なった
 * モーダルをすべて閉じてから積む（`useOpenFromModal`）。閉じずに積むと
 * モーダルの下に入り、押しても何も起きないように見える。グループの先頭の画面の
 * 左は ×（`Screen` がモーダルのグループの先頭と判定して出す）、2 枚目からは
 * OS の戻る。タブの入口へ出る `useGoToTab` は `dismissTo` がモーダルごと閉じる。
 *
 * 画面の名前はこのスタックの中の名前（`sign-in`・`sign-up/index`・
 * `mypage/index` 等。グループ名は付かない）で、ルートのスタックでは
 * グループ全体が `(account)` の 1 枚になる。
 */
export default function AccountModalStack() {
  return <Stack screenOptions={stackScreenOptions} />;
}
