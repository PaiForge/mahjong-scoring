import { revalidatePath } from "next/cache";

import { purgeLeaderboardCache } from "@/lib/cache-tags";

/**
 * ユーザーの状態表示を作り直す
 * 管理ユーザー再検証
 *
 * 一覧と詳細（`/admin/users/[id]`）の両方が状態（BAN・プラン）を出すので、
 * レイアウトごと再検証する。
 */
export function revalidateAdminUsers(): void {
  revalidatePath("/admin/users", "layout");
}

/**
 * BAN・BAN 解除を映す画面を作り直す
 * BAN 再検証
 *
 * 管理画面の状態表示に加えて、ランキングのキャッシュも捨てる。BAN した人は
 * ランキングに載らない（`visibleOnLeaderboard`）ので、捨てないとキャッシュの
 * 保持期間（5 分）のあいだ載り続ける。
 */
export function revalidateBanViews(): void {
  revalidateAdminUsers();
  purgeLeaderboardCache();
}

/**
 * 特典の付与・取り消しを映す画面を作り直す
 * 特典付与再検証
 *
 * 付与一覧に加えて、ユーザー詳細のプラン表示と付与一覧も更新する。
 */
export function revalidateBenefitGrantViews(): void {
  revalidatePath("/admin/benefit-grants");
  revalidateAdminUsers();
}
