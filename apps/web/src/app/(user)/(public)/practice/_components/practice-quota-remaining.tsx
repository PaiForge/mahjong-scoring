import Link from "next/link";
import { useTranslations } from "next-intl";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { PLAN_PAGE_HREF } from "@mahjong-scoring/features/billing/plans";

interface PracticeQuotaRemainingProps {
  /** 今日の残り。Pro（`"unlimited"`）とまだ聞いていない（undefined）は出さない */
  readonly remaining: number | "unlimited" | undefined;
  /** 料金ページへのリンクを添えるか。1 問の最初の段階（解答前）だけ true を渡す */
  readonly showPlanLink: boolean;
}

/**
 * 無料枠の残り回数の表示
 * 残り回数表示
 *
 * 「今日はあと n 問」。0 なら「この問題で最後」を警告色で出す（次の問題へ
 * 進むとペイウォールになることを、押す前に気づかせる）。無制限のときは
 * 何も出さない（Pro に残数の概念はない）。
 *
 * @design 「無料」と書かない
 *
 * 「無料であと n 問」は、何か操作すると課金されると読める。残数の行は上限が
 * あることだけを伝え、Pro の説明はリンク先とペイウォールに任せる。
 *
 * @design リンクは 1 問の最初の段階だけ
 *
 * 解答後は「次の問題へ」「当てはめる」などのボタンが続けて押される。その
 * すぐ下にリンクがあると、ボタンのつもりで押して練習を離れてしまう。
 * 解答前（点数計算は回答前、聴牌形の点数計算は待ち牌を選ぶ段階）だけ出す。
 * リンクはボタン群より下にあるので、消えて詰まるのはその下だけで、
 * 押そうとしているボタンは動かない。
 *
 * `"use client"` は付けない。hooks は `useTranslations()` だけで、呼び出し元の
 * 盤面（クライアント）に取り込まれて動く。
 */
export function PracticeQuotaRemaining({
  remaining,
  showPlanLink,
}: PracticeQuotaRemainingProps) {
  const t = useTranslations("practiceQuota");
  if (typeof remaining !== "number") return null;

  return (
    <div className="space-y-1 text-center text-xs text-surface-500">
      <p className={remaining === 0 ? "font-bold text-warning" : undefined}>
        {t("remaining", { count: remaining })}
      </p>
      {showPlanLink && (
        <p>
          <Link href={PLAN_PAGE_HREF} className={TEXT_LINK_CLASSES}>
            {t("planLink")}
          </Link>
        </p>
      )}
    </div>
  );
}
