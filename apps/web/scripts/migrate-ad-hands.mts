/**
 * 広告カードの手牌（`ad_creatives.hand`）を Extended MPSZ 2.0 へ移行する
 * 広告手牌移行
 *
 * `hand` は Extended MSPZ 1.x の表記で保存されてきた。2.0 では方向注釈の
 * 無い副露が不正になり、`0` の意味が「読み飛ばし」から「赤 5」に変わる。
 * 1.x の頃の管理画面は副露を受け付けていなかったため、正しく保存された
 * 値は純手牌だけで、2.0 でも同じ文字列のまま同じ意味になる。書き換えが
 * 要るのは手で入れた副露か、`0` や範囲外の字牌を含む値だけのはず。
 *
 * 既定は書き込まない（dry-run）。全行を変換して結果を一覧にし、
 * `--apply` を付けたときだけ書き換えが要る行を更新する。変換できない値と、
 * 変換後に列の長さ（64 文字）を超える値は書き込まずに一覧へ出す — 値は人が
 * 管理画面で決める。変換できても帯の規則（純手牌だけ・14 枚まで）に合わない
 * 値は、意味を保つため書き換えたうえで一覧に出す（管理画面でそのまま保存し
 * 直せない。1.x の頃も帯には純手牌の部分だけが並んでいた）。どちらかが
 * 1 件でもあれば終了コードは 2。
 *
 * 書き換えは表記の並びを保ち、正規形（`formatMpsz`）には揃えない（帯は
 * 表記の順に牌を並べるため）。
 *
 * riichi-mahjong は ESM 専用パッケージのため、core を読むこのスクリプトと
 * 変換関数は `.mts` にしている（`.ts` は apps/web では CommonJS として
 * 読まれ、`require` が解決できない）。同じ理由で管理画面の
 * `isValidAdHand` を import できず、帯に並べられるかの判定をここに写している。
 * 規則を変えたら両方を直すこと。
 *
 * 実行: `pnpm --filter web db:migrate-ad-hands [--apply]`
 */
import dotenv from "dotenv";
import postgres from "postgres";

import { parseTehai } from "@mahjong-scoring/core";

import { resolveMigrationDatabaseUrl } from "./_lib/database-url";
import { convertLegacyExtendedMpsz } from "./_lib/legacy-mpsz.mjs";

dotenv.config({ path: [".env.local", ".env"] });

/** `ad_creatives.hand` の列の長さ（`varchar(64)`） */
const HAND_COLUMN_LENGTH = 64;

/** 帯に並べられる手牌の枚数の上限（ツモ後の 14 枚） */
const MAX_HAND_TILES = 14;

/** 帯に並べられない理由（並べられるなら undefined） */
function bandProblem(hand: string): string | undefined {
  const tehai = parseTehai(hand);
  if (!tehai) return "2.0 として読めない";
  if (tehai.exposed.length > 0) return "面子ブロックを含む（帯は純手牌だけ）";
  if (tehai.closed.length === 0) return "牌が無い";
  if (tehai.closed.length > MAX_HAND_TILES) {
    return `${tehai.closed.length} 枚（${MAX_HAND_TILES} 枚まで）`;
  }
  return undefined;
}

interface AdHandRow {
  readonly id: string;
  readonly hand: string;
}

const apply = process.argv.includes("--apply");

const connectionString = resolveMigrationDatabaseUrl();
if (!connectionString) {
  console.error(
    "migrate-ad-hands: POSTGRES_URL_NON_POOLING / POSTGRES_URL / DATABASE_URL が未設定です。",
  );
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false, max: 1 });

async function main(): Promise<number> {
  const rows = await sql<AdHandRow[]>`
    SELECT id::text AS id, hand FROM ad_creatives
    WHERE hand IS NOT NULL ORDER BY id
  `;

  const unchanged: AdHandRow[] = [];
  const rewrites: (AdHandRow & { readonly next: string })[] = [];
  /** 書き込まない（値を人が決める） */
  const unconvertible: (AdHandRow & { readonly problem: string })[] = [];
  /** 2.0 として正しいが帯の規則に合わない（書き換えはする） */
  const offBand: (AdHandRow & { readonly problem: string })[] = [];

  for (const row of rows) {
    const converted = convertLegacyExtendedMpsz(row.hand);
    if (!converted.ok) {
      unconvertible.push({ ...row, problem: converted.reason });
      continue;
    }
    const next = converted.value;
    if (next.length > HAND_COLUMN_LENGTH) {
      unconvertible.push({
        ...row,
        problem: `${next} は ${next.length} 文字（列は ${HAND_COLUMN_LENGTH} 文字まで）`,
      });
      continue;
    }
    const problem = bandProblem(next);
    if (problem) offBand.push({ ...row, problem: `${next}: ${problem}` });
    if (next === row.hand) unchanged.push(row);
    else rewrites.push({ ...row, next });
  }

  const longest = Math.max(
    0,
    ...unchanged.map(({ hand }) => hand.length),
    ...rewrites.map(({ next }) => next.length),
  );
  console.log(`migrate-ad-hands: 手牌を持つ広告 ${rows.length} 件`);
  console.log(`  書き換え不要: ${unchanged.length} 件`);
  console.log(`  書き換える: ${rewrites.length} 件`);
  for (const { id, hand, next } of rewrites) {
    console.log(`    ${id}: ${hand} → ${next}`);
  }
  console.log(`  変換後の最長: ${longest} 文字（列は ${HAND_COLUMN_LENGTH}）`);
  console.log(`  変換できない（書き込まない）: ${unconvertible.length} 件`);
  for (const { id, hand, problem } of unconvertible) {
    console.log(`    ${id}: ${hand} — ${problem}`);
  }
  console.log(`  帯の規則に合わない（管理画面で直す）: ${offBand.length} 件`);
  for (const { id, hand, problem } of offBand) {
    console.log(`    ${id}: ${hand} — ${problem}`);
  }

  if (!apply) {
    console.log(
      "dry-run です。書き換えるには --apply を付けて実行してください。",
    );
  } else if (rewrites.length > 0) {
    await sql.begin(async (tx) => {
      for (const { id, hand, next } of rewrites) {
        // 一覧を作った後に管理画面で編集された行は上書きしない
        const updated = await tx`
          UPDATE ad_creatives SET hand = ${next}
          WHERE id = ${id}::uuid AND hand = ${hand}
        `;
        if (updated.count !== 1) {
          throw new Error(
            `${id} が一覧の作成後に変更されました。やり直してください。`,
          );
        }
      }
    });
    console.log(`${rewrites.length} 件を書き換えました。`);
  }

  return unconvertible.length + offBand.length > 0 ? 2 : 0;
}

main()
  .then(async (code) => {
    await sql.end();
    process.exit(code);
  })
  .catch(async (error: unknown) => {
    console.error("migrate-ad-hands: 失敗しました:", error);
    await sql.end({ timeout: 1 });
    process.exit(1);
  });
