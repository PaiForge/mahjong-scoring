// 辞書のテスト（`en.test.ts`・`translation-audit.test.ts`）が共有する、辞書の木を葉にする道具。
// テスト専用で、辞書の本体（`ja.ts` / `en.ts`）からは読まない。

/**
 * 辞書の木の葉 1 つ（`a.b.c` のパスと値）
 * 辞書の葉
 */
export interface Leaf {
  readonly path: string;
  readonly value: unknown;
}

/**
 * 辞書の木を葉の一覧にする
 * 辞書の木の平坦化
 *
 * 配列は添字をパスに入れ、オブジェクトと配列の違いもパスに残す（`[0]` / `.key`）
 * ので、形の違いはパスの集合の違いとして現れる。
 *
 * @param value - 辞書の木（またはその部分木）
 * @param path - `value` の位置を表すパス（根なら空文字）
 */
export function flatten(value: unknown, path = ""): Leaf[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flatten(item, `${path}[${index}]`));
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, child]) =>
      flatten(child, path === "" ? key : `${path}.${key}`),
    );
  }
  return [{ path, value }];
}

/**
 * 名前空間の値を引く
 * 名前空間の取得
 *
 * 完訳の名前空間の一覧（文字列）から ja / en の両方を引くため。
 *
 * @param dictionary - 辞書（名前空間をキーに持つオブジェクト）
 * @param namespace - 名前空間の名前
 */
export function namespaceOf(dictionary: object, namespace: string): unknown {
  return Object.entries(dictionary).find(([key]) => key === namespace)?.[1];
}
