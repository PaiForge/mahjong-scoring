import type { ContactFormData } from "@/lib/validations/contact";

/**
 * 入力画面と確認画面の間で問い合わせ内容を受け渡すクエリ文字列。
 * 問い合わせクエリ
 *
 * 入力画面は `/contact/confirm?…` へ、確認画面の「入力画面に戻る」は
 * `/contact?…` へ同じ 4 つのパラメータで遷移する。両方向で同じ組み立てを
 * 使うので、キー名の綴りをここに閉じ込める。
 *
 * ブラウザバックで入力画面へ戻ったときに内容が消えないよう、状態ではなく
 * URL に載せている。
 */
export function buildContactParams(data: ContactFormData): string {
  const params = new URLSearchParams();
  params.set("name", data.name);
  params.set("email", data.email);
  params.set("subject", data.subject);
  params.set("message", data.message);
  return params.toString();
}

/** Next の `searchParams` の値の形（同じキーが複数あると配列になる） */
type SearchParamValue = string | readonly string[] | undefined;

function firstValue(value: SearchParamValue): string | undefined {
  if (typeof value === "string") return value;
  return value?.[0];
}

/**
 * 確認画面の `searchParams` から問い合わせ内容を読み出す。
 * 問い合わせクエリ読み出し
 *
 * 4 つのキーがすべて揃っているときだけ値を返す。欠けていれば undefined
 * （確認画面は入力画面へ戻す）。内容の検証はここでは行わない — 送信時に
 * Server Action が改めて検証するため
 */
export function readContactParams(
  search: Readonly<Record<string, SearchParamValue>>,
): ContactFormData | undefined {
  const name = firstValue(search.name);
  const email = firstValue(search.email);
  const subject = firstValue(search.subject);
  const message = firstValue(search.message);
  if (
    name === undefined ||
    email === undefined ||
    subject === undefined ||
    message === undefined
  ) {
    return undefined;
  }
  return { name, email, subject, message };
}
