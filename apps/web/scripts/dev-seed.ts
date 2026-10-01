/**
 * ローカル開発用シード
 * 開発シード
 *
 * ログイン済みでないと触れない画面（`/admin` を含む）をローカルで
 * 確認するためのユーザーを投入する。管理者ロールの付与は UI が無く
 * 手で SQL を叩く運用だったので、その手順をここに寄せている。
 *
 * ローカル以外（DB・Supabase のどちらかがローカルホストでない）に対しては
 * 実行を拒否する。service_role キーを使い、確認メールを飛ばさずに
 * ユーザーを作るため、本番に向けて走らせてよいスクリプトではない。
 *
 * 必要な環境変数（`apps/web/.env.local`）:
 *   - NEXT_PUBLIC_SUPABASE_URL   未設定なら http://127.0.0.1:54321
 *   - SUPABASE_SERVICE_ROLE_KEY  `pnpm supabase status -o json` の SERVICE_ROLE_KEY
 *   - POSTGRES_URL / DATABASE_URL 未設定ならローカル Supabase の Postgres
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  LOCAL_SUPABASE_DATABASE_URL,
  resolveMigrationDatabaseUrl,
} from "./_lib/database-url";
import { DEV_TRACKING_ID, reseedAdCreatives } from "./dev-seed/ad-creatives";
import { reseedChallengeResults } from "./dev-seed/challenge-results";
import type { ScoredSeedUser } from "./dev-seed/challenge-results";
import { reseedPurchases } from "./dev-seed/purchases";
import { SEED_PASSWORD, SEED_USERS, ensureSeedUser } from "./dev-seed/users";

dotenv.config({ path: [".env.local", ".env"] });

/** ローカル Supabase の API エンドポイント */
const LOCAL_SUPABASE_API_URL = "http://127.0.0.1:54321";

const databaseUrl =
  resolveMigrationDatabaseUrl() ?? LOCAL_SUPABASE_DATABASE_URL;
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? LOCAL_SUPABASE_API_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** URL のホスト名を取り出す（パースできなければ判定用のダミーを返す） */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "<invalid>";
  }
}

function isLocalUrl(url: string): boolean {
  const host = hostOf(url);
  return host === "127.0.0.1" || host === "localhost";
}

if (!serviceRoleKey) {
  console.error(
    "dev-seed: SUPABASE_SERVICE_ROLE_KEY が未設定です。\n" +
      "          `pnpm supabase status -o json` の SERVICE_ROLE_KEY を\n" +
      "          apps/web/.env.local に追加してください。",
  );
  process.exit(1);
}

if (!isLocalUrl(databaseUrl) || !isLocalUrl(supabaseUrl)) {
  console.error("dev-seed: ローカル以外の環境に対しては実行しません。");
  console.error(`          DB のホスト:       ${hostOf(databaseUrl)}`);
  console.error(`          Supabase のホスト: ${hostOf(supabaseUrl)}`);
  process.exit(1);
}

const client = postgres(databaseUrl, { prepare: false, max: 1 });
const db = drizzle(client);
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("dev-seed: シードユーザーを投入します...");

  const scored: ScoredSeedUser[] = [];

  for (const user of SEED_USERS) {
    const userId = await ensureSeedUser(admin, db, user);
    scored.push({ userId, username: user.username });

    // ランキング要員は状態を持たず触ることもないので、1 人ずつは出さない。
    if (user.fillsRanking) continue;

    const notes = [
      user.isAdmin ? "admin ロール付与" : undefined,
      user.ranks?.length ? `段級位: ${user.ranks.join(", ")}` : undefined,
    ].filter((note) => note !== undefined);
    const suffix = notes.length > 0 ? ` (${notes.join(" / ")})` : "";
    console.log(`  ${user.username.padEnd(12)} → ${userId}${suffix}`);
    console.log(
      `  ${"".padEnd(12)}   ${user.email} / ${SEED_PASSWORD} でサインイン`,
    );
  }

  const fillerCount = SEED_USERS.filter((user) => user.fillsRanking).length;
  console.log(`  ランキング要員 ${fillerCount} 人（パスワードは共通）`);

  console.log("dev-seed: チャレンジ成績を投入します...");
  const inserted = await reseedChallengeResults(db, scored);
  console.log(
    `  challenge_results ${inserted} 件 + 導出したベストスコアを投入しました`,
  );

  console.log("dev-seed: 有料プランの購入記録を投入します...");
  const purchased = await reseedPurchases(db, scored);
  console.log(
    `  purchases ${purchased} 件（bob: 有効な 30 日パス + 期限切れのパス / carol: 買い切り）`,
  );

  console.log("dev-seed: ネイティブ広告を投入します...");
  const ads = await reseedAdCreatives(db);
  console.log(
    `  本番シードと同じ広告 ${ads} 件 + ローカル用のトラッキング ID（${DEV_TRACKING_ID}）`,
  );
}

main()
  .then(() => client.end())
  .then(() => console.log("dev-seed: 完了しました。"))
  .catch(async (err) => {
    console.error("dev-seed: 失敗しました:", err);
    await client.end({ timeout: 1 });
    process.exit(1);
  });
