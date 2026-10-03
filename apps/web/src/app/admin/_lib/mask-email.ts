/** 隠した部分に置き換える文字列 */
const MASK = "***";

/**
 * メールアドレスのローカル部を隠し、ドメインは残す
 * メールアドレスマスク
 *
 * `k_okishima@fuji.enterprises` は `k***@fuji.enterprises` になる。先頭 1 文字を
 * 残すのは別人の行が見た目で区別できるようにするため、ドメインを残すのは
 * 捨てアドレスか会社のアドレスかをアドレス自体を見せずに判別できるようにするため。
 * ローカル部の長さは `***` の固定長に潰し、漏らさない。
 *
 * `local@domain` として読めないもの（`@` が無い・ローカル部が空）は、
 * 見せて安全だと言える部分が無いので丸ごと置き換える。
 * 区切りは最後の `@` で取る。引用符付きのローカル部に `@` を含められても
 * ドメイン側へ漏らさないため。
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0) return MASK;

  return `${email[0]}${MASK}${email.slice(at)}`;
}
