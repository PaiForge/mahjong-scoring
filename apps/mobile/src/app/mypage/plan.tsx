import { StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useTranslations } from "use-intl";

import { IAP_AVAILABLE } from "../../billing/iap-availability";
import { PlanScreenBody } from "../../billing/plan-screen";
import { Screen } from "../../components/screen";
import { MypageGate } from "../../mypage/mypage-gate";

/**
 * Pro プラン
 *
 * @description
 * web の購入状況（`/mypage/plan`）に App Store での購入と復元を足した画面。
 * 現在の状態・2 つの商品（30 日パス / 買い切り）・ご購入前に・購入を復元・
 * 購入履歴を並べる。中身と web との違いは `PlanScreenBody` の TSDoc。
 *
 * iOS だけの画面（Android は Pro を扱わない）。マイページに行が出ないので
 * Android から来ることは無いが、ディープリンクで開かれたらマイページへ戻す。
 * ゲストとユーザー名を決めていない人には、マイページと同じく記録の案内を出す
 * （購入はユーザー名を決めた人だけ）。
 *
 * @flow
 * 1. マイページの「Pro プラン」の行から開く
 * 2. 「購入する」で App Store の購入画面 → 取引が記録されると状態と履歴が変わる
 * 3. 買い切りを別の端末で買った・入れ直したときは「購入を復元」
 */
export default function MypagePlanScreen() {
  const t = useTranslations("mobilePlan");
  if (!IAP_AVAILABLE) return <Redirect href="/mypage" />;
  return (
    <Screen title={t("title")} back contentStyle={styles.content}>
      <MypageGate>{(userId) => <PlanScreenBody userId={userId} />}</MypageGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
});
