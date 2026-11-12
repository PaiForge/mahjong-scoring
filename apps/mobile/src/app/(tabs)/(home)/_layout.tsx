import { Stack } from "expo-router";

import { stackScreenOptions } from "../../../lib/stack-options";

/**
 * ホームのタブのスタック
 *
 * 入口の 1 画面だけを持つ。OS のヘッダー（左寄せの見出し・透ける帯）は
 * ネイティブスタックのものなので、タブの入口に出すためにタブごとに 1 段
 * スタックを入れる。詳細の画面はここではなくルートのスタックに積む
 * （`app/(tabs)/_layout.tsx`）。
 */
export default function HomeTabStack() {
  return <Stack screenOptions={stackScreenOptions} />;
}
