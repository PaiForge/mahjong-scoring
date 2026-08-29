import "server-only";

import { getOptionalUser } from "@/lib/auth";
import { getUserRankSlugs } from "@/lib/db/rank-queries";
import type { RankSlug } from "@/lib/ranks/registry";

/**
 * 取得済みの段級位スラッグを返す。未認証なら空。
 * 取得済み段級位取得
 *
 * ダッシュボードの導線（`selectDashboardGuidance`）が「次に取る級」を決める
 * のに使う。`getUserRankSlugs` は userId を要求するため、他の
 * `fetch*`（読了章・挑戦済み練習）と同じく認証の有無をここで吸収して、
 * 呼び出し側が引数なしで揃えて呼べるようにする。
 */
export async function fetchAchievedRankSlugs(): Promise<readonly RankSlug[]> {
  const user = await getOptionalUser();
  if (!user) return [];

  return getUserRankSlugs(user.id);
}
