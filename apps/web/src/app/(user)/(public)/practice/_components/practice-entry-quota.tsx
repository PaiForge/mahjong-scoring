"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  PlanBenefit,
  PLAN_PAGE_HREF,
} from "@mahjong-scoring/features/billing/plans";
import {
  PRACTICE_QUOTA_LIMITS,
  type QuotaMenu,
} from "@mahjong-scoring/features/quota/limits";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import {
  peekPracticeQuota,
  type BeginPracticeQuestionResult,
} from "../_actions/begin-practice-question";

/** 出題枠を消費せず、入口で実際の残量と利用条件を案内する。 */
export function PracticeEntryQuota({ menu }: { readonly menu: QuotaMenu }) {
  const t = useTranslations("practiceQuota.entry");
  const [quota, setQuota] = useState<BeginPracticeQuestionResult | null>();
  useEffect(() => {
    let active = true;
    let sequence = 0;
    const refresh = async () => {
      const request = ++sequence;
      try {
        const result = await peekPracticeQuota(menu);
        if (active && request === sequence)
          setQuota("error" in result ? null : result);
      } catch {
        if (active && request === sequence) setQuota(null);
      }
    };
    const refreshVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    void refresh();
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    // 日付変更や別タブでの利用も、開いたままの入口に反映する。
    const timer = window.setInterval(refreshVisible, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [menu]);

  return (
    <div
      className="min-h-16 space-y-1 text-xs leading-relaxed text-surface-500"
      aria-live="polite"
    >
      {quota === undefined ? (
        <p>{t("loading")}</p>
      ) : quota === null ? (
        <p>{t("unavailable")}</p>
      ) : quota.remaining === "unlimited" ? (
        <p className="font-bold text-primary-700">
          {t(
            quota.benefits.includes(PlanBenefit.UnlimitedPractice)
              ? "proUnlimited"
              : "unlimited",
          )}
        </p>
      ) : (
        <>
          <p className="font-bold text-surface-900">
            {quota.remaining === 0
              ? t("exhausted")
              : t("remaining", {
                  remaining: quota.remaining,
                  limit: quota.limit,
                })}
          </p>
          {quota.remaining === 0 && <p>{t("reset")}</p>}
          {!quota.signedIn && (
            <p>
              <Link href="/sign-in" className={TEXT_LINK_CLASSES}>
                {t("signIn", { limit: PRACTICE_QUOTA_LIMITS[menu].signedIn })}
              </Link>
            </p>
          )}
          <p>
            <Link href={PLAN_PAGE_HREF} className={TEXT_LINK_CLASSES}>
              {t("plan")}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
