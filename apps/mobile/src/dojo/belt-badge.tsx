import { StyleSheet, View } from "react-native";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";

import { BeltIcon } from "../components/icons/icons";
import { beltStyle } from "./belt-style";

const SIZES = {
  md: { circle: 48, icon: 24 },
  lg: { circle: 64, icon: 32 },
} as const;

/**
 * 段級位の帯バッジ（web の `BeltBadge`）
 * 帯バッジ
 *
 * 帯色で塗った円に帯アイコンを白抜きで載せる。無級は淡いグレーの円 +
 * グレーの紋章で「まだ色が付いていない」ことを示す。枠は付けない（帯色の
 * 円を別の色で縁取ると、その輪が帯の一部に見える）。
 */
export function BeltBadge({
  slug,
  size = "md",
}: {
  /** 表示する段級位。未取得（無級）なら undefined */
  readonly slug: RankSlug | undefined;
  readonly size?: keyof typeof SIZES;
}) {
  const { circle, icon } = SIZES[size];
  const belt = beltStyle(slug);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.circle,
        {
          width: circle,
          height: circle,
          borderRadius: circle / 2,
          backgroundColor: belt.fill,
        },
      ]}
    >
      <BeltIcon size={icon} color={belt.foreground} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
});
