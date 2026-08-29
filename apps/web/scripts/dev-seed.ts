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

  for (const user of SEED_USERS) {
    const userId = await ensureSeedUser(admin, db, user);
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
}

main()
  .then(() => client.end())
  .then(() => console.log("dev-seed: 完了しました。"))
  .catch(async (err) => {
    console.error("dev-seed: 失敗しました:", err);
    await client.end({ timeout: 1 });
    process.exit(1);
  });
