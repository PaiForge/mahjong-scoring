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
 * 冪等で、何度実行してもよい。
 *
 * 投入するもの（何を確かめるための状態か）:
 *
 * - 管理者 `admin@example.local` と一般ユーザー 9 人（いずれも `example.local`、
 *   パスワード `devpass1`、メール確認済み）: `alice@`（無級）/ `bob@`（5級）/
 *   `erin@`（4級）/ `frank@`（3級）/ `grace@`（2級）/ `heidi@`（1級）/
 *   `carol@`（最上位の段級位）/ `dave@`（無級・Pro を手動付与）/ `ivan@`
 *   （ユーザー名未設定 = 登録の途中。ログイン直後のユーザー名の設定と、
 *   記録が残らない人向けの案内を確かめる）
 * - 段級位を持つユーザーには `user_ranks` と前提のレッスンの完了（次に取る級の
 *   前提章を含む）。道場の「現在の段級位」と黒帯への道の開いた級、ダッシュボードの
 *   「次にやること」（学び終えているので練習か試験を指す）をログインするだけで
 *   確かめられる。無級の alice は「次にやること」が最初のレッスンを指すが、
 *   チャレンジ成績が入っているため `isFresh` ではなく、最初のレッスン向けの文言には
 *   ならない（その状態は登録したての本物のアカウントで見る）
 * - ランキングの母集団だけのための `seed_player01`〜`seed_player20`
 *   （`player01@example.local` …）。上位 3 位のメダル・ページ送り・1 ページに
 *   収まらない自分の順位を出す「あなた」の行は、人数が足りないと画面に出ないため。
 *   ユーザー名を持つ全シードユーザーに全練習種別（昇級試験を除く。試験は本番でも
 *   記録されない）のチャレンジ成績（当月と前月の 2 件ずつ）が入り、総合・月間の
 *   両方のランキングが埋まる。成績の値はユーザー名から決まる擬似乱数なので、
 *   何度実行しても順位は変わらない。シードユーザーの既存の成績・段級位・レッスンの
 *   完了は宣言された状態へ消して入れ直すため、シードユーザーとして遊んだ記録は残らない。
 *   EXP は付与しないので、EXP の画面を見たいときは実際に練習を 1 回走らせる
 * - 有料プラン（`purchases`）: bob に有効な 30 日パス 1 枚と期限切れのパス 1 枚、
 *   carol に買い切り（偽の Stripe ID。Stripe API は叩かない）。erin には App Store で
 *   買った有効な 30 日パス 1 枚（`provider` が `apple`、Production、偽の取引 ID）で、
 *   マイページと管理画面の「購入元」の列を見比べられる。alice は購入なしで、無料枠の
 *   回数制限が掛かる状態。`stripe_customers` には入れない — 偽の顧客 ID があると
 *   シードユーザーで Checkout を試したときに Stripe 側に存在しない顧客を渡して失敗する
 * - 特典の手動付与（`benefit_grants`）: dave に 60 日の付与 1 件（付与者は admin、
 *   購入なし）。マイページの「Pro（付与）」と管理画面の付与一覧（`/admin/benefit-grants`）の
 *   取り消しがこれで試せる
 * - ネイティブ広告（`dev-seed/ad-creatives.ts`）: 本番のシード（`seed/ad-creatives.ts`）と
 *   同じ広告と、ローカル用の架空の Amazon トラッキング ID（web は `localdev-web-22`、
 *   アプリは `localdev-app-22`。リンクの `tag=` でどちらの ID で組んだかが分かる）。
 *   ASIN で指す広告はトラッキング ID が無いと画面に出ないため、これで配置と見た目を
 *   ログインなしで確かめられる。管理画面（`/admin/ads`）で編集しても、次の実行で戻る
 * - お知らせ（`dev-seed/announcements.ts`）: slug が `dev-` の公開済みの記事。ピン留めの
 *   1 件と、本文の書式（見出し・リンク・箇条書き・引用・コード・表）を一通り使った
 *   「書式の見本」があり、web とアプリの描き方を見比べられる。管理画面で書いた手元の
 *   お知らせ（`dev-` 以外）には触れない
 *
 * 必要な環境変数（`apps/web/.env.local`）:
 *   - NEXT_PUBLIC_SUPABASE_URL   未設定なら http://127.0.0.1:54321
 *   - SUPABASE_SERVICE_ROLE_KEY  `pnpm supabase status -o json` の SERVICE_ROLE_KEY
 *   - POSTGRES_URL / DATABASE_URL 未設定ならローカル Supabase の Postgres
 */
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  LOCAL_SUPABASE_DATABASE_URL,
  resolveMigrationDatabaseUrl,
} from "./_lib/database-url";
import { loadScriptEnv } from "./_lib/load-script-env";
import { DEV_TRACKING_IDS, reseedAdCreatives } from "./dev-seed/ad-creatives";
import { reseedAnnouncements } from "./dev-seed/announcements";
import { reseedBenefitGrants } from "./dev-seed/benefit-grants";
import { reseedChallengeResults } from "./dev-seed/challenge-results";
import type { ScoredSeedUser } from "./dev-seed/challenge-results";
import { reseedNotifications } from "./dev-seed/notifications";
import { reseedPurchases } from "./dev-seed/purchases";
import { SEED_PASSWORD, SEED_USERS, ensureSeedUser } from "./dev-seed/users";

loadScriptEnv();

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
    // ユーザー名の無い（登録の途中の）ユーザーには成績・購入を結べない
    if (user.username !== null)
      scored.push({ userId, username: user.username });

    // ランキング要員は状態を持たず触ることもないので、1 人ずつは出さない。
    if (user.fillsRanking) continue;

    const notes = [
      user.isAdmin ? "admin ロール付与" : undefined,
      user.ranks?.length ? `段級位: ${user.ranks.join(", ")}` : undefined,
      user.username === null ? "ユーザー名未設定" : undefined,
    ].filter((note) => note !== undefined);
    const suffix = notes.length > 0 ? ` (${notes.join(" / ")})` : "";
    console.log(
      `  ${(user.username ?? "(未設定)").padEnd(12)} → ${userId}${suffix}`,
    );
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
    `  purchases ${purchased} 件（bob: 有効な 30 日パス + 期限切れのパス / carol: 買い切り / erin: App Store の 30 日パス）`,
  );

  console.log("dev-seed: 特典の手動付与を投入します...");
  const granted = await reseedBenefitGrants(db, scored);
  console.log(`  benefit_grants ${granted} 件（dave: 60 日の付与 / 購入なし）`);

  console.log("dev-seed: サイト内通知を投入します...");
  const notified = await reseedNotifications(db, scored);
  console.log(
    `  notifications ${notified} 件（購入・付与から導出。bob: 期限切れを含む / ヘッダーのベルに未読数が出る）`,
  );

  console.log("dev-seed: ネイティブ広告を投入します...");
  const ads = await reseedAdCreatives(db);
  console.log(
    `  本番シードと同じ広告 ${ads} 件 + ローカル用のトラッキング ID（web: ${DEV_TRACKING_IDS.web} / アプリ: ${DEV_TRACKING_IDS.mobile}）`,
  );

  console.log("dev-seed: お知らせを投入します...");
  const announced = await reseedAnnouncements(db);
  console.log(
    `  announcements ${announced} 件（slug が dev- のもの。ピン留め 1 件と書式の見本を含む）`,
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
