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
import {
  FOCUS_RING_CLASSES,
  ROW_LINK_TITLE_CLASSES,
  TEXT_LINK_CLASSES,
} from "@/app/_components/_lib/link-classes";
import { ProBadge } from "@/app/(user)/_components/pro-badge";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { InfinityIcon } from "@/app/(user)/_components/icons/infinity-icon";
import {
  peekPracticeQuota,
  type BeginPracticeQuestionResult,
} from "../_actions/begin-practice-question";

/** 出題枠を消費せず、入口で実際の残量と利用条件を案内する。 */
export function PracticeEntryQuota({ menu }: { readonly menu: QuotaMenu }) {
  const t = useTranslations("practiceQuota.entry");
  const tQuota = useTranslations("practiceQuota");
  const badge = <ProBadge label={tQuota("proBadge")} />;
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
      // min-h は読み込み中から結果へ切り替わるときの高さの跳ねを抑えるため。
      // 中身が低い状態（Pro の帯）でも上下の余白が揃うよう縦に中央へ寄せる
      className="flex min-h-16 flex-col justify-center space-y-1 text-xs leading-relaxed text-surface-500"
      aria-live="polite"
    >
      {quota === undefined ? (
        <p>{t("loading")}</p>
      ) : quota === null ? (
        <p>{t("unavailable")}</p>
      ) : quota.remaining === "unlimited" ? (
        quota.benefits.includes(PlanBenefit.UnlimitedPractice) ? (
          <div className="flex items-center gap-2 rounded-lg bg-podium-gold px-3 py-2">
            <ProBadge label={tQuota("proBadge")} onGold />
            <p className="flex items-center gap-1 text-sm font-bold text-surface-900">
              <InfinityIcon className="size-4" />
              {t("proUnlimited")}
            </p>
          </div>
        ) : (
          <p className="font-bold text-primary-700">{t("unlimited")}</p>
        )
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
          <p className="pt-1">
            {/* 下線は文字にだけ引く。リンク全体に引くとバッジまで下線が掛かる */}
            <Link
              href={PLAN_PAGE_HREF}
              className={`group inline-flex items-center gap-1.5 rounded-xs ${FOCUS_RING_CLASSES}`}
            >
              {t.rich("plan", {
                badge: () => badge,
                text: (chunks) => (
                  <span className={ROW_LINK_TITLE_CLASSES}>{chunks}</span>
                ),
              })}
              <ChevronRightIcon className="size-3.5 text-surface-400 group-hover:text-foreground" />
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
