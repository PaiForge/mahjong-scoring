import { Stack } from "expo-router";

import { stackScreenOptions } from "../../../lib/stack-options";

/**
 * 道場のタブのスタック
 *
 * 入口の 1 画面だけを持つ。OS のヘッダー（大きな見出し・透ける帯）は
 * ネイティブスタックのものなので、タブの入口に出すためにタブごとに 1 段
 * スタックを入れる。詳細の画面はここではなくルートのスタックに積む
 * （`app/(tabs)/_layout.tsx`）。
 */
export default function DojoTabStack() {
  return <Stack screenOptions={stackScreenOptions} />;
}
