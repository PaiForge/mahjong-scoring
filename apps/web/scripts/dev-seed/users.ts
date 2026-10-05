/**
 * ローカル開発用シードユーザーの定義と投入処理
 * シードユーザー
 *
 * `auth.users` / `profiles` / `user_roles` の 3 つを揃えて 1 人分の
 * 「ログインしてすぐ使えるユーザー」を作る。プロフィール作成は
 * アプリ側と同じくアプリ層の責務（`registerUsername`）なので、
 * ここでもサインアップ経路と同じ順序（createUser → profiles INSERT）で作る。
 *
 * 段級位を持つユーザーは `user_ranks` に直接行を入れて作る。合格判定
 * （`checkAndGrantRanks`）を通すには、その級の昇級試験のベストスコアを
 * `challenge_best_scores` に捏造することになり、シードが「試験に受かった
 * ことにする」ための偽の記録を持つ。段級位の表示を確認したいだけなので、
 * 付与記録そのものを置く（admin ロールを直接入れているのと同じ立て付け）。
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import {
  lessonCompletions,
  profiles,
  userRanks,
  userRoles,
} from "../../src/lib/db/schema";
import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";
import {
  RANK_REGISTRY,
  nextRank,
  type RankSlug,
} from "@mahjong-scoring/features/ranks/registry";

export interface SeedUser {
  readonly email: string;
  /** `validateUsername` を通る形式（英小文字始まり・ハイフン不可） */
  readonly username: string;
  readonly displayName: string;
  /**
   * `user_roles` に admin 行を入れる。
   *
   * 管理画面は `requireAdmin()` がこのテーブルを直接見るだけなので、
   * ローカルで `/admin` を触るにはこの行があれば足りる。
   * 投入先をローカルに限定しているため自動化してよい。
   */
  readonly isAdmin?: boolean;
  /**
   * 付与する段級位（`user_ranks` の行）。
   *
   * 実際の受験と同じく、下位の級も併せて持たせること（4級のユーザーは
   * 5級も持つ）。マイページ・道場が出すのは最上位の級だが、道場の
   * 「次の段級位」は未取得の最下位を選ぶため、5級を飛ばすと4級を
   * 持ちながら5級の試験を勧められる状態になる。
   */
  readonly ranks?: readonly RankSlug[];
  /**
   * ランキングの母集団を埋めるためだけのユーザー。
   *
   * 確認したい状態を持たないため、投入ログではサインイン情報を並べず
   * 人数だけを出す（{@link RANKING_FILLERS} 参照）。
   */
  readonly fillsRanking?: boolean;
}

/**
 * ランキングの母集団を作るためだけのユーザー。
 * ランキング要員
 *
 * 名前付きのユーザー（alice 以下）は「確認したい状態」を 1 人ずつ表すが、
 * ランキングは母集団の大きさそのものが確認対象になる — 上位3位のメダル、
 * ページ送り、1 ページに収まらない自分の順位を出す「あなた」の行は、
 * どれも人数が足りないと画面に出ない。状態を持たないこの一群がその人数を
 * 埋める。名前付きのユーザーと合わせて 20 人を超え、1 ページ 20 件の
 * ページ送りに 2 ページ目ができる。
 *
 * 状態を持たないので連番で名前を付けてよい（状態を名前に埋めるなという
 * 下の注意は、状態を持つユーザーについてのもの）。
 */
const RANKING_FILLERS: readonly SeedUser[] = Array.from(
  { length: 20 },
  (_, index) => {
    const suffix = String(index + 1).padStart(2, "0");
    return {
      email: `player${suffix}@example.local`,
      username: `seed_player${suffix}`,
      displayName: `プレイヤー${suffix}（シード）`,
      fillsRanking: true,
    };
  },
);

/**
 * 投入するユーザー一覧。
 *
 * 管理者と一般ユーザーを分けているのは、「管理者でないユーザーが
 * `/admin` にアクセスすると 404」という経路を同じシードのまま
 * 確認できるようにするため。
 *
 * 一般ユーザーは参考プロジェクト（blindfold-chess）と同じく
 * alice / bob / carol … の並びで、確認したい状態の数だけ増やす。
 * 状態を名前に埋める（`kyu4@example.local` のような）付け方をしない —
 * 段級位が増えるたびに名前を付け直すことになるうえ、そのユーザーが
 * 昇級すると名前が嘘になる。名前はただの識別子として置き、どの状態を
 * 表しているかはこの表のコメントで示す。
 *
 * 末尾に {@link RANKING_FILLERS} を足している。こちらは状態を表さず、
 * ランキングに人数を与えるためだけの一群。
 */
