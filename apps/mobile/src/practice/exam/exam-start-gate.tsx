import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { evaluateExamEligibility } from "@mahjong-scoring/features/ranks/exam-eligibility";
import { rankTier } from "@mahjong-scoring/features/ranks/registry";
import { DOJO_PATH, practicePlayHref } from "@mahjong-scoring/features/routes";

import { useAuth } from "../../auth/use-auth";
import { Button, buttonForeground } from "../../components/button";
import { PlayIcon } from "../../components/icons/icons";
import { BeltButton } from "../../dojo/belt-button";
import { useServerProgressStore } from "../../records/account-sync";
import { colors } from "../../lib/theme";
import { useGoToTab } from "../../hooks/use-go-to-tab";

/** ボタン 1 つと、その下の補足文（web の `CtaBlock`） */
function CtaBlock({
  hint,
  children,
}: {
  readonly hint: string;
  readonly children: ReactNode;
}) {
  return (
    <View style={styles.block}>
      {children}
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

/**
 * 本番の試験の導線を出せるか
 * 本番導線の有無
 *
 * ログインを出せないビルドと BAN 中は出さない（{@link ExamStartGate} が何も
 * 描かない条件）。並べる側が「または」の区切りや誘いの文を一緒に外すために読む。
 */
export function useOffersRealExam(): boolean {
  const { status, accountError } = useAuth();
  return status !== "unavailable" && accountError !== "banned";
}

/**
 * 昇級試験の本番の開始ボタンの出し分け（web の `ExamStartGate`）
 * 受験ゲート
 *
 * - ゲスト → アカウント登録へ（web と同じく、ログインは登録画面が案内する）
 * - ユーザー名を決めていない → ユーザー名の設定へ（記録付きのチャレンジは
 *   ユーザー名を決めた人だけが始められる）
 * - 先に取る級がある → 道場へ（帯色は先に取る級の色）
 * - それ以外（次に取る級・取得済みの級の再挑戦） → 本番を始める
 *
 * ログインを出せないビルド・BAN 中は何も出さない（模試だけが残る）。
 * 受験できないときの導線を緑にしないのは web と同じ理由（緑はこの位置では
 * 「試験開始」としか読めない）。
 *
 * ここは表示の出し分けだけで、強制はサーバーがする（開始の API が資格の無い
 * 試験を `examLocked` で断る）。段級位をまだ読めていないときは開始ボタンへ
 * 倒す — 資格が無ければ、始めた先で説明画面へ戻る。
 */
export function ExamStartGate({
  slug,
  startLabel,
  replace = false,
}: {
  readonly slug: PracticeMenuSlug;
  /**
   * 開始ボタンの文言（既定は `challenge.startButton`）。模試の画面の末尾から
   * 本番へ送るときは「本番の試験を始める」に差し替える（web と同じ）
   */
  readonly startLabel?: string;
  /** 本番を今の画面と置き換えて開く（模試の画面から送るとき） */
  readonly replace?: boolean;
}) {
  const t = useTranslations("ranks");
  const tc = useTranslations("challenge");
  const tExam = useTranslations("examTraining");
  const router = useRouter();
  const goToTab = useGoToTab();
  const { status, user, account } = useAuth();
  const offersRealExam = useOffersRealExam();
  const userId = status === "signedIn" ? user?.id : undefined;
  const rankSlugs = useServerProgressStore((state) =>
    userId !== undefined && state.userId === userId
      ? state.input?.achievedRankSlugs
      : undefined,
  );

  if (!offersRealExam) return undefined;

  if (status === "signedOut") {
    return (
      <CtaBlock hint={t("examGate.signUpNote")}>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => router.push("/sign-up")}
          testID="exam-sign-up"
        >
          {t("examGate.signUpButton")}
        </Button>
      </CtaBlock>
    );
  }

  if (account?.profile === null) {
    return (
      <CtaBlock hint={t("examGate.usernameNote")}>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => router.push("/mypage/setup-username")}
          testID="exam-setup-username"
        >
          {t("examGate.usernameButton")}
        </Button>
      </CtaBlock>
    );
  }

  const { menuType, timeLimit, mistakeLimit } = practiceMenuBySlug(slug);
  const eligibility =
    rankSlugs === undefined
      ? undefined
      : evaluateExamEligibility(menuType, rankSlugs);

  if (eligibility?.kind === "locked") {
    return (
      <CtaBlock
        hint={t("examGate.locked", {
          examTitle: t(`examTitle.${rankTier(eligibility.rank.slug)}`, {
            rank: t(`names.${eligibility.rank.slug}`),
          }),
          requiredRank: t(`names.${eligibility.requiredRank.slug}`),
        })}
      >
        <BeltButton
          slug={eligibility.requiredRank.slug}
          onPress={() => goToTab(DOJO_PATH)}
        >
          {t("examGate.dojoButton")}
        </BeltButton>
      </CtaBlock>
    );
  }

  // 認証・アカウントを読んでいる間も同じ位置にボタンを置き、押せなくしておく
  const ready = status === "signedIn" && account !== undefined;
  return (
    <CtaBlock hint={tExam("realExamHint", { timeLimit, mistakeLimit })}>
      <Button
        size="lg"
        fullWidth
        disabled={!ready}
        icon={
          <PlayIcon size={16} color={buttonForeground("primary", !ready)} />
        }
        onPress={() =>
          replace
            ? router.replace(practicePlayHref(slug))
            : router.push(practicePlayHref(slug))
        }
        testID="start-exam"
      >
        {startLabel ?? tc("startButton")}
      </Button>
    </CtaBlock>
  );
}

const styles = StyleSheet.create({
  block: {
    alignItems: "center",
    gap: 6,
  },
  hint: {
    fontSize: 12,
    color: colors.surface400,
    textAlign: "center",
  },
});
