import { Fragment, useMemo, type ReactNode } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type {
  ListItem,
  Nodes,
  PhrasingContent,
  RootContent,
  Table,
} from "mdast";
import { parseAnnouncementMarkdown } from "@mahjong-scoring/features/announcements/markdown";

import { DataTable } from "../components/data-table";
import { Divider } from "../components/divider";
import { SectionTitle } from "../components/section-title";
import { SITE_URL } from "../lib/app-site-url";
import { linkStyles } from "../lib/link-styles";
import { colors, radius } from "../lib/theme";
import { resolveAnnouncementLink } from "./announcement-link";

/** 等幅の書体（iOS の標準。Android には無いので既定の monospace に落ちる） */
const MONOSPACE = "Menlo";

/** リンクを開く（`resolveAnnouncementLink` の開き先で分ける） */
type OpenLink = (href: string) => void;

/**
 * お知らせの本文（web の `MarkdownRenderer`）
 * お知らせ本文
 *
 * 本文の Markdown を features の `parseAnnouncementMarkdown`（web と同じ
 * micromark + GFM の解釈）で構文木にし、節点の種類ごとにネイティブの部品で
 * 描く。HTML は描かない。先頭の h1 は画面の見出しと重なるので落とす
 * （web の `skipFirstH1`）。
 *
 * web と違うもの: h2 は web と同じ `SectionTitle`、本文の文字は 16pt
 * （`apps/mobile/CLAUDE.md` の方針）。本文のリンクは、アプリに同じ画面が
 * あればアプリの中で、無ければブラウザで開く（`resolveAnnouncementLink`）。
 */
export function MarkdownBody({ content }: { readonly content: string }) {
  const router = useRouter();
  const tree = useMemo(() => parseAnnouncementMarkdown(content), [content]);
  const openLink: OpenLink = (href) => {
    const target = resolveAnnouncementLink(href, SITE_URL);
    if (target.kind === "app") {
      router.push(target.path);
    } else {
      void Linking.openURL(target.url);
    }
  };
  return <Blocks nodes={tree.children} openLink={openLink} />;
}

/** ブロックの並び */
function Blocks({
  nodes,
  openLink,
  muted = false,
}: {
  readonly nodes: readonly RootContent[];
  readonly openLink: OpenLink;
  /** 引用の中（文字を一段淡くする） */
  readonly muted?: boolean;
}) {
  return (
    <View style={styles.blocks}>
      {nodes.map((node, index) => (
        <Fragment key={index}>{renderBlock(node, openLink, muted)}</Fragment>
      ))}
    </View>
  );
}

function renderBlock(
  node: RootContent,
  openLink: OpenLink,
  muted: boolean,
): ReactNode {
  switch (node.type) {
    case "paragraph":
      return (
        <Text style={[styles.paragraph, muted && styles.muted]}>
          {renderInlines(node.children, openLink)}
        </Text>
      );
    case "heading":
      if (node.depth === 2) {
        return <SectionTitle>{plainText(node)}</SectionTitle>;
      }
      return (
        <Text
          accessibilityRole="header"
          style={node.depth === 1 ? styles.heading1 : styles.heading3}
        >
          {renderInlines(node.children, openLink)}
        </Text>
      );
    case "list":
      return (
        <View style={styles.list}>
          {node.children.map((item, index) => (
            <ListRow
              key={index}
              item={item}
              marker={
                node.ordered === true ? `${(node.start ?? 1) + index}.` : "•"
              }
              openLink={openLink}
              muted={muted}
            />
          ))}
        </View>
      );
    case "blockquote":
      return (
        <View style={styles.blockquote}>
          <Blocks nodes={node.children} openLink={openLink} muted />
        </View>
      );
    case "code":
      return (
        <View style={styles.codeBlock}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={styles.codeBlockText}>{node.value}</Text>
          </ScrollView>
        </View>
      );
    case "thematicBreak":
      return <Divider />;
    case "table":
      return <MarkdownTable table={node} openLink={openLink} />;
    default:
      // 生の HTML・定義・脚注などは描かない（web の react-markdown も既定で描かない）
      return null;
  }
}

