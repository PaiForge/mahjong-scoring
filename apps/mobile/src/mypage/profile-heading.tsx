import { Image, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type { MobileMypageResponse } from "@mahjong-scoring/features/mypage/mobile-api";
import { DOJO_PATH } from "@mahjong-scoring/features/routes";

import { BeltPill } from "../components/belt-pill";
import { panelFrame } from "../lib/panel-styles";
import { colors, radius } from "../lib/theme";

const AVATAR_SIZE = 64;

/**
 * マイページの見出し（web のマイページのトップの最初のカード）
 * プロフィール見出し
 *
 * アバター・名前・@ユーザー名と、取得済みの最上位の段級位。段級位の
 * ピルは web と同じく道場（段級位のホーム）へ送る。web の「公開プロフィール」はアプリに公開
 * プロフィールの画面が無いので持たない。
 */
export function ProfileHeading({
  mypage,
}: {
  readonly mypage: MobileMypageResponse;
}) {
  const tRanks = useTranslations("ranks");
  const router = useRouter();
  const { profile, rankSlug } = mypage;
  const name = profile.displayName ?? profile.username;
  return (
    <View style={[panelFrame, styles.card]}>
      <Avatar avatarUrl={profile.avatarUrl} name={name} />
      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.username} numberOfLines={1}>
          @{profile.username}
        </Text>
        {rankSlug !== undefined && (
          <View style={styles.rank}>
            <BeltPill
              slug={rankSlug}
              label={tRanks(`names.${rankSlug}`)}
              onPress={() => router.push(DOJO_PATH)}
            />
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * アバター（web の `UserAvatar`）。画像が無ければ名前の頭文字
 *
 * 太枠は付けない — 丸く回り込む枠は顔写真の縁を削る（web と同じ判断）。
 */
function Avatar({
  avatarUrl,
  name,
}: {
  readonly avatarUrl: string | undefined;
  readonly name: string;
}) {
  if (avatarUrl !== undefined) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={styles.avatar}
        accessibilityIgnoresInvertColors
        accessible={false}
      />
    );
  }
  return (
    <View
      style={[styles.avatar, styles.fallback]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={styles.initial}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.full,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface100,
  },
  initial: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.surface500,
  },
  texts: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.foreground,
  },
  username: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.surface500,
  },
  rank: {
    flexDirection: "row",
    marginTop: 6,
  },
});
