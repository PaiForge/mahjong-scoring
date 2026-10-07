import { View } from "react-native";

import { colors } from "../lib/theme";

/**
 * 内容のまとまりを区切る淡い実線（web の `Divider` = `border-t border-panel`）
 *
 * 一覧の行の間は一段淡い `row`（web の `divide-surface-100`）で区切る。
 */
export function Divider({
  tone = "panel",
}: {
  readonly tone?: "panel" | "row";
}) {
  return (
    <View
      style={{
        height: 1,
        alignSelf: "stretch",
        backgroundColor: tone === "panel" ? colors.panel : colors.surface100,
      }}
    />
  );
}
