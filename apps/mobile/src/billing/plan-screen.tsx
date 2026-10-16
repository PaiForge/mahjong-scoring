import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useFormatter, useTranslations } from "use-intl";
import type {
  MobilePlanOffer,
  MobilePlanPurchase,
  MobilePlanResponse,
  MobilePlanStatus,
} from "@mahjong-scoring/features/billing/mobile-api";

import { Button } from "../components/button";
import { DataTable } from "../components/data-table";
import { SectionTitle } from "../components/section-title";
import { showToast } from "../components/toast";
import { panelFrame } from "../lib/panel-styles";
import { colors } from "../lib/theme";
import { MypageLoadFailed, MypageLoading } from "../mypage/mypage-gate";
import {
  IapErrorCode,
  fetchIapProducts,
  onIapPurchaseError,
  requestIapPurchase,
  type IapProduct,
} from "./iap";
import { planLineupOf, planNoteKeysOf, type PlanLineup } from "./plan-lineup";
import { usePlan } from "./use-plan";
import { restoreIapPurchases, usePurchaseRecording } from "./use-purchase-sync";

/**
 * プラン画面の中身（ログイン中でユーザー名を決めた人）
 * プラン画面
 *
 * web の購入状況（`/mypage/plan`）と同じ構成に、購入と復元を足したもの:
 * 現在の状態 → プランを選ぶ → ご購入前に → 購入を復元 → 購入履歴。
 *
 * web と違うもの:
 * - 購入は App Store のアプリ内課金で、この画面の中で行う。価格は StoreKit の
 *   `displayPrice`（端末の地域の通貨）で、web の価格・料金ページ・特定商取引法の
 *   表記・Stripe には触れない（審査ガイドライン 3.1.1。アプリの外での購入への
 *   誘導と読まれうる）
 * - 購入履歴に金額の列が無い（web の価格が見えると App Store の価格との差が
 *   問い合わせの種になる）。購入元（Web / App Store）は出す
 * - 運営からの付与は状態にだけ出し、付与の表は持たない
 *
 * 購入の結果はここでは待たない。届いた取引はルートの購入の同期
 * （`usePurchaseSync`）が記録し、記録できたらこの画面が読み直す。
 */
export function PlanScreenBody({ userId }: { readonly userId: string }) {
  const t = useTranslations("mobilePlan");
  const { state, reload } = usePlan(userId);
  if (state.kind === "loading") return <MypageLoading />;
  if (state.kind === "failed")
    return <MypageLoadFailed message={t("loadFailed")} onRetry={reload} />;
  return <PlanBody userId={userId} plan={state.value} />;
}

function PlanBody({
  userId,
  plan,
}: {
  readonly userId: string;
  readonly plan: MobilePlanResponse;
}) {
  const t = useTranslations("mobilePlan");
  const recording = usePurchaseRecording();
  const onSale = plan.offers.length > 0;
  const lineup = planLineupOf(plan.offers);
  return (
    <>
      {recording && <RecordingNotice />}
      <View style={styles.section}>
        <SectionTitle>{t("status.title")}</SectionTitle>
        <StatusCard status={plan.status} />
      </View>
      {onSale && (
        <View style={styles.section}>
          <SectionTitle>{t("offers.title")}</SectionTitle>
          {plan.canPurchase ? (
            <Offers
              userId={userId}
              offers={plan.offers}
              lineup={lineup}
              busy={recording}
            />
          ) : (
            <Text style={styles.body}>
              {lineup === "lifetimeOnly"
                ? t("alreadyActiveLifetimeOnly")
                : t("alreadyActive")}
            </Text>
          )}
        </View>
      )}
      {onSale && <Notes lineup={lineup} />}
      <Restore userId={userId} lineup={lineup} busy={recording} />
      <History purchases={plan.purchases} />
    </>
  );
}

/** 購入の直後の取引を記録している間の知らせ（通信に失敗して送り直している間も出る） */
function RecordingNotice() {
  const t = useTranslations("mobilePlan");
  return (
    <View style={[panelFrame, styles.notice]} accessibilityRole="alert">
      <ActivityIndicator color={colors.action} />
      <Text style={styles.noticeText}>{t("recording")}</Text>
    </View>
  );
}

