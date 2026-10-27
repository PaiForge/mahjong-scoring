/**
 * スクリプトの環境変数読み込み
 * スクリプト環境変数
 *
 * `scripts/*` と `drizzle.config.ts` のエントリポイントが共有する dotenv の
 * 読み込み方の唯一の定義。
 */
import dotenv from "dotenv";

/**
 * `.env.local` → `.env` の順に読み込む
 * 環境変数読み込み
 *
 * Next.js と同じく `.env.local` を優先する。どちらのファイルも既にある
 * `process.env`（Vercel が注入した値・シェルで渡した値）を上書きせず、
 * 両方に同じキーがあれば先に読んだ `.env.local` の値が残る。
 *
 * ES モジュールの import は本体より先に評価されるため、これを呼ぶ時点で
 * import 先のモジュールは評価済み。import 先はトップレベルで `process.env` を
 * 読まず、関数の中で読むこと。
 */
export function loadScriptEnv(): void {
  dotenv.config({ path: [".env.local", ".env"] });
}
