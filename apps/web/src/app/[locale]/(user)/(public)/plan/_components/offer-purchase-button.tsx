"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import { SkeletonBar } from "@/app/_components/skeleton-bar";
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
import { formatJstDateLong } from "@mahjong-scoring/features/jst";
import type { ViewerPurchaseBlock } from "@/lib/billing/viewer-plan";

import { createCheckoutSession } from "../../../(protected)/(confirmed)/mypage/plan/_actions/create-checkout-session";

import { useViewerPlan } from "./viewer-plan-provider";

/**
 * 購入の面の高さ（`Button` の `size="lg"` と同じ）
 *
 * 解決中のスケルトンと、ボタンの代わりに出す状態の表示がこの高さを共有する。
 * ボタン・リンク・状態のどれに確定しても同じ大きさで座り、カードの高さが動かない。
 */
const PURCHASE_SLOT_MIN_HEIGHT_CLASS = "min-h-[46px]";

/** ボタンの代わりに出す状態の表示（利用中は補助面の淡緑、それ以外は地のまま） */
function PurchaseSlotStatus({
  inUse,
  children,
}: {
  readonly inUse: boolean;
  readonly children: string;
}) {
  return (
    <p
      className={`flex ${PURCHASE_SLOT_MIN_HEIGHT_CLASS} items-center justify-center rounded-lg px-4 py-2 text-center text-sm ${
        inUse ? "bg-brand-subtle font-bold" : "bg-surface-50 text-surface-600"
      }`}
    >
      {children}
    </p>
  );
}

/**
 * 売らない理由があるときに、この売り方のカードへ出す文言
 * 購入停止時の表示
 *
 * - 買い切りを持つ: 買い切りのカードは「利用中」、パスのカードは「購入は不要」
 * - 期限付きの購入がある: パスのカードは「利用中（◯日まで）」（開始待ちだけなら
 *   「開始待ち」）、買い切りのカードは「◯日以降に購入できます」
 *
 * 買い切りのカードをパスの期間中に「利用中」とはしない — 買い切りは持っておらず、
 * 期限後には買えるため。期間中に売らないのはサーバーの規則（`blocksNewPurchase`）。
 */
function blockedLabelOf(
  block: Exclude<ViewerPurchaseBlock, { readonly kind: "none" }>,
  offer: OfferKey,
  locale: SupportedLocale,
  t: ReturnType<typeof useTranslations<"plan">>,
): { readonly inUse: boolean; readonly label: string } {
  if (block.kind === "lifetime") {
    return offer === "lifetime"
      ? { inUse: true, label: t("offers.inUse") }
      : { inUse: false, label: t("offers.notNeeded") };
  }
  const until = formatJstDateLong(new Date(block.until), locale);
  if (offer === "lifetime") {
    return { inUse: false, label: t("offers.availableAfter", { until }) };
  }
  return block.inUse
    ? { inUse: true, label: t("offers.inUseUntil", { until }) }
    : { inUse: false, label: t("offers.scheduled") };
}

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
 * 料金ページは静的なので、ログインしているか・購入済みかはクライアントで決める
 * （認証コンテキストと `ViewerPlanProvider`）。未ログインなら「ログインして購入」
 * （戻り先は料金ページ）、ログイン済みで売れるなら Server Action で Checkout を
 * 作って Stripe へ飛ぶ。失敗はトーストで出す（文言は `plan.errors.*`）。
 *
 * 有効な購入があって売らない間は、ボタンの代わりに状態を出す（{@link blockedLabelOf}）。
 * 押してから「追加購入はできません」と知らせない。出し分けの規則はサーバーの拒否と
 * 同じ（`purchaseBlockOf`）で、運営からの付与だけの人にはボタンを出す。状態の取得に
 * 失敗したときもボタンを出す（押した先でサーバーが拒む）。
 *
 * 言語は props の `locale` で受ける。未ログインの導線は同じ言語のサインイン
 * ページへ張り、戻り先も同じ言語の料金ページにする（英語なら
 * `/en/sign-in?redirect=%2Fen%2Fplan`）。Checkout の作成にも言語を明示で渡し、
 * Stripe の決済画面の言語と戻り先がこのページの言語になる。
 *
 * 認証状態と購入の状態の解決中はスケルトンを出す。押せるボタンを先に出すと、
 * 未ログインなのに Server Action を呼んで「ログインが必要です」が出たり、
 * 購入済みの人が押せたりする。無効のボタンを出すと、購入済みの人には
 * 「購入する」が一度見えてから表示が変わる。
 */
export function OfferPurchaseButton({
  offer,
  locale,
}: OfferPurchaseButtonProps) {
  const t = useTranslations("plan");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  const { isPending: isPlanPending, plan, refresh } = useViewerPlan();
  const [isPending, startTransition] = useTransition();

  if (isPlanPending) {
    return (
      <SkeletonBar
        radius="lg"
        className={`${PURCHASE_SLOT_MIN_HEIGHT_CLASS} w-full`}
      />
    );
  }

  if (!user) {
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

  if (plan && plan.purchaseBlock.kind !== "none") {
    const { inUse, label } = blockedLabelOf(
      plan.purchaseBlock,
      offer,
      locale,
      t,
    );
    return <PurchaseSlotStatus inUse={inUse}>{label}</PurchaseSlotStatus>;
  }

  const handleClick = () => {
    startTransition(async () => {
      const result = await createCheckoutSession(offer, locale);
      // 成功時は Server Action がリダイレクトするので、ここに戻るのは失敗だけ
      if (!("error" in result)) return;
      // 有効な購入を理由に拒まれた（別の端末・アプリで買った、決済済みで記録が
      // 追いついた）なら、状態を取り直してボタンを「利用中」の表示に替える
      if (
        result.error === "alreadyActive" ||
        result.error === "checkoutPending"
      ) {
        void refresh();
      }
      // 認証サーバーか DB が答えられなかったときは全アクション共通の文言。
      // それ以外の完成形のキー: plan.errors.unauthorized / plan.errors.checkoutFailed 等
      toast.error(
        result.error === "serviceUnavailable"
          ? tCommon("serviceUnavailable")
          : t(`errors.${result.error}`),
      );
    });
  };

  return (
    <Button size="lg" fullWidth onClick={handleClick} disabled={isPending}>
      {t("offers.buy")}
    </Button>
  );
}
