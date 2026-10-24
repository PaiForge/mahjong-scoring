import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

import { refreshAccount, useAuth } from "../auth/use-auth";
import { LoadingIndicator } from "../components/load-state";
import { TextLink } from "../components/text-link";
import { RecordCtaCard } from "../home/record-cta-card";
import { BanNotice } from "./ban-notice";
import { colors } from "../lib/theme";

/**
 * マイページの各画面の入口の振り分け
 * マイページゲート
 *
 * マイページ（トップ・マイレコード）は記録が残る人（ログイン中でユーザー名を
 * 決めた人）のもの。web はそれ以外の人を開かせないが、アプリはホームの
 * ヘッダーから誰でも押せる入口を置くので、ゲストとユーザー名を決めていない
 * 人には記録の案内（ホームと同じ `RecordCtaCard`）を中身の代わりに出す。
 * `preview` を渡すと、案内の下にそれ（登録すると並ぶ中身の見本）を添える。
 *
 * 記録が残る人にだけ `children` を呼ぶ。ユーザーが変わったら前のユーザーの
 * 値を持ち越さないよう、userId を key にして描き直す。
 */
export function MypageGate({
  preview,
  children,
}: {
  /** 記録が残らない人に、記録の案内の下へ添える中身の見本 */
  readonly preview?: ReactNode;
  readonly children: (userId: string) => ReactNode;
}) {
  const { status, user, account, accountError } = useAuth();
  if (status === "signedOut") return <RecordCta preview={preview} />;
  if (status !== "signedIn" || user === undefined) return <LoadingIndicator />;
  if (account === undefined) {
    return accountError === undefined ? (
      <LoadingIndicator />
    ) : (
      <AccountLoadFailed banned={accountError === "banned"} />
    );
  }
  if (account.profile === null) return <RecordCta preview={preview} />;
  return (
    <View key={user.id} style={styles.content}>
      {children(user.id)}
    </View>
  );
}

/** 記録の案内と、渡されていればその下の見本 */
function RecordCta({ preview }: { readonly preview: ReactNode }) {
  return (
    <>
      <RecordCtaCard placement="mypage" />
      {preview}
    </>
  );
}

/**
 * アカウント状態を読めなかったとき。BAN 中は停止の知らせ（理由つき。ログアウトと
 * 退会はマイページの下のアカウントの行から）
 */
function AccountLoadFailed({ banned }: { readonly banned: boolean }) {
  const t = useTranslations("settings.account");
  if (banned) return <BanNotice />;
  return (
    <MypageLoadFailed
      message={t("loadFailed")}
      onRetry={() => void refreshAccount()}
    />
  );
}

/**
 * 読み込めなかったとき（マイページの各画面で共通）
 *
 * @param onRetry - 渡すと「もう一度読み込む」を出す
 */
export function MypageLoadFailed({
  message,
  onRetry,
}: {
  readonly message: string;
  readonly onRetry?: () => void;
}) {
  const t = useTranslations("mypage");
  return (
    <View style={styles.failed}>
      <Text style={styles.failedText}>{message}</Text>
      {onRetry !== undefined && (
        <TextLink onPress={onRetry}>{t("retry")}</TextLink>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // 画面の本文と同じ間隔で子を並べる（Screen の contentStyle の gap が
  // この View の中には効かないため）
  content: {
    gap: 32,
  },
  failed: {
    alignItems: "flex-start",
    gap: 4,
  },
  failedText: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.destructiveStrong,
  },
});
