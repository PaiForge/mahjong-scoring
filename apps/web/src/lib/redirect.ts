/**
 * 内部パスのサニタイズ。ユーザー入力由来のリダイレクト先文字列を検証し、
 * 外部ドメインへの誘導（open redirect）を防ぐ。
 *
 * @remarks
 * 本関数は `/sign-in?redirect=...` / `/auth/callback?next=...` など、
 * ユーザー入力を起源とする全ての内部リダイレクトの**唯一のトラストバウンダリ**。
 * `redirect(x)` や `window.location.href = x` で `x` がユーザー入力由来の場合、
 * 必ず本関数を通すこと。
 *
 * 検証ルール:
 * 1. 文字列型かつ非空
 * 2. ルート "/" は許可
 * 3. それ以外は `/` で始まり、2 文字目がスラッシュ・バックスラッシュ・空白以外
 *    （`//evil.com` / `/\evil.com` / `/ evil.com` 等を拒否）
 * 4. バックスラッシュを含まない（WHATWG URL 仕様で `\` は `/` と同等に扱われる）
 * 5. 制御文字 (`\u0000`-`\u001F`, `\u007F`) を含まない（CRLF インジェクション / 空白バイパス対策）
 * 6. `http:` / `https:` を含まない（大文字小文字無視、絶対 URL の二重防御）
 *
 * @param value 未検証の入力値（`searchParams` などから得た文字列想定）
 * @return 有効な内部パスなら同値の文字列、それ以外は `undefined`
 */
export function sanitizeInternalRedirect(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  if (value !== "/" && !/^\/[^/\\\s]/.test(value)) return undefined;
  if (value.includes("\\")) return undefined;
  // 制御文字（NUL/BEL/CRLF 等）は CRLF インジェクションや URL 正規化攻撃の
  // バイパスに利用されるため、ここで明示的に検出して拒否する。
  // eslint-disable-next-line no-control-regex -- intentional control-char detection for security
  if (/[\u0000-\u001F\u007F]/.test(value)) return undefined;
  const lower = value.toLowerCase();
  if (lower.includes("http:") || lower.includes("https:")) return undefined;
  return value;
}
