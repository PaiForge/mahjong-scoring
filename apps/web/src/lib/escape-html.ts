const ESCAPE_MAP: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

const ESCAPE_REGEX = /[&<>"']/g;

/**
 * HTML の特殊文字を文字実体参照に置き換える
 * HTMLエスケープ
 *
 * ユーザー入力を HTML 文字列へ直接埋め込む直前に通す（問い合わせメールの
 * 本文など、JSX を経由しない場所）。JSX の `{value}` は React が自動で
 * エスケープするので、画面描画には不要。
 *
 * `?? char` にしているのは、ESCAPE_REGEX と ESCAPE_MAP の同期を強制する
 * 仕組みが無いため。片方だけ変えたときに `undefined` が出力へ混ざるより、
 * その文字を素通しする方がまし。
 */
export function escapeHtml(str: string): string {
  return str.replace(ESCAPE_REGEX, (char) => ESCAPE_MAP[char] ?? char);
}
