"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  hasUnlimitedPractice,
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
import { PlanBadge } from "@/app/_components/plan-badges";
import { ChevronRightIcon } from "@/app/[locale]/(user)/_components/icons/chevron-right-icon";
import { InfinityIcon } from "@/app/[locale]/(user)/_components/icons/infinity-icon";
import {
  peekPracticeQuota,
  type BeginPracticeQuestionResult,
} from "../_actions/begin-practice-question";
import { usePageLocale } from "../_hooks/use-page-locale";
import { clientNavTarget, signInNavTarget } from "../_lib/client-nav-target";
import { PracticeNavLink } from "./practice-nav-link";

/**
 * 出題枠を消費せず、入口で実際の残量と利用条件を案内する。
 *
 * ログイン・料金への導線は、その言語で未公開なら「日本語のみ」の印付きで日本語の
 * ページへ送る（`clientNavTarget`）。ログインは英語のページへ戻れるよう、今の
 * ページの公開 URL（`usePathname()` は `/en/...` の形）を戻り先に載せる。
 */
export function PracticeEntryQuota({
  menu,
  planLink = "always",
}: {
  readonly menu: QuotaMenu;
  /**
   * 回数に制限のある利用者へ料金のリンクをいつ出すか
   *
   * - `"always"`（既定）: 残りがあっても出す。練習の入口・一覧のカードはこれ
   * - `"whenExhausted"`: 今日の分を使い切った（残り 0）ときだけ出す
   *
   * `"whenExhausted"` は本日の問題の解答後の導線のための指定。本日の問題は
   * 回数を使わない 1 問で、解き終えた人に「続けて練習できる」ことを残り回数ごと
   * 見せたいが、常に料金のリンクが並ぶと販売の色が強すぎる。使い切ったときは
   * 続ける手段が料金しか無いので出す。回数無制限（Pro・付与）の利用者には
   * どちらの指定でも金色の帯（回数無制限）がそのまま出て、料金のリンクは出ない。
   */
  readonly planLink?: "always" | "whenExhausted";
}) {
  const t = useTranslations("practiceQuota.entry");
  const tQuota = useTranslations("practiceQuota");
  const locale = usePageLocale();
  const pathname = usePathname();
  const signInTarget = signInNavTarget(locale, pathname);
  const planTarget = clientNavTarget(PLAN_PAGE_HREF, locale);
  const badge = <PlanBadge badge="pro" label={tQuota("proBadge")} />;
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
        hasUnlimitedPractice(quota.benefits) ? (
          <div className="flex items-center gap-2 rounded-lg bg-podium-gold px-3 py-2">
            <PlanBadge badge="pro" label={tQuota("proBadge")} onGold />
            <p className="flex items-center gap-1 text-sm font-bold text-surface-900">
              <InfinityIcon className="size-4" />
              {t("proUnlimited")}
            </p>
          </div>
        ) : (
          <p className="font-bold text-foreground">{t("unlimited")}</p>
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
              <PracticeNavLink
                navTarget={signInTarget}
                className={TEXT_LINK_CLASSES}
              >
                {t("signIn", { limit: PRACTICE_QUOTA_LIMITS[menu].signedIn })}
              </PracticeNavLink>
            </p>
          )}
          {(planLink === "always" || quota.remaining === 0) && (
            <p className="pt-1">
              {/* 下線は文字にだけ引く。リンク全体に引くとバッジまで下線が掛かる */}
              <PracticeNavLink
                navTarget={planTarget}
                className={`group inline-flex items-center gap-1.5 rounded-xs ${FOCUS_RING_CLASSES}`}
              >
                {t.rich("plan", {
                  badge: () => badge,
                  text: (chunks) => (
                    <span className={ROW_LINK_TITLE_CLASSES}>{chunks}</span>
                  ),
                })}
                <ChevronRightIcon className="size-3.5 text-surface-400 group-hover:text-foreground" />
              </PracticeNavLink>
            </p>
          )}
        </>
      )}
    </div>
  );
}
