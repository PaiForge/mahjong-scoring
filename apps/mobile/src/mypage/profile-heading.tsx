import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type { MobileMypageResponse } from "@mahjong-scoring/features/mypage/mobile-api";
import { DOJO_PATH } from "@mahjong-scoring/features/routes";

import { BeltPill } from "../components/belt-pill";
import { panelFrame } from "../lib/panel-styles";
import { colors } from "../lib/theme";
import { UserAvatar } from "./user-avatar";
import { useGoToTab } from "../hooks/use-go-to-tab";

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
  const goToTab = useGoToTab();
  const { profile, rankSlug } = mypage;
  const name = profile.displayName ?? profile.username;
  return (
    <View style={[panelFrame, styles.card]}>
      <UserAvatar
        avatarUrl={profile.avatarUrl}
        name={name}
        size={AVATAR_SIZE}
      />
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
              onPress={() => goToTab(DOJO_PATH)}
            />
          </View>
        )}
      </View>
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
