"use client";

import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { JapaneseOnlyMark } from "@/app/[locale]/(user)/_components/locale-nav-link";
import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { LinkButton } from "@/app/[locale]/(user)/_components/link-button";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";
import { PLAN_PAGE_HREF } from "@mahjong-scoring/features/billing/plans";
import {
  PRACTICE_QUOTA_LIMITS,
  type QuotaMenu,
} from "@mahjong-scoring/features/quota/limits";
import { buildSignInHref } from "@/lib/redirect";

import { usePageLocale } from "../_hooks/use-page-locale";
import { clientNavTarget } from "../_lib/client-nav-target";
import { PRACTICE_SCROLL_ANCHOR_ID } from "../_lib/scroll-anchor";
import { PracticeNavLink } from "./practice-nav-link";
import {
  PracticeFooterAction,
  PracticeFooterActions,
} from "./practice-footer-actions";

interface PracticeQuotaPaywallProps {
  /** 練習（1 日の上限を引く） */
  readonly menu: QuotaMenu;
  /** 見出し。置き換える盤面と同じ練習名（模試なら「（模試）」付き） */
  readonly title: ReactNode;
  /** 使い切った上限（サーバーの返事。未ログインなら未ログインの上限） */
  readonly limit: number;
  readonly signedIn: boolean;
  /** 末尾の戻るリンクの文言。省略時は「練習に戻る」（模試は試験の説明へ戻る） */
  readonly backLabel?: ReactNode;
  readonly onBackToSetup: () => void;
}

/**
 * 無料枠を使い切ったときに盤面の代わりに出すペイウォール
 * 練習ペイウォール
 *
 * 問題は生成していないので手牌は無い。盤面と同じ外枠（`ContentContainer` +
 * `PageTitle`）に、理由・Pro の特典・導線を置く。
 *
 * - 未ログイン: 先にログインを勧める（ログインすると枠が増える）。アカウントの無い人へ
 *   登録へのリンクを添える。Pro は二の次
 * - ログイン済み: Pro の料金ページへ
 *
 * ログイン後は今の play へ戻す（`buildSignInHref`）。設定を選び直させない。
 * 戻り先は `usePathname()`（next/navigation）なので今のページの公開 URL（英語なら
 * `/en/...`）のまま。ログイン・登録・料金がその言語で未公開なら「日本語のみ」の印付きで
 * 日本語のページへ文書ごと送る（`clientNavTarget`）。
 * 模試（`exam/<級>/training`）でも同じ画面で、見出しと戻るリンクの文言だけ
 * 呼び出し側が差し替える。
 */
export function PracticeQuotaPaywall({
  menu,
  title,
  limit,
  signedIn,
  backLabel,
  onBackToSetup,
}: PracticeQuotaPaywallProps) {
  const t = useTranslations("practiceQuota.paywall");
  const tNav = useTranslations("nav.language");
  const locale = usePageLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const signInTarget = clientNavTarget(
    buildSignInHref(query ? `${pathname}?${query}` : pathname),
    locale,
  );
  const signUpTarget = clientNavTarget("/sign-up", locale);
  const planTarget = clientNavTarget(PLAN_PAGE_HREF, locale);
  const japaneseOnly = tNav("japaneseOnly");

  return (
    <ContentContainer id={PRACTICE_SCROLL_ANCHOR_ID} fillViewport>
      <PageTitle>{title}</PageTitle>

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
            <LinkButton navTarget={signInTarget} size="lg" fullWidth>
              {t("signInCta")}
              {signInTarget.crossLocale && (
                <JapaneseOnlyMark label={japaneseOnly} />
              )}
            </LinkButton>
            <PracticeNavLink
              navTarget={signUpTarget}
              className={`text-sm ${TEXT_LINK_CLASSES}`}
            >
              {t("signUpLink")}
            </PracticeNavLink>
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
              navTarget={planTarget}
              variant={signedIn ? "primary" : "secondary"}
              size="lg"
              fullWidth
            >
              {t("planCta")}
              {planTarget.crossLocale && (
                <JapaneseOnlyMark label={japaneseOnly} />
              )}
            </LinkButton>
            <p className="text-xs text-surface-500">{t("noAutoRenew")}</p>
          </div>
        </section>

        <PracticeFooterActions>
          <PracticeFooterAction onClick={onBackToSetup}>
            {backLabel ?? t("backToSetup")}
          </PracticeFooterAction>
        </PracticeFooterActions>
      </div>
    </ContentContainer>
  );
}
