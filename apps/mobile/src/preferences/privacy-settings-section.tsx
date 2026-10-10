import { useCallback, useReducer, useRef } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslations } from "use-intl";

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
import {
  INITIAL_LEADERBOARD_VISIBILITY_STATE,
  canToggleLeaderboardVisibility,
  reduceLeaderboardVisibility,
} from "./leaderboard-visibility-state";

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
  const [state, dispatch] = useReducer(
    reduceLeaderboardVisibility,
    INITIAL_LEADERBOARD_VISIBILITY_STATE,
  );
  // 読み込みの番号。後から始めたものだけを受け付ける（状態の遷移の規則は
  // `leaderboard-visibility-state.ts`）
  const loadCount = useRef(0);

  const load = useCallback(() => {
    const loadNumber = ++loadCount.current;
    dispatch({ type: "loadStarted", load: loadNumber });
    void fetchLeaderboardVisibility(userId).then((result) =>
      dispatch(
        "error" in result
          ? { type: "loadFailed", load: loadNumber }
          : { type: "loadSucceeded", load: loadNumber, hidden: result.hidden },
      ),
    );
  }, [userId]);
  // 画面を開くたびに読み直す（web で切り替えた値を映す）
  useFocusEffect(load);

  if (state.hidden === undefined) {
    if (state.loadFailed) {
      return (
        <View style={styles.failed}>
          <Text style={styles.failedText}>{tLeaderboard("loadFailed")}</Text>
          <TextLink onPress={load}>{tLeaderboard("retry")}</TextLink>
        </View>
      );
    }
    return (
      <View style={[panelFrame, styles.placeholder]}>
        <ActivityIndicator color={colors.action} />
      </View>
    );
  }

  const handleChange = (next: boolean) => {
    // 保存中は受け付けない（POST を直列にする）
    if (!canToggleLeaderboardVisibility(state)) return;
    dispatch({ type: "saveStarted", hidden: next });
    void saveLeaderboardVisibility(userId, next).then((result) =>
      // 失敗は読み流せる完了ではないので、トーストではなくカードの下に残す
      dispatch({ type: "error" in result ? "saveFailed" : "saveSucceeded" }),
    );
  };

  return (
    <View style={styles.row}>
      <SettingsCard>
        <SettingToggleRow
          title={t("leaderboardVisibilityTitle")}
          description={t("leaderboardVisibilityAppDescription")}
          checked={state.hidden}
          onChange={handleChange}
          disabled={!canToggleLeaderboardVisibility(state)}
        />
      </SettingsCard>
      {state.saveFailed && (
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
