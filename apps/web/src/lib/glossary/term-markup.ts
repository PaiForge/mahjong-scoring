/**
 * 教本本文に用語リンクを埋めるマークアップ
 * 用語マークアップ
 *
 * 辞書（`messages/ja.json`）の本文中に `[[slug|表示語]]` と書くと、その部分が
 * 用語集へのリンクになる。表示語が slug と同じでよければ `[[slug]]` と書く。
 *
 * 本文を走査して用語名に自動でリンクを張る方式は採らない。日本語は語の
 * 区切りが無く、「符」「役」「親」のような 1 文字の用語がいたるところの
 * 部分文字列に一致するため、自動リンクは必ず過剰に当たる。どこを 1 度だけ
 * 光らせるかは書き手が決める。
 *
 * 文法（1 行・入れ子なし）:
 *   token := "[[" slug ("|" label)? "]]"
 *   slug  := "[" "]" "|" 以外の 1 文字以上
 *   label := "[" "]" 以外の 1 文字以上
 *
 * slug / label はどちらも trim する。文法に合わない `[[...]]`（空の slug、
 * 閉じ忘れなど）はそのまま文字として残す — 壊れたマークアップは消えるより
 * 見えたほうが直しやすい。
 */

export type TermMarkupToken =
  | { readonly type: "text"; readonly value: string }
  | { readonly type: "term"; readonly slug: string; readonly label: string };

/** 入れ子を許さないグローバル正規表現。slug は | ] [ を、label は ] [ を含まない */
const TERM_MARKUP_RE = /\[\[([^[\]|]+?)(?:\|([^[\]]+?))?\]\]/g;

/**
 * 本文をテキスト / 用語トークンの列に分解する。
 * 用語マークアップ解析
 *
 * 隣り合うテキストは連結され、結果に空のテキストトークンや連続する
 * テキストトークンは現れない。マークアップを含まない文字列はテキスト
 * トークン 1 個（空文字列なら空配列）になる。
 *
 * @param input 辞書から引いた本文
 */
export function parseTermMarkup(input: string): TermMarkupToken[] {
  const tokens: TermMarkupToken[] = [];
  let lastIndex = 0;

  // 正規表現がモジュールレベルで状態を持つため、呼び出しごとに初期化する
  TERM_MARKUP_RE.lastIndex = 0;

  let match: RegExpExecArray | undefined;
  while ((match = TERM_MARKUP_RE.exec(input) ?? undefined) !== undefined) {
    const slug = match[1].trim();
    const label = (match[2] ?? match[1]).trim();

    // 正規表現は 1 文字以上を要求するが、空白だけの捕捉は trim で空になる。
    // その場合はマークアップとして扱わず文字のまま残す。
    if (slug === "" || label === "") continue;

    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: input.slice(lastIndex, match.index) });
    }
    tokens.push({ type: "term", slug, label });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < input.length) {
    tokens.push({ type: "text", value: input.slice(lastIndex) });
  }

  return tokens;
}

/**
 * 本文が参照している用語スラッグを、初出順で重複なく集める。
 * 参照用語の収集
 *
 * ページが実際にリンクしている用語だけをモーダル用のプレビューに積むために使う。
 *
 * @param input 辞書から引いた本文
 */
export function collectTermSlugs(input: string): string[] {
  const seen = new Set<string>();
  for (const token of parseTermMarkup(input)) {
    if (token.type === "term") seen.add(token.slug);
  }
  return [...seen];
}
