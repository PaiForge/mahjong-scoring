/**
 * API route・アプリ向け API のハンドラのテストに渡す Request を組む
 * テスト用リクエスト
 *
 * 各テストが `new Request(url, { method: "POST", body: JSON.stringify(body) })`
 * を自前の関数で包んでいたのでここへまとめる。本文は、文字列ならそのまま
 * （壊れた JSON を送るテスト）、undefined なら本文なし、それ以外は JSON に
 * 直して送る。
 *
 * このモジュールはテスト専用。アプリ本体から import しないこと。
 */
export function postJsonRequest(
  url: string,
  body?: unknown,
  headers?: Readonly<Record<string, string>>,
): Request {
  return new Request(url, {
    method: "POST",
    headers,
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
  });
}
