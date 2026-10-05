import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../lib/theme";
import { TermText } from "./term-text";

/** 本文の行間（web の `leading-relaxed` を 14px の本文に当てた値） */
const RELAXED_LINE_HEIGHT = 24;

/**
 * 本文の中身。辞書の文字列ならそのまま用語マークアップを解く
 *
 * 改行（`\n`）はそのまま改行として出す。web は改行を保つ段落にだけ
 * `whitespace-pre-line` を付けるが、改行を含む文言はどれもその段落なので、
 * 常に保つ形で同じ見た目になる。
 */
function renderBody(children: ReactNode): ReactNode {
  return typeof children === "string" ? (
    <TermText>{children}</TermText>
  ) : (
    children
  );
}

/**
 * 教本本文の段落（web の `GuideParagraph`）
 * 教本段落
 *
 * 辞書の文字列をそのまま渡した場合は用語マークアップ（`[[slug|表示語]]`）を
 * 解く。`t.rich` の結果（章へのリンク・改行を含む）はそのまま描く。
 */
export function GuideParagraph({ children }: { readonly children: ReactNode }) {
  return <Text style={styles.paragraph}>{renderBody(children)}</Text>;
}

/**
 * 教本本文の注記（web の `GuideNote`）
 * 教本注記
 *
 * 本文より一段トーンを落とした補足。「※」のような行頭記号は辞書側が持つ。
 */
export function GuideNote({ children }: { readonly children: ReactNode }) {
  return <Text style={styles.note}>{renderBody(children)}</Text>;
}

/**
 * 教本の番号リスト（web の `GuideOrderedList`）
 *
 * 導入で、これから述べる小見出し（{@link GuideSubsectionTitle}）を番号付きで
 * 先に並べる。
 */
export function GuideOrderedList({
  items,
}: {
  readonly items: readonly string[];
}) {
  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.listMarker}>{`${index + 1}.`}</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * 教本の点付きリスト（web の `list-disc` の `<ul>`）
 */
export function GuideBulletList({
  items,
}: {
  readonly items: readonly string[];
}) {
  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.listMarker}>{"•"}</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * 教本の小見出し（web の `GuideSubsectionTitle`）
 *
 * 緑の丸バッジ + 素のテキストで、節の見出し（pill）より一段下の階層に見せる。
 * 番号を渡すと導入の番号リストと見出しが番号で対応する。
 */
export function GuideSubsectionTitle({
  number,
  children,
}: {
  readonly number?: number;
  readonly children: string;
}) {
  return (
    <View style={styles.subsection}>
      {number !== undefined && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{number}</Text>
        </View>
      )}
      <Text accessibilityRole="header" style={styles.subsectionText}>
        {children}
      </Text>
    </View>
  );
}

/**
 * 表・図の上に置く小さな見出し（web の `text-xs font-semibold uppercase
 * tracking-wider text-surface-400` の h3）
 * 表題
 */
export function TableCaption({ children }: { readonly children: string }) {
  return <Text style={styles.caption}>{children}</Text>;
}

const styles = StyleSheet.create({
  paragraph: {
    fontSize: 14,
    lineHeight: RELAXED_LINE_HEIGHT,
    color: colors.surface700,
  },
  note: {
    fontSize: 14,
    lineHeight: RELAXED_LINE_HEIGHT,
    color: colors.surface500,
  },
  list: {
    gap: 4,
  },
  listItem: {
    flexDirection: "row",
    gap: 8,
    paddingLeft: 8,
  },
  listMarker: {
    minWidth: 16,
    fontSize: 14,
    lineHeight: RELAXED_LINE_HEIGHT,
    color: colors.surface700,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    lineHeight: RELAXED_LINE_HEIGHT,
    color: colors.surface700,
  },
  subsection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary500,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
  subsectionText: {
    flex: 1,
    paddingTop: 2,
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface900,
  },
  caption: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: colors.surface400,
  },
});
