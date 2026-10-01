"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { HighlightPanel } from "@/app/(user)/_components/highlight-panel";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";
import { PLAN_PAGE_HREF } from "@/lib/billing/plans";
import {
  PRACTICE_QUOTA_LIMITS,
  type QuotaMenu,
} from "@/lib/practice-quota/limits";
import { buildSignInHref } from "@/lib/redirect";

import { PRACTICE_SCROLL_ANCHOR_ID } from "../_lib/scroll-anchor";
import {
  PracticeFooterAction,
  PracticeFooterActions,
} from "./practice-footer-actions";

interface PracticeQuotaPaywallProps {
  /** 練習（1 日の上限を引く） */
  readonly menu: QuotaMenu;
  /** 見出し（練習名）の辞書。`GenerationFailedNotice` と同じ */
  readonly translationNamespace: "score" | "machiScore";
  /** 使い切った上限（サーバーの返事。未ログインなら未ログインの上限） */
  readonly limit: number;
  readonly signedIn: boolean;
  readonly onBackToSetup: () => void;
}

/**
 * 無料枠を使い切ったときに盤面の代わりに出すペイウォール
 * 練習ペイウォール
 *
 * 問題は生成していないので手牌は無い。盤面と同じ外枠（`ContentContainer` +
 * `PageTitle`）に、理由・Pro の特典・導線を置く。
 *
 * - 未ログイン: 先にログインを勧める（ログインすると枠が増える）。Pro は二の次
 * - ログイン済み: Pro の料金ページへ
 *
 * ログイン後は今の play へ戻す（`buildSignInHref`）。設定を選び直させない。
 */
export function PracticeQuotaPaywall({
  menu,
  translationNamespace,
  limit,
  signedIn,
  onBackToSetup,
}: PracticeQuotaPaywallProps) {
  const t = useTranslations("practiceQuota.paywall");
  const tPractice = useTranslations(translationNamespace);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const signInHref = buildSignInHref(query ? `${pathname}?${query}` : pathname);

  return (
    <ContentContainer id={PRACTICE_SCROLL_ANCHOR_ID} fillViewport>
      <PageTitle>{tPractice("title")}</PageTitle>

      <div className="space-y-6 py-4">
        <div className="space-y-3 text-center">
          <h2 className="text-lg font-bold">{t("title")}</h2>
          <p className="text-sm leading-relaxed">
            {signedIn
              ? t("bodySignedIn", { limit })
              : t("bodyAnonymous", {
                  limit,
                  signedInLimit: PRACTICE_QUOTA_LIMITS[menu].signedIn,
                })}
          </p>
        </div>

        <HighlightPanel>
          <p className="font-bold">{t("perksTitle")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>{t("perkUnlimited")}</li>
            <li>{t("perkTools")}</li>
          </ul>
        </HighlightPanel>

        {signedIn ? (
          <LinkButton href={PLAN_PAGE_HREF} size="lg" fullWidth>
            {t("planCta")}
          </LinkButton>
        ) : (
          <div className={`flex flex-col items-center ${SUB_LINK_GAP}`}>
            <div className="flex w-full flex-col gap-3">
              <LinkButton href={signInHref} size="lg" fullWidth>
                {t("signInCta")}
              </LinkButton>
              <LinkButton href={PLAN_PAGE_HREF} variant="secondary" fullWidth>
                {t("planCta")}
              </LinkButton>
            </div>
            <p className="text-xs text-surface-500">{t("signUpHint")}</p>
          </div>
        )}

        <PracticeFooterActions>
          <PracticeFooterAction onClick={onBackToSetup}>
            {t("backToSetup")}
          </PracticeFooterAction>
        </PracticeFooterActions>
      </div>
    </ContentContainer>
  );
}
