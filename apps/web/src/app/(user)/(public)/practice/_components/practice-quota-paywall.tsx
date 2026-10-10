"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";
import { PLAN_PAGE_HREF } from "@mahjong-scoring/features/billing/plans";
import {
  PRACTICE_QUOTA_LIMITS,
  type QuotaMenu,
} from "@mahjong-scoring/features/quota/limits";
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
  readonly translationNamespace: "agariScore" | "tenpaiScore";
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

      <div className="space-y-8 py-6">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl leading-relaxed font-bold text-foreground text-balance">
            {t("title")}
          </h2>
          <p className="text-sm leading-relaxed">
            {signedIn
              ? t("bodySignedIn", { limit })
              : t("bodyAnonymous", {
                  limit,
                  signedInLimit: PRACTICE_QUOTA_LIMITS[menu].signedIn,
                })}
          </p>
        </div>

        {!signedIn && (
          <div className={`flex flex-col items-center ${SUB_LINK_GAP}`}>
            <LinkButton href={signInHref} size="lg" fullWidth>
              {t("signInCta")}
            </LinkButton>
            <p className="text-xs text-surface-500">{t("signUpHint")}</p>
          </div>
        )}

        <section className="space-y-5 rounded-panel border border-panel bg-brand-subtle p-5">
          <div>
            <h3 className="font-bold text-foreground">{t("perksTitle")}</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed">
              {["perkUnlimited", "perkTools"].map((perk) => (
                <li key={perk} className="flex gap-2">
                  <span aria-hidden="true" className="text-success">
                    ✓
                  </span>
                  <span>{t(perk)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={`flex flex-col items-center ${SUB_LINK_GAP}`}>
            <LinkButton
              href={PLAN_PAGE_HREF}
              variant={signedIn ? "primary" : "secondary"}
              size="lg"
              fullWidth
            >
              {t("planCta")}
            </LinkButton>
            <p className="text-xs text-surface-500">{t("noAutoRenew")}</p>
          </div>
        </section>

        <PracticeFooterActions>
          <PracticeFooterAction onClick={onBackToSetup}>
            {t("backToSetup")}
          </PracticeFooterAction>
        </PracticeFooterActions>
      </div>
    </ContentContainer>
  );
}