/** 箇条書きの 1 項目。印の右に項目の中身（段落・入れ子の箇条書き）を並べる */
function ListRow({
  item,
  marker,
  openLink,
  muted,
}: {
  readonly item: ListItem;
  readonly marker: string;
  readonly openLink: OpenLink;
  readonly muted: boolean;
}) {
  return (
    <View style={styles.listRow}>
      <Text style={[styles.paragraph, styles.marker, muted && styles.muted]}>
        {marker}
      </Text>
      <View style={styles.listBody}>
        <Blocks nodes={item.children} openLink={openLink} muted={muted} />
      </View>
    </View>
  );
}

/** GFM の表。先頭の行を見出しにして `DataTable` で描く */
function MarkdownTable({
  table,
  openLink,
}: {
  readonly table: Table;
  readonly openLink: OpenLink;
}) {
  const [header, ...body] = table.children;
  if (header === undefined) return null;
  return (
    <DataTable
      columns={header.children.map((cell, index) => ({
        label: plainText(cell),
        align: table.align?.[index] ?? undefined,
      }))}
      rows={body.map((row) =>
        row.children.map((cell, index) => (
          <Text key={index} style={styles.cell}>
            {renderInlines(cell.children, openLink)}
          </Text>
        )),
      )}
    />
  );
}

/** 段落の中の文字列（太字・リンク等を入れ子の Text にする） */
function renderInlines(
  nodes: readonly PhrasingContent[],
  openLink: OpenLink,
): ReactNode {
  return nodes.map((node, index) => {
    switch (node.type) {
      case "text":
        return node.value;
      case "strong":
        return (
          <Text key={index} style={styles.strong}>
            {renderInlines(node.children, openLink)}
          </Text>
        );
      case "emphasis":
        return (
          <Text key={index} style={styles.emphasis}>
            {renderInlines(node.children, openLink)}
          </Text>
        );
      case "delete":
        return (
          <Text key={index} style={styles.delete}>
            {renderInlines(node.children, openLink)}
          </Text>
        );
      case "inlineCode":
        return (
          <Text key={index} style={styles.inlineCode}>
            {node.value}
          </Text>
        );
      case "link":
        return (
          <Text
            key={index}
            accessibilityRole="link"
            onPress={() => openLink(node.url)}
            style={linkStyles.inline}
          >
            {renderInlines(node.children, openLink)}
          </Text>
        );
      case "break":
        return "\n";
      default:
        // 画像・生の HTML・脚注の参照は描かない
        return null;
    }
  });
}

/** 節点の中の文字だけをつなげる（見出しの文字・表の列名） */
function plainText(node: Nodes): string {
  if ("value" in node && typeof node.value === "string") return node.value;
  if ("children" in node) {
    return node.children.map((child: Nodes) => plainText(child)).join("");
  }
  return "";
}

const styles = StyleSheet.create({
  blocks: {
    gap: 16,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 28,
    color: colors.surface700,
  },
  muted: {
    color: colors.surface600,
  },
  heading1: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "700",
    color: colors.surface900,
  },
  heading3: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface900,
  },
  list: {
    gap: 6,
  },
  listRow: {
    flexDirection: "row",
    gap: 8,
  },
  marker: {
    minWidth: 16,
  },
  listBody: {
    flex: 1,
    minWidth: 0,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: colors.panel,
    paddingLeft: 14,
  },
  codeBlock: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface900,
    padding: 16,
  },
  codeBlockText: {
    fontFamily: MONOSPACE,
    fontSize: 14,
    lineHeight: 22,
    color: colors.surface50,
  },
  cell: {
    fontSize: 14,
    color: colors.surface700,
  },
  strong: {
    fontWeight: "700",
    color: colors.surface900,
  },
  emphasis: {
    fontStyle: "italic",
  },
  delete: {
    textDecorationLine: "line-through",
  },
  inlineCode: {
    fontFamily: MONOSPACE,
    fontSize: 14,
    backgroundColor: colors.surface100,
    color: colors.surface800,
  },
});