export const SEED_USERS: readonly SeedUser[] = [
  {
    email: "admin@example.local",
    username: "seed_admin",
    displayName: "管理者（シード）",
    isAdmin: true,
  },
  // 無級。段級位を1つも持たない状態（道場は5級の試験を勧める）
  {
    email: "alice@example.local",
    username: "seed_alice",
    displayName: "アリス（シード）",
  },
  // 5級。道場・ダッシュボードが次の級（4級）の試験を出す状態
  {
    email: "bob@example.local",
    username: "seed_bob",
    displayName: "ボブ（シード）",
    ranks: ["kyu-5"],
  },
  // 4級。符の計算を学び終え、3級（七対子）へ向かう状態
  {
    email: "erin@example.local",
    username: "seed_erin",
    displayName: "エリン（シード）",
    ranks: ["kyu-5", "kyu-4"],
  },
  // 3級。2級（平和）へ向かう状態
  {
    email: "frank@example.local",
    username: "seed_frank",
    displayName: "フランク（シード）",
    ranks: ["kyu-5", "kyu-4", "kyu-3"],
  },
  // 2級。1級（30〜50符）へ向かう状態
  {
    email: "grace@example.local",
    username: "seed_grace",
    displayName: "グレース（シード）",
    ranks: ["kyu-5", "kyu-4", "kyu-3", "kyu-2"],
  },
  // 1級。前提章を持たない初段（昇段試験だけ）へ向かう状態
  {
    email: "heidi@example.local",
    username: "seed_heidi",
    displayName: "ハイジ（シード）",
    ranks: ["kyu-5", "kyu-4", "kyu-3", "kyu-2", "kyu-1"],
  },
  // 最上位の段級位。道場は「新しい段級位は準備中」を出す
  {
    email: "carol@example.local",
    username: "seed_carol",
    displayName: "キャロル（シード）",
    ranks: ["kyu-5", "kyu-4", "kyu-3", "kyu-2", "kyu-1", "dan-1"],
  },
  // 無級・購入なし。運営から Pro を付与されている状態（benefit-grants.ts）
  {
    email: "dave@example.local",
    username: "seed_dave",
    displayName: "デイブ（シード）",
  },
  ...RANKING_FILLERS,
];

/** シードユーザー共通のパスワード（`password_requirements = letters_digits` を満たす） */
export const SEED_PASSWORD = "devpass1";

/**
 * シードユーザーを冪等に作成する（既にいれば作り直さない）
 * シードユーザー作成
 *
 * @param admin service_role キーで作った Supabase クライアント
 * @param db ローカル Postgres への Drizzle クライアント
 * @param user 作成するユーザーの定義
 * @returns 作成済み／既存の `auth.users.id`
 */
export async function ensureSeedUser(
  admin: SupabaseClient,
  db: PostgresJsDatabase,
  user: SeedUser,
): Promise<string> {
  const userId = await ensureAuthUser(admin, user);

  await db
    .insert(profiles)
    .values({
      id: userId,
      username: user.username,
      displayName: user.displayName,
    })
    .onConflictDoNothing();

  if (user.isAdmin) {
    await db
      .insert(userRoles)
      .values({ userId, role: "admin" })
      .onConflictDoNothing();
  }

  // シードは段級位とレッスンの完了の権威ソース: 宣言された状態へ消して
  // 入れ直す。チャレンジ成績（challenge-results.ts）と同じ方針で、シード
  // ユーザーとして実際に受験・完了した記録は残らない。追記だけ
  // （onConflictDoNothing）だと、シードユーザーで遊んで付いた級が再シード後も
  // 残り、「無級の管理者」等のフィクスチャが壊れたままになる。
  // 無級のユーザーには完了を入れない — レッスンが次の一歩として出る状態を
  // 確かめたい
  await db.delete(userRanks).where(eq(userRanks.userId, userId));
  await db
    .delete(lessonCompletions)
    .where(eq(lessonCompletions.userId, userId));

  if (user.ranks && user.ranks.length > 0) {
    await db
      .insert(userRanks)
      .values(user.ranks.map((rankSlug) => ({ userId, rankSlug })));

    const completedLessons = completedLessonsFor(user.ranks);
    await db
      .insert(lessonCompletions)
      .values(completedLessons.map((lessonSlug) => ({ userId, lessonSlug })));
  }

  return userId;
}

/**
 * 段級位を持つユーザーが終えていることにするレッスン（章）
 * シード完了レッスン
 *
 * 取得済みの級の前提章に加えて、次に取る級の前提章も完了にする。
 * ダッシュボードの「次にやること」は学ぶ段が済んでいる前提で練習か試験を
 * 指すため、これが無いと5級のシードユーザーで次の一歩が 4級の最初の
 * レッスンに戻る（道場からは完了に関係なく試験に辿り着ける）。
 *
 * 章の一覧は段級位レジストリから引く。級を足しても、その級の前提章が
 * 自動で完了に入る。
 */
function completedLessonsFor(
  ranks: readonly RankSlug[],
): readonly CurriculumChapterSlug[] {
  const held = RANK_REGISTRY.filter((rank) => ranks.includes(rank.slug));
  const next = nextRank(ranks);
  const target = next === undefined ? held : [...held, next];

  return [...new Set(target.flatMap((rank) => rank.learnChapterSlugs))];
}

/**
 * `auth.users` の行を取得または作成する
 * 認証ユーザー確保
 *
 * Supabase JS には email 指定の取得 API が無いため、存在確認は
 * `listUsers` で行う。`perPage` の上限は 1000 で、ローカルの
 * シード件数はそれを大きく下回る。
 */
async function ensureAuthUser(
  admin: SupabaseClient,
  user: SeedUser,
): Promise<string> {
  const list = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (list.error) throw list.error;

  const existing = list.data.users.find((u) => u.email === user.email);
  if (existing) {
    return existing.id;
  }

  // email_confirm: true で確認メールの経路を飛ばす（ローカルの Mailpit を
  // 開かずにそのままサインインできるようにするため）。
  const created = await admin.auth.admin.createUser({
    email: user.email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: user.displayName },
  });
  if (created.error) throw created.error;
  if (!created.data.user) {
    throw new Error(`createUser がユーザーを返しませんでした: ${user.email}`);
  }

  return created.data.user.id;
}
