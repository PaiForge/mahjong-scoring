import { NextResponse } from "next/server";

/**
 * ユーザーごとに異なる応答であることを示すキャッシュ指示
 *
 * 共有キャッシュ（CDN・プロキシ）に乗ると他人の応答が配られるため、
 * 閲覧者に紐づく応答を返す Route Handler は必ずこれを付ける。
 */
const PRIVATE_CACHE_CONTROL = "private, no-store";

/**
 * 閲覧者ごとに異なる JSON 応答を返す
 * 非公開JSON応答
 *
 * `/api/*` のうち「今ログインしている人」に紐づく応答を返すエンドポイントの
 * 唯一の出口。キャッシュ指示を呼び出しごとに書くと、増えたエンドポイントの
 * 1 つで付け忘れたときに他人のプロフィールや段級位が共有キャッシュから
 * 配られる。エラー応答も同じ理由でここを通す。
 *
 * @param body - 応答本体
 * @param init - ステータスコードなどの追加設定。ヘッダを渡しても
 *   Cache-Control だけはこの関数の値で上書きする
 */
export function jsonPrivate<T>(body: T, init?: ResponseInit): NextResponse {
  // Headers を経由するのは、init.headers がオブジェクト・配列・Headers の
  // どれで来ても同じように上書きするため（スプレッドでは配列と Headers を潰す）
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", PRIVATE_CACHE_CONTROL);
  return NextResponse.json(body, { ...init, headers });
}
