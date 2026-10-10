import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTranslations } from "use-intl";
import type { MobileLeaderboardVisibility } from "@mahjong-scoring/features/leaderboard/mobile-api";

import { FormMessage } from "../auth/form-message";
import { useAuth } from "../auth/use-auth";
import { SectionTitle } from "../components/section-title";
import {
  SettingsCard,
  SettingToggleRow,
} from "../components/setting-toggle-row";
import { TextLink } from "../components/text-link";
import {
  fetchLeaderboardVisibility,
  saveLeaderboardVisibility,
} from "../leaderboard/leaderboard-api";
import { panelFrame } from "../lib/panel-styles";
import { colors } from "../lib/theme";
import { useFocusRead } from "../lib/use-focus-read";

/**
 * 設定のプライバシーの節（web の `PrivacySettingsSection`）
 * プライバシー設定
 *
 * ランキングに表示しない設定を切り替える。端末ローカルの設定と違い、
 * サーバー（`profiles.hidden_from_leaderboard`）に保存するので web と同じ値を
 * 読み書きする。アプリはランキングの詳細を持たないが、アプリで記録した
 * ユーザー名と成績も web のランキングに載るので、アプリからも止められるように
 * 置く（ユーザー名の設定画面で公開されることを伝えている）。
 *
 * ユーザー名を決める前は書く行が無いので節ごと出さない。
 */
export function PrivacySettingsSection({
  style,
}: {
  /** 節の外枠（他の節と間隔をそろえる） */
  readonly style?: StyleProp<ViewStyle>;
}) {
  const t = useTranslations("settings");
  const { status, user, account } = useAuth();
  if (status !== "signedIn" || user === undefined || !account?.profile) {
    return null;
  }
  return (
    <View style={style}>
      <SectionTitle>{t("privacySectionTitle")}</SectionTitle>
      <LeaderboardVisibilityRow userId={user.id} />
    </View>
  );
}

function LeaderboardVisibilityRow({ userId }: { readonly userId: string }) {
  const t = useTranslations("settings");
  const tLeaderboard = useTranslations("leaderboard");
  const { state, reload } = useFocusRead(
    useCallback(() => fetchLeaderboardVisibility(userId), [userId]),
  );
  // 押した直後の値。保存を待たずにスイッチを動かし、失敗したら読んだ値へ戻す。
  // 押したときに読んであった値（`base`）を覚え、保存の後に読み直した値が届いたら
  // （`state.value` が別のものになったら）読んだ値を正にする — web で切り替えた
  // 値も、画面を開き直したときに映る
  const [optimistic, setOptimistic] = useState<
    | { readonly hidden: boolean; readonly base: MobileLeaderboardVisibility }
    | undefined
  >(undefined);
  const [saveFailed, setSaveFailed] = useState(false);

  if (state.kind === "loading") {
    return (
      <View style={[panelFrame, styles.placeholder]}>
        <ActivityIndicator color={colors.action} />
      </View>
    );
  }
  if (state.kind === "failed") {
    return (
      <View style={styles.failed}>
        <Text style={styles.failedText}>{tLeaderboard("loadFailed")}</Text>
        <TextLink onPress={reload}>{tLeaderboard("retry")}</TextLink>
      </View>
    );
  }

  const loaded = state.value;
  const hidden =
    optimistic !== undefined && optimistic.base === loaded
      ? optimistic.hidden
      : loaded.hidden;
  const handleChange = (next: boolean) => {
    setOptimistic({ hidden: next, base: loaded });
    setSaveFailed(false);
    void saveLeaderboardVisibility(userId, next).then((result) => {
      // 失敗は読み流せる完了ではないので、トーストではなくカードの下に残す
      if ("error" in result) {
        setOptimistic(undefined);
        setSaveFailed(true);
        return;
      }
      // 読み直して保存した値を正にする（読み終えるまでは押した値を出す）
      reload();
    });
  };

  return (
    <View style={styles.row}>
      <SettingsCard>
        <SettingToggleRow
          title={t("leaderboardVisibilityTitle")}
          description={t("leaderboardVisibilityAppDescription")}
          checked={hidden}
          onChange={handleChange}
        />
      </SettingsCard>
      {saveFailed && (
        <FormMessage tone="error">
          {t("leaderboardVisibilityFailedToast")}
        </FormMessage>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
  },
  placeholder: {
    minHeight: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  failed: {
    alignItems: "flex-start",
    gap: 4,
  },
  failedText: {
    fontSize: 15,
    color: colors.destructiveStrong,
  },
});
