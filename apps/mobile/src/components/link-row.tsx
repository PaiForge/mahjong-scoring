import { createContext, useContext, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { linkStyles } from "../lib/link-styles";
import { panelFrame } from "../lib/panel-styles";
import { colors } from "../lib/theme";
import { Divider } from "./divider";
import { ChevronRightIcon } from "./icons/icons";

/**
 * 行が枠の中にあるか（枠の中では行の内側いっぱいを押したときの面にし、
 * 左右に余白を取る。枠の無いリストでは負のマージンで面を左右に広げつつ、
 * 文字の左端を隣の本文とそろえる）
 */
const LinkRowFramedContext = createContext(false);

interface LinkRowProps {
  readonly onPress: () => void;
  readonly title: string;
  readonly description?: string;
  readonly leading?: ReactNode;
  readonly trailing?: ReactNode;
  /** 読み上げの名前。省略時は行の中の文字をそのまま読む */
  readonly accessibilityLabel?: string;
  /** Maestro のフローで引く印 */
  readonly testID?: string;
}

/**
 * 読む・見るためのリンク 1 行（web の `LinkRow`）
 *
 * 太枠 + ハードシャドウは「押して始める面」の記号なので、見に行くだけの導線は
 * カードにせずこれを使う。押せることは行の形（右端の矢印と押したときの地の色）
 * で示し、題名は地の文と同じ濃さにする（`linkStyles.rowTitle`）。
 */
export function LinkRow({
  onPress,
  title,
  description,
  leading,
  trailing,
  accessibilityLabel,
  testID,
}: LinkRowProps) {
  const framed = useContext(LinkRowFramedContext);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        framed && styles.rowFramed,
        pressed && styles.pressed,
      ]}
    >
      {leading !== undefined && <View style={styles.side}>{leading}</View>}
      <View style={styles.body}>
        <Text style={[styles.title, linkStyles.rowTitle]}>{title}</Text>
        {description !== undefined && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>
      {trailing !== undefined && <View style={styles.side}>{trailing}</View>}
      {/* 右端の印（完了など）があっても矢印は残す。行全体が押せることを示すのは
          矢印で、印は状態を言うだけ（web と同じ） */}
      <View style={styles.side}>
        <ChevronRightIcon size={18} color={colors.surface400} />
      </View>
    </Pressable>
  );
}

/**
 * {@link LinkRow} を並べる枠（web の `LinkRowList`）
 *
 * 既定は細枠の白い面に行を並べ、行の間を淡い実線で区切る（iOS の「グループ化
 * された一覧」と同じ形）。影は持たない — 影は「押して始める面」の記号で、
 * 読みに行くだけの行には付けない。
 *
 * 既に枠を持つ面の内側（道場の級のカード）に置くときは `inset` を渡す。枠を
 * 重ねると入れ子の箱が増えるため、枠を持たず区切り線だけで並べ、行の文字の
 * 左端をカードの本文とそろえる。
 */
export function LinkRowList({
  children,
  inset = false,
}: {
  readonly children: ReactNode;
  /** 枠を持つ面の内側に置くとき true（枠を描かない） */
  readonly inset?: boolean;
}) {
  const items = Array.isArray(children) ? children.flat() : [children];
  const rows = items.filter(Boolean);
  return (
    <LinkRowFramedContext.Provider value={!inset}>
      <View style={inset ? undefined : panelFrame}>
        {rows.map((child, i) => (
          <View key={i}>
            {child}
            {i < rows.length - 1 && <Divider tone={inset ? "panel" : "row"} />}
          </View>
        ))}
      </View>
    </LinkRowFramedContext.Provider>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: -8,
    borderRadius: 14,
  },
  rowFramed: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 0,
    borderRadius: 0,
  },
  pressed: {
    backgroundColor: colors.surface50,
  },
  side: {
    minHeight: 20,
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
  },
  description: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: colors.surface500,
  },
});
