"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import { useAuth } from "@/app/_contexts/auth-context";
import { Button } from "@/app/[locale]/(user)/_components/button";
import { LinkButton } from "@/app/[locale]/(user)/_components/link-button";
import {
  PLAN_PAGE_HREF,
  type OfferKey,
} from "@mahjong-scoring/features/billing/plans";
import { buildSignInHref } from "@/lib/redirect";
import { localizedHref } from "@/i18n/public-path";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

import { createCheckoutSession } from "../../../(protected)/(confirmed)/mypage/plan/_actions/create-checkout-session";

interface OfferPurchaseButtonProps {
  readonly offer: OfferKey;
  /**
   * 料金ページの言語（ページが `prepareRouteLocale` で確定した値）
   *
   * サインインの戻り先とサインインページの言語、Server Action の引数に使う。
   * クライアント部品は公開状態を読まないので、ページから受け取る。
   */
  readonly locale: SupportedLocale;
}

/**
 * 売り方ごとの購入ボタン
 * 購入ボタン
 *
 * 料金ページは静的なので、ログインしているかはクライアントの認証コンテキストで
 * 決める。未ログインなら「ログインして購入」（戻り先は料金ページ）、ログイン済みなら
 * Server Action で Checkout を作って Stripe へ飛ぶ。失敗はトーストで出す
 * （文言は `plan.errors.*`）。
 *
 * 言語は props の `locale` で受ける。未ログインの導線は同じ言語のサインイン
 * ページへ張り、戻り先も同じ言語の料金ページにする（英語なら
 * `/en/sign-in?redirect=%2Fen%2Fplan`）。Checkout の作成にも言語を明示で渡し、
 * Stripe の決済画面の言語と戻り先がこのページの言語になる。
 *
 * 認証状態の解決中はボタンを押せなくする。押せる状態で出すと、未ログインなのに
 * Server Action を呼んで「ログインが必要です」が出る。
 */
export function OfferPurchaseButton({
  offer,
  locale,
}: OfferPurchaseButtonProps) {
  const t = useTranslations("plan");
  const { user, isLoading } = useAuth();
  const [isPending, startTransition] = useTransition();

  if (!isLoading && !user) {
    return (
      <LinkButton
        href={buildSignInHref(localizedHref(PLAN_PAGE_HREF, locale), locale)}
        size="lg"
        fullWidth
      >
        {t("offers.signInToBuy")}
      </LinkButton>
    );
  }

  const handleClick = () => {
    startTransition(async () => {
      const result = await createCheckoutSession(offer, locale);
      // 成功時は Server Action がリダイレクトするので、ここに戻るのは失敗だけ
      if ("error" in result) toast.error(t(`errors.${result.error}`));
    });
  };

  return (
    <Button
      size="lg"
      fullWidth
      onClick={handleClick}
      disabled={isLoading || isPending}
    >
      {t("offers.buy")}
    </Button>
  );
}