/** 現在の状態の見出しと 1 行の説明 */
function StatusCard({ status }: { readonly status: MobilePlanStatus }) {
  const t = useTranslations("mobilePlan.status");
  const format = useFormatter();
  const dateOf = (iso: string) =>
    format.dateTime(new Date(iso), {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const [heading, hint] = ((): readonly [string, string] => {
    switch (status.kind) {
      case "free":
        return [t("free"), t("freeHint")];
      case "pass":
        return [t("pass", { until: dateOf(status.until) }), t("passHint")];
      case "lifetime":
        return [t("lifetime"), t("lifetimeHint")];
      case "granted":
        return [
          status.until === undefined
            ? t("granted")
            : t("grantedUntil", { until: dateOf(status.until) }),
          t("grantedHint"),
        ];
      default: {
        const exhaustive: never = status;
        return exhaustive;
      }
    }
  })();
  return (
    <View style={[panelFrame, styles.card]} testID="plan-status">
      <Text style={styles.statusHeading}>{heading}</Text>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

/**
 * 商品の価格を StoreKit から読む。読み終えるまで undefined
 *
 * 価格が返らない商品（App Store Connect で未承認・StoreKit の設定が無い等）は
 * 結果の中に無く、画面は「価格は購入画面でご確認ください」を出す。
 */
function useIapProducts(
  offers: readonly MobilePlanOffer[],
): ReadonlyMap<string, IapProduct> | undefined {
  const [products, setProducts] = useState<
    ReadonlyMap<string, IapProduct> | undefined
  >();
  const key = offers.map(({ productId }) => productId).join(",");
  useEffect(() => {
    let active = true;
    void fetchIapProducts(key.split(",")).then((fetched) => {
      if (active)
        setProducts(
          new Map(fetched.map((product) => [product.productId, product])),
        );
    });
    return () => {
      active = false;
    };
  }, [key]);
  return products;
}

/** 販売中の商品（30 日パス・買い切り、または買い切りだけ）のカードと購入ボタン */
function Offers({
  userId,
  offers,
  lineup,
  busy,
}: {
  readonly userId: string;
  readonly offers: readonly MobilePlanOffer[];
  readonly lineup: PlanLineup;
  /** 取引を記録している間。重ねて買わせない */
  readonly busy: boolean;
}) {
  const t = useTranslations("mobilePlan.offers");
  const tPlan = useTranslations("mobilePlan");
  const products = useIapProducts(offers);
  const [purchasing, setPurchasing] = useState(false);

  // 取り消しは知らせない（本人が閉じただけ）。承認待ち（Ask to Buy）は承認されたら
  // 購入の同期が記録するので、待っていることだけ伝える
  useEffect(
    () =>
      onIapPurchaseError((code) => {
        if (code === IapErrorCode.UserCancelled) return;
        showToast(
          code === IapErrorCode.DeferredPayment
            ? tPlan("purchaseDeferred")
            : tPlan("purchaseFailed"),
        );
      }),
    [tPlan],
  );

  const buy = (productId: string) => {
    setPurchasing(true);
    void requestIapPurchase(productId, userId).finally(() =>
      setPurchasing(false),
    );
  };

  return (
    <View style={styles.offers}>
      <Text style={styles.hint}>
        {lineup === "lifetimeOnly" ? t("sharedLifetimeOnly") : t("shared")}
      </Text>
      {offers.map(({ key, productId }) => {
        const price = products?.get(productId)?.displayPrice;
        return (
          <View
            key={key}
            style={[panelFrame, styles.card]}
            testID={`plan-offer-${key}`}
          >
            <Text style={styles.offerTitle}>{t(`${key}.title`)}</Text>
            <Text style={styles.body}>{t(`${key}.description`)}</Text>
            {key === "lifetime" && (
              <Text style={styles.hint}>{t("lifetimeScope")}</Text>
            )}
            {products === undefined ? (
              <ActivityIndicator
                color={colors.surface400}
                style={styles.priceLoading}
              />
            ) : price === undefined ? (
              <Text style={styles.hint}>{t("priceUnavailable")}</Text>
            ) : (
              <Text style={styles.price}>{price}</Text>
            )}
            <Button
              size="lg"
              fullWidth
              disabled={purchasing || busy}
              testID={`plan-buy-${key}`}
              onPress={() => buy(productId)}
            >
              {t("buy")}
            </Button>
          </View>
        );
      })}
    </View>
  );
}

/** ご購入前に（購入の条件） */
function Notes({ lineup }: { readonly lineup: PlanLineup }) {
  const t = useTranslations("mobilePlan.notes");
  const keys = planNoteKeysOf(lineup);
  return (
    <View style={styles.section}>
      <SectionTitle>{t("title")}</SectionTitle>
      <View style={styles.notes}>
        {keys.map((key) => (
          <View key={key} style={styles.noteRow}>
            <Text style={styles.hint}>・</Text>
            <Text style={[styles.hint, styles.noteText]}>{t(key)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** 購入を復元 */
function Restore({
  userId,
  lineup,
  busy,
}: {
  readonly userId: string;
  readonly lineup: PlanLineup;
  readonly busy: boolean;
}) {
  const t = useTranslations("mobilePlan");
  const [restoring, setRestoring] = useState(false);

  const restore = () => {
    setRestoring(true);
    void restoreIapPurchases(userId)
      .then((summary) => {
        switch (summary) {
          case "restored":
            showToast(t("restored"), "success");
            return;
          case "ownedByAnotherAccount":
            showToast(t("ownedByAnotherAccount"));
            return;
          case "failed":
            showToast(t("restoreFailed"));
            return;
          case "nothingToRestore":
            showToast(t("nothingToRestore"));
            return;
          default: {
            const exhaustive: never = summary;
            return exhaustive;
          }
        }
      })
      .finally(() => setRestoring(false));
  };

  return (
    <View style={styles.section}>
      <SectionTitle>{t("restore.title")}</SectionTitle>
      <View style={styles.restore}>
        <Button
          variant="neutral"
          fullWidth
          disabled={restoring || busy}
          testID="plan-restore"
          onPress={restore}
        >
          {t("restore.button")}
        </Button>
        <Text style={styles.hint}>
          {lineup === "lifetimeOnly"
            ? t("restore.hintLifetimeOnly")
            : t("restore.hint")}
        </Text>
      </View>
    </View>
  );
}

/** 購入履歴（金額の列は持たない） */
function History({
  purchases,
}: {
  readonly purchases: readonly MobilePlanPurchase[];
}) {
  const t = useTranslations("mobilePlan.history");
  const format = useFormatter();
  return (
    <View style={styles.section} testID="plan-history">
      <SectionTitle>{t("title")}</SectionTitle>
      {purchases.length === 0 ? (
        <Text style={styles.hint}>{t("empty")}</Text>
      ) : (
        <DataTable
          columns={[
            { label: t("date"), flex: 1.3 },
            { label: t("item"), flex: 1.1 },
            { label: t("provider"), flex: 1.1 },
            { label: t("state"), align: "center" },
          ]}
          rows={purchases.map((purchase) => [
            format.dateTime(new Date(purchase.createdAt), {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }),
            t(`kind.${purchase.kind}`),
            t(`providers.${purchase.provider}`),
            t(`states.${purchase.state}`),
          ])}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  card: {
    gap: 8,
    padding: 16,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: colors.brandSubtle,
  },
  noticeText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "600",
    color: colors.brandSubtleForeground,
  },
  statusHeading: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.surface900,
  },
  offers: {
    gap: 12,
  },
  offerTitle: {
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "700",
    color: colors.surface900,
  },
  price: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "700",
    color: colors.surface900,
    fontVariant: ["tabular-nums"],
  },
  priceLoading: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface700,
  },
  hint: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.surface600,
  },
  notes: {
    gap: 6,
  },
  noteRow: {
    flexDirection: "row",
  },
  noteText: {
    flex: 1,
  },
  restore: {
    gap: 8,
  },
});
