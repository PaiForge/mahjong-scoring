import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

import { refreshAccount, useAuth } from "../auth/use-auth";
import { TextLink } from "../components/text-link";
import { RecordCtaCard } from "../home/record-cta-card";
import { colors } from "../lib/theme";

/**
 * マイページの各画面の入口の振り分け
 * マイページゲート
 *
 * マイページ（トップ・マイレコード）は記録が残る人（ログイン中でユーザー名を
 * 決めた人）のもの。web はそれ以外の人を開かせないが、アプリはホームの
 * ヘッダーから誰でも押せる入口を置くので、ゲストとユーザー名を決めていない
 * 人には記録の案内（ホームと同じ `RecordCtaCard`）を中身の代わりに出す。
 *
 * 記録が残る人にだけ `children` を呼ぶ。ユーザーが変わったら前のユーザーの
 * 値を持ち越さないよう、userId を key にして描き直す。
 */
export function MypageGate({
  children,
}: {
  readonly children: (userId: string) => ReactNode;
}) {
  const { status, user, account, accountError } = useAuth();
  if (status === "signedOut") return <RecordCtaCard testIDPrefix="mypage" />;
  if (status !== "signedIn" || user === undefined) return <MypageLoading />;
  if (account === undefined) {
    return accountError === undefined ? (
      <MypageLoading />
    ) : (
      <AccountLoadFailed banned={accountError === "banned"} />
    );
  }
  if (account.profile === null) return <RecordCtaCard testIDPrefix="mypage" />;
  return (
    <View key={user.id} style={styles.content}>
      {children(user.id)}
    </View>
  );
}

/**
 * アカウント状態を読めなかったとき。BAN 中はその旨だけ（ログアウトと退会は
 * 設定のアカウントの節から）
 */
function AccountLoadFailed({ banned }: { readonly banned: boolean }) {
  const t = useTranslations("settings.account");
  return (
    <MypageLoadFailed
      message={banned ? t("banned") : t("loadFailed")}
      onRetry={banned ? undefined : () => void refreshAccount()}
    />
  );
}

/** 読み込み中（マイページの各画面で共通） */
export function MypageLoading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary500} />
    </View>
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
  loading: {
    paddingVertical: 48,
    alignItems: "center",
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
