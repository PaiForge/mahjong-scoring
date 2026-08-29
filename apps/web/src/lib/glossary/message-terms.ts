import messages from "@/messages/ja.json";

import { collectTermSlugs } from "./term-markup";

/**
 * 辞書のノードが子を持つか（オブジェクトか配列か）を判定する。
 * 走査は値の形だけを見るので、配列（`monthNames` など）も同じ入れ物として扱う。
 */
function hasChildren(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** ドット区切りのパスで辞書のノードを引く */
function resolveNode(path: string): unknown {
  let node: unknown = messages;
  for (const segment of path.split(".")) {
    if (!hasChildren(node)) return undefined;
    node = node[segment];
  }
  return node;
}

/** ノード配下の文字列をすべて訪ね、用語スラッグを集める */
function walk(node: unknown, into: Set<string>): void {
  if (typeof node === "string") {
    for (const slug of collectTermSlugs(node)) into.add(slug);
    return;
  }
  if (!hasChildren(node)) return;
  for (const child of Object.values(node)) walk(child, into);
}

/**
 * 辞書の名前空間配下が参照している用語スラッグを集める。
 * 名前空間の参照用語収集
 *
 * 章の本文はすべて辞書にあるため、名前空間ごと走査すれば、その章が
 * リンクしている用語は漏れなく集まる。ページ側が「この章で使う用語」を
 * 別に列挙する必要がなく、辞書に `[[slug]]` を足すだけでモーダルが開く。
 *
 * @param namespace ドット区切りの名前空間（例: "mentsuFu.learn"）
 * @returns 参照されている用語スラッグ（重複なし）。名前空間が無ければ空配列
 */
export function collectTermSlugsInNamespace(namespace: string): string[] {
  const slugs = new Set<string>();
  walk(resolveNode(namespace), slugs);
  return [...slugs];
}
