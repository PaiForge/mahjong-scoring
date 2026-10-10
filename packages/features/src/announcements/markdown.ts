import type { Root } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";

/**
 * お知らせの本文（Markdown）を構文木（mdast）にする
 * お知らせ本文解析
 *
 * web の詳細ページ（react-markdown + remark-gfm）と同じ解釈 — どちらも
 * micromark と GFM の拡張（表・打ち消し線・自動リンク・タスクリスト）で読む。
 * アプリは返した木を節点の種類ごとにネイティブの部品で描く。HTML として
 * 描かないので、本文中の生の HTML（`html` 節点）は描かれない（web の
 * react-markdown も既定で描かない）。
 *
 * 先頭の h1 は取り除く。画面が見出しにタイトルを出すので、本文がタイトルを
 * 繰り返す書き方の記事で 2 回並ばないようにする（web の `skipFirstH1`）。
 *
 * @param content - お知らせの本文
 */
export function parseAnnouncementMarkdown(content: string): Root {
  const tree = fromMarkdown(content, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
  const index = tree.children.findIndex(
    (node) => node.type === "heading" && node.depth === 1,
  );
  return index === -1
    ? tree
    : { ...tree, children: tree.children.filter((_, i) => i !== index) };
}
