import { StyleSheet, View } from "react-native";

import { borderWidth } from "../lib/theme";

/**
 * 枠の内側に足す 1px の線（web の `ring-1 ring-inset`）
 * 内側の線
 *
 * 選択中のタイル・回答中のマスを、塗りだけに頼らず 2px の線で囲む。枠の幅
 * そのものは 1px のまま変えないので、選んでも中身が動かない。親の面に
 * `overflow: "hidden"` が無くても角に沿うよう、親の角丸から 1px 引いた
 * 角丸を渡す。
 */
export function InsetRing({
  color,
  borderRadius,
}: {
  readonly color: string;
  /** 親の面の角丸（枠の内側に合わせて 1px 引いて使う） */
  readonly borderRadius: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          borderWidth: borderWidth.panel,
          borderColor: color,
          borderRadius: Math.max(0, borderRadius - borderWidth.panel),
        },
      ]}
    />
  );
}
