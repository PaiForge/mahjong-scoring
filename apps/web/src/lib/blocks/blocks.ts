import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "../db";
import { profiles, userBlocks } from "../db/schema";
import { writeAsAccount } from "../users/account-write-lock";

/**
 * 閲覧者がブロックしている人の ID を返す
 * ブロック中 ID 一覧
 *
 * ランキングの行を閲覧者ごとに取り除くために、1 リクエストで 1 回引く。
 * 未ログインなら空。件数は本人がブロックした人数で、ページ全体の行数より
 * ずっと小さい前提（上限は設けていない）。
 */
export async function getBlockedUserIds(
  viewerId: string | undefined,
): Promise<ReadonlySet<string>> {
  if (viewerId === undefined) return new Set();
  const rows = await db
    .select({ blockedId: userBlocks.blockedId })
    .from(userBlocks)
    .where(eq(userBlocks.blockerId, viewerId));
  return new Set(rows.map((row) => row.blockedId));
}

/**
 * 閲覧者が相手をブロックしているかを返す
 * ブロック判定
 */
export async function isBlocking(
  viewerId: string | undefined,
  targetId: string,
): Promise<boolean> {
  if (viewerId === undefined) return false;
  const [row] = await db
    .select({ blockedId: userBlocks.blockedId })
    .from(userBlocks)
    .where(
      and(
        eq(userBlocks.blockerId, viewerId),
        eq(userBlocks.blockedId, targetId),
      ),
    )
    .limit(1);
  return row !== undefined;
}

/**
 * ブロックした人の行を取り除く
 * ブロック済み除外
 *
 * 順位（`rank`）は数え直さない。ランキングは全員で共有するキャッシュから
 * 引いており、閲覧者ごとに数え直すとキャッシュが効かず、自分の順位も他の人が
 * 見るものとずれる（`user_blocks` の TSDoc）。
 */
export function withoutBlocked<Row extends { readonly userId: string }>(
  rows: readonly Row[],
  blockedIds: ReadonlySet<string>,
): readonly Row[] {
  if (blockedIds.size === 0) return rows;
  return rows.filter((row) => !blockedIds.has(row.userId));
}

/** ブロックした人の一覧の 1 行 */
export interface BlockedUser {
  readonly username: string;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
  readonly blockedAt: Date;
}

/**
 * 閲覧者がブロックした人を新しい順に返す
 * ブロック一覧
 *
 * 設定の「ブロックしたユーザー」に出し、そこから解除させる。BAN された人も
 * 載せる（解除の入口を消さないため）。退会した人の行は退会の処理が消す。
 */
export async function listBlockedUsers(
  viewerId: string,
): Promise<readonly BlockedUser[]> {
  return db
    .select({
      username: profiles.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      blockedAt: userBlocks.createdAt,
    })
    .from(userBlocks)
    .innerJoin(profiles, eq(profiles.id, userBlocks.blockedId))
    .where(eq(userBlocks.blockerId, viewerId))
    .orderBy(desc(userBlocks.createdAt));
}

/**
 * ブロック・解除の結果
 *
 * - `done` — ブロックした / 解除した（すでにその状態でも `done`。冪等）
 * - `notFound` — そのユーザー名の人がいない（退会済みを含む）
 * - `self` — 自分自身はブロックできない
 * - `accountClosing` — 退会を受け付けた後なので書かなかった
 */
export type BlockWriteResult = "done" | "notFound" | "self" | "accountClosing";

/** ユーザー名から、ブロックの相手になれる人の ID を引く */
async function findTargetId(username: string): Promise<string | undefined> {
  const [row] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.username, username), isNull(profiles.deletedAt)))
    .limit(1);
  return row?.id;
}

/**
 * 相手をブロックする
 * ブロック
 *
 * 相手はユーザー名で指す（画面とアプリ向け API が持っているのは公開の
 * ユーザー名だけで、内部の ID を外に出さないため）。BAN された人も
 * ブロックできる（解除後に備えて）。
 */
export async function blockUser(
  blockerId: string,
  targetUsername: string,
): Promise<BlockWriteResult> {
  const targetId = await findTargetId(targetUsername);
  if (targetId === undefined) return "notFound";
  if (targetId === blockerId) return "self";
  const { written } = await writeAsAccount(blockerId, (tx) =>
    tx
      .insert(userBlocks)
      .values({ blockerId, blockedId: targetId })
      .onConflictDoNothing(),
  );
  return written ? "done" : "accountClosing";
}

/**
 * ブロックを解除する
 * ブロック解除
 *
 * 退会の受付後でも消してよい（どのみち退会の処理が消す）ので、退会との
 * 直列化はしない。
 */
export async function unblockUser(
  blockerId: string,
  targetUsername: string,
): Promise<Exclude<BlockWriteResult, "accountClosing">> {
  const targetId = await findTargetId(targetUsername);
  if (targetId === undefined) return "notFound";
  if (targetId === blockerId) return "self";
  await db
    .delete(userBlocks)
    .where(
      and(
        eq(userBlocks.blockerId, blockerId),
        eq(userBlocks.blockedId, targetId),
      ),
    );
  return "done";
}
