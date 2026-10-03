import { getTranslations } from "next-intl/server";

import { CheckIcon } from "@/app/(user)/_components/icons/check-icon";
import type { RankStatus } from "@mahjong-scoring/features/ranks/rank-status";

/**
 * 状態ごとの pill の塗りと文字色。
 *
 * どれも枠を持たない。段級位のカードは帯色で縁取られており、ここに
 * このアプリ既定の ink（緑）の枠を足すと、緑の輪がその級の色に見える
 * （`BeltPill` が太枠を付けないのと同じ理由）。「次の目標」の琥珀色は
 * 教本の目次の「次はここから」バッジと同じで、「次に手を付けるもの」の
 * 記号を揃えている。
 */
const STATUS_CLASSES: Readonly<Record<RankStatus, string>> = {
  achieved: "bg-success-subtle text-success-strong",
  next: "bg-amber-200 text-amber-900",
  unachieved: "bg-surface-100 text-surface-600",
};

interface RankStatusBadgeProps {
  readonly status: RankStatus;
}

/**
 * 段級位の取得状態の pill（取得済み / 次の目標 / 未取得）
 * 段級位状態バッジ
 *
 * Server Component。段級位一覧のカードと級の詳細ページで使う。状態は色だけで
 * なく文字でも示す（色の区別に頼らない）。取得済みにはチェックを添えて、
 * 教本の目次の読了チェックと同じ「済んだ」の記号に揃える。
 */
export async function RankStatusBadge({ status }: RankStatusBadgeProps) {
  const t = await getTranslations("dojo");

  return (
    <span
      data-rank-status={status}
      className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs leading-none font-bold ${STATUS_CLASSES[status]}`}
    >
      {status === "achieved" && <CheckIcon className="size-3.5" />}
      {t(`status.${status}`)}
    </span>
  );
}
