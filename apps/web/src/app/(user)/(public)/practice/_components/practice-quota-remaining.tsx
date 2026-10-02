import Link from "next/link";
import { useTranslations } from "next-intl";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { PLAN_PAGE_HREF } from "@/lib/billing/plans";

interface PracticeQuotaRemainingProps {
  /** 今日の残り。Pro（`"unlimited"`）とまだ聞いていない（undefined）は出さない */
  readonly remaining: number | "unlimited" | undefined;
  /** 料金ページへのリンクを添えるか。盤面が最初の 1 問に解答するまで true を渡す */
  readonly showPlanLink: boolean;
}

/**
 * 無料枠の残り回数の表示
 * 残り回数表示
 *
 * 「今日はあと n 問」。0 なら「この問題で最後」。無制限のときは何も出さない
 * （Pro に残数の概念はない）。
 *
 * @design 「無料」と書かない
 *
 * 「無料であと n 問」は、何か操作すると課金されると読める。残数の行は上限が
 * あることだけを伝え、Pro の説明はリンク先とペイウォールに任せる。
 *
 * @design リンクは最初の 1 問だけ
 *
 * 毎問出すと解答のたびに目に入る宣伝になる。同じ行の末尾に置くので、
 * 消えても行の幅が縮むだけで縦のレイアウトはずれない。
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
    <p className="text-center text-xs text-surface-500">
      {t("remaining", { count: remaining })}
      {showPlanLink && (
        <>
          <span aria-hidden className="mx-1.5">
            ・
          </span>
          <Link href={PLAN_PAGE_HREF} className={TEXT_LINK_CLASSES}>
            {t("planLink")}
          </Link>
        </>
      )}
    </p>
  );
}
