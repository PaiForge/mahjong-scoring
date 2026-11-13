/**
 * 辞書を引く関数の形
 * 翻訳関数型
 *
 * web の next-intl（`useTranslations()` / `getTranslations()`）とアプリの use-intl の
 * `t` をそのまま渡せる。共有ロジックが文言を組むとき、引数の型をこれで受ける —
 * 関数ごとに同じ形を宣言し直すと、`values` の型（数だけ・文字列だけ）が場所ごとに
 * 割れる。どの名前空間の `t` を渡すかは、受ける側の引数の TSDoc に書く。
 *
 * キーをリテラルの合併で絞りたい関数（渡せるキーが 2〜3 個に決まっているもの）は
 * これを使わず、その場で絞った型を宣言する。
 *
 * @param key - 名前空間の中のキー
 * @param values - ICU の引数（件数・値の補間）
 */
export type Translate = (
  key: string,
  values?: Readonly<Record<string, string | number>>,
) => string;
