/**
 * アカウント
 *
 * @description ログインの単位としてのアカウントを扱う画面（web の
 * `/mypage/account`）。ユーザー名・メールアドレスの確認と、ログアウト・退会を
 * 持つ。web と同じくマイページから開き、設定（アプリの振る舞いを変える項目）
 * には置かない。
 *
 * web と違うもの:
 * - ログアウトを置く。web はヘッダーのアカウントのメニューに置くが、
 *   アプリにはそのメニューが無い
 * - ユーザー名を出し、ユーザー名を決めていなければその設定への行を置く
 *   （アプリはログイン直後にユーザー名の設定へ送るが、途中で抜けた人の戻り口）
 *
 * ユーザー名を決めていない人・アカウントを読めなかった人（BAN 中を含む）も
 * 開ける — ログアウトと退会がここにある。ゲストには記録の案内を出す
 * （ログアウトした直後はマイページへ戻すので、ふつうは見えない）。
 * @flow マイページ → アカウント →（ユーザー名の設定 / ログアウト / 退会）
 */
import { StyleSheet } from "react-native";
import { useTranslations } from "use-intl";

import { useAuth } from "../../../auth/use-auth";
import { Screen } from "../../../components/screen";
import { RecordCtaCard } from "../../../home/record-cta-card";
import { SignedInAccount } from "../../../mypage/account-section";
import { MypageLoading } from "../../../mypage/mypage-gate";

export default function MypageAccountScreen() {
  const t = useTranslations("mypageAccount");
  const { status } = useAuth();
  return (
    <Screen title={t("pageTitle")} back contentStyle={styles.content}>
      {status === "signedIn" ? (
        <SignedInAccount />
      ) : status === "loading" ? (
        <MypageLoading />
      ) : (
        <RecordCtaCard placement="mypage" />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
});
