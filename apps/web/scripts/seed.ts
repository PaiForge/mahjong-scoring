/**
 * 本番の初期データ投入
 * 本番シード
 *
 * prebuild（`scripts/prebuild-db.ts`）がマイグレーションの後に走らせる。
 * ここで入れるのは「初回だけ入れ、以後は DB が正」の初期データで、既にある
 * 行は変えない（管理画面での編集を上書きしない）。ローカルの確認用データ
 * （ユーザー・成績）は `scripts/dev-seed.ts` の担当で、ここには入れない。
 */
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { resolveMigrationDatabaseUrl } from "./_lib/database-url";
import { seedAdCreatives } from "./seed/ad-creatives";

dotenv.config({ path: [".env.local", ".env"] });

const connectionString = resolveMigrationDatabaseUrl();
if (!connectionString) {
  console.error(
    "seed: POSTGRES_URL_NON_POOLING / POSTGRES_URL / DATABASE_URL が未設定です。",
  );
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false, max: 1 });
const db = drizzle(client);

async function main() {
  console.log("seed: ネイティブ広告の初期データを投入します...");
  const inserted = await seedAdCreatives(db);
  console.log(`  新しく ${inserted} 件（停止中・仮リンク）`);
}

main()
  .then(() => client.end())
  .then(() => console.log("seed: 完了しました。"))
  .catch(async (err) => {
    console.error("seed: 失敗しました:", err);
    await client.end({ timeout: 1 });
    process.exit(1);
  });
