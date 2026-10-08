import { normalizeSiteUrl } from "@mahjong-scoring/features/site-url";

/**
 * サイト URL（canonical・sitemap・認証コールバック等で使用）
 * サイトURL設定
 *
 * 未設定・空・不正値なら本番 URL（`normalizeSiteUrl`）。ローカル開発では
 * `.env.example` 由来の `.env.local` が `http://localhost:3000` を設定する。
 * プレビュー環境で自分自身の URL を指したいときは環境ごとに
 * `NEXT_PUBLIC_SITE_URL` を設定すること。
 */
export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

/**
 * 運営者のコーポレートサイト
 * コーポレートサイトURL
 *
 * 運営者情報ページの導線と、Organization の構造化データ（`parentOrganization`）が
 * 指す先。1 箇所に持ち、どちらかだけ古い URL を指し続けないようにする。
 */
export const CORPORATE_SITE_URL = "https://www.fuji.llc/";
