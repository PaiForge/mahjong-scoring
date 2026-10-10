import { and, eq, isNull, sql, type SQL } from "drizzle-orm";

import { db } from "./index";
import { profiles } from "./schema";

/**
 * ランキングの母集団に入る条件
 * ランキング可視条件
 *
 * 本人が非表示にしておらず（`profiles.hidden_from_leaderboard`）、BAN も
 * 退会もしていないこと。この条件を書く唯一の定義で、ランキングを読む
 * クエリはすべてここを通す。ページングするクエリは一覧側と件数側の
 * 両方に通すこと（片方だけだと `total` が実際に見える行数とずれ、
 * 末尾に空ページができる）。
 *
 * BAN した人の成績は消さずに残す（解除すれば順位も戻る）。公開プロフィールが
 * BAN で 404 になるのと同じく、ランキングからも見えなくする。退会は成績を
 * 消すので通常は条件に掛からないが、受付から削除の工程が終わるまでの間も
 * 載せないよう含めている。
 */
export function visibleOnLeaderboard() {
  return and(
    eq(profiles.hiddenFromLeaderboard, false),
    isNull(profiles.bannedAt),
    isNull(profiles.deletedAt),
  );
}

/**
 * 生 SQL のランキング元に付ける profiles の内部結合を返す
 * ランキング可視結合（生 SQL）
 *
 * `ROW_NUMBER()` で順位を振るクエリは Drizzle のクエリビルダで書けないため、
 * そちらには述語ではなくこの結合を渡す。条件は {@link visibleOnLeaderboard} と
 * 同じものを書く。順位は母集団の行位置で決まるので、結合は必ず
 * `ROW_NUMBER` を回す前（＝母集団を作る FROM 句）に入れる。
 *
 * 別名は生 SQL へそのまま埋め込む。外部入力が混じらないよう、引数の型を
 * コード中のリテラルだけが通る形に絞ってある（`user-rank-queries.ts` の
 * `RankedSourceAlias` と同じ理由）。
 *
 * @param sourceAlias - `user_id` を持つ側の関係名または別名
 */
export function visibleProfileJoinSql(
  sourceAlias: "challenge_best_scores" | "challenge_results",
): SQL {
  return sql`
    INNER JOIN profiles lb_profile
      ON lb_profile.id = ${sql.raw(sourceAlias)}.user_id
     AND NOT lb_profile.hidden_from_leaderboard
     AND lb_profile.banned_at IS NULL
     AND lb_profile.deleted_at IS NULL
  `;
}

/**
 * ユーザーがランキング非表示に設定しているかを返す
 * ランキング非表示判定
 *
 * プロフィールが無い（未作成・退会済み）場合は false を返す。表示するものが
 * 無いだけで「本人が隠した」わけではないため、設定の初期値と同じに寄せる。
 */
export async function isHiddenFromLeaderboard(
  userId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ hiddenFromLeaderboard: profiles.hiddenFromLeaderboard })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return row?.hiddenFromLeaderboard ?? false;
}
