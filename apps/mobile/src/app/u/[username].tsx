import { useCallback } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslations } from "use-intl";
import type { MobilePublicProfileResponse } from "@mahjong-scoring/features/public-profile/mobile-api";
import { buildSnsLinks } from "@mahjong-scoring/features/public-profile/sns-links";

import { useViewer } from "../../auth/use-viewer";
import { LinkRow, LinkRowList } from "../../components/link-row";
import { LoadFailed, LoadingIndicator } from "../../components/load-state";
import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { useFocusRead } from "../../lib/use-focus-read";
import { colors } from "../../lib/theme";
import { UserAvatar } from "../../mypage/user-avatar";
import { fetchPublicProfile } from "../../public-profile/public-profile-api";

/**
 * 公開プロフィール
 *
 * @description
 * web の `/u/<ユーザー名>`。アバター・表示名・自己紹介・SNS のリンクを出す。
 * 退会・BAN・存在しない人は「見つかりませんでした」。閲覧者がブロックした人は
 * 中身を出さず、ブロック中である旨だけを出す（web と同じ）。
 *
 * web と違うもの: SNS のリンクはボタンの並びではなく行リンクで並べ、端末の
 * ブラウザ（またはそのサービスのアプリ）で開く。
 *
 * @flow ランキングの行 → 公開プロフィール
 */
export default function PublicProfileScreen() {
  const t = useTranslations("publicProfile");
  const { username } = useLocalSearchParams<{ username?: string }>();
  return (
    <Screen title={t("pageTitle")} back contentStyle={styles.content}>
      {typeof username === "string" ? (
        <PublicProfile username={username} />
      ) : (
        <Text style={styles.muted}>{t("notFound")}</Text>
      )}
    </Screen>
  );
}

function PublicProfile({ username }: { readonly username: string }) {
  const t = useTranslations("publicProfile");
  const viewer = useViewer();
  const viewerId = viewer.kind === "ready" ? viewer.viewerId : undefined;
  const read = useCallback(
    () => fetchPublicProfile(viewerId, username),
    [viewerId, username],
  );
  // ログインの状態を読み終えるまで送らない（ゲストとして読むとブロック中の人が見える）
  const { state, reload } = useFocusRead(
    viewer.kind === "ready" ? read : undefined,
  );

  if (state.kind === "loading") return <LoadingIndicator />;
  if (state.kind === "failed") {
    return state.error === "notFound" ? (
      <Text style={styles.muted}>{t("notFound")}</Text>
    ) : (
      <LoadFailed
        message={t("loadFailed")}
        retry={{ label: t("retry"), onPress: reload }}
      />
    );
  }

  const profile = state.value;
  if (profile.relation === "blocking") {
    return (
      <Text style={styles.notice} testID="public-profile-blocked">
        {t("blockedNotice", { username: profile.username })}
      </Text>
    );
  }
  return <ProfileBody profile={profile} />;
}

/** プロフィールの中身（ブロック中でないとき） */
function ProfileBody({
  profile,
}: {
  readonly profile: MobilePublicProfileResponse;
}) {
  const t = useTranslations("publicProfile");
  const name = profile.displayName ?? profile.username;
  const snsLinks = buildSnsLinks(profile);
  return (
    <>
      <View style={styles.heading}>
        <UserAvatar avatarUrl={profile.avatarUrl} name={name} size={80} />
        <View style={styles.names}>
          {profile.displayName !== undefined && (
            <Text style={styles.displayName} testID="public-profile-name">
              {profile.displayName}
            </Text>
          )}
          <Text style={styles.username}>@{profile.username}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle>{t("bioTitle")}</SectionTitle>
        {profile.bio !== undefined ? (
          <Text style={styles.bio}>{profile.bio}</Text>
        ) : (
          <Text style={styles.muted}>{t("bioEmpty")}</Text>
        )}
      </View>

      {snsLinks.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>{t("snsTitle")}</SectionTitle>
          <LinkRowList>
            {snsLinks.map((link) => (
              <LinkRow
                key={link.label}
                title={link.label}
                description={link.handle}
                onPress={() => {
                  Linking.openURL(link.url).catch(() => {
                    // 開けなかったら何もしない（行はそのまま残る）
                  });
                }}
              />
            ))}
          </LinkRowList>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  heading: {
    alignItems: "center",
    gap: 12,
  },
  names: {
    alignItems: "center",
    gap: 2,
  },
  displayName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.surface900,
  },
  username: {
    fontSize: 15,
    color: colors.surface500,
  },
  section: {
    gap: 16,
  },
  bio: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.surface700,
  },
  muted: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface500,
  },
  notice: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface700,
    textAlign: "center",
  },
});
