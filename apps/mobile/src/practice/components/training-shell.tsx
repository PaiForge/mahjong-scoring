import type { ReactNode, RefObject } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { BoardBleedProvider } from "../../board/board-bleed";
import { Button } from "../../components/button";
import { DashedDivider } from "../../components/dashed-divider";
import { InfinityIcon, PlayIcon } from "../../components/icons/icons";
import { Screen } from "../../components/screen";
import { TextLink } from "../../components/text-link";
import { colors } from "../../lib/theme";
import { ScoreCounter } from "./score-counter";

interface TrainingShellProps {
  readonly title: string;
  readonly variant: "practice" | "exam";
  readonly correctCount: number;
  readonly totalCount: number;
  /** チャレンジ（本番）の制限時間とミス上限。チャレンジへの誘いに添える */
  readonly challengeRules: {
    readonly timeLimit: number;
    readonly mistakeLimit: number;
  };
  /** チャレンジ（本番）の画面のパス */
  readonly challengeHref: string;
  /** 終了したときに戻る先（説明画面） */
  readonly exitHref: string;
  readonly onReveal: () => void;
  readonly revealDisabled: boolean;
  readonly isRevealed: boolean;
  readonly isHolding: boolean;
  readonly onProceed: () => void;
  /**
   * 盤面が自前の回答ボタンを持つか
   *
   * 持たない盤面（選択肢を押して答える）は「次の問題へ」の場所を常に取っておき、
   * 現れた瞬間に下が動かないようにする（web の `TrainingShell` と同じ）。
   */
  readonly hasSubmitButton?: boolean;
  /**
   * 練習名の右隣に置くヘルプ（「?」と説明のモーダル）
   *
   * 盤面を見ても読み取れない出題のルールを置く。チャレンジでは使わない
   * （モーダルを開いている間も時計は止まらない）ためトレーニングだけが持つ。
   */
  readonly help?: ReactNode;
  readonly scrollRef: RefObject<ScrollView | null>;
  readonly children: ReactNode;
}

/**
 * トレーニングの画面の枠
 * トレーニングシェル
 *
 * web の `TrainingShell` と同じ並び: 見出し → 盤面（回答後は「次の問題へ」で
 * 止まる）→ 正誤カウンタ → わからない / 終了する → チャレンジへの誘い。
 * 時計もライフも無く、記録も残らない。
 *
 * 模試（`variant="exam"`）は「模試を受験中」の印だけを残し、本番の試験への
 * 誘いを出さない。web は本番へ送るが、本番は合否と段級位の付与にアカウントが
 * 要り、モバイルはまだログインを持たない。
 */
export function TrainingShell({
  title,
  variant,
  correctCount,
  totalCount,
  challengeRules,
  challengeHref,
  exitHref,
  onReveal,
  revealDisabled,
  isRevealed,
  isHolding,
  onProceed,
  hasSubmitButton = false,
  help,
  scrollRef,
  children,
}: TrainingShellProps) {
  const tt = useTranslations("training");
  const tp = useTranslations("practice");
  const tExam = useTranslations("examTraining");
  const router = useRouter();
  const isExam = variant === "exam";

  return (
    <Screen
      ref={scrollRef}
      title={title}
      titleAction={help}
      contentStyle={styles.content}
    >
      <View>
        <BoardBleedProvider>{children}</BoardBleedProvider>
        {(isHolding || !hasSubmitButton) && (
          <View
            style={[styles.next, !isHolding && styles.hidden]}
            pointerEvents={isHolding ? "auto" : "none"}
            accessibilityElementsHidden={!isHolding}
            importantForAccessibility={
              isHolding ? "auto" : "no-hide-descendants"
            }
          >
            <Button size="lg" fullWidth onPress={onProceed}>
              {tt("nextButton")}
            </Button>
          </View>
        )}
      </View>

      <ScoreCounter
        correct={correctCount}
        incorrect={totalCount - correctCount}
      />

      <View style={styles.actions}>
        {isRevealed ? (
          <TextLink onPress={onProceed}>{tt("nextButton")}</TextLink>
        ) : (
          <View style={revealDisabled && styles.disabled}>
            <TextLink onPress={revealDisabled ? () => undefined : onReveal}>
              {tt("revealButton")}
            </TextLink>
          </View>
        )}
        <TextLink onPress={() => router.dismissTo(exitHref)}>
          {tt("exitButton")}
        </TextLink>
      </View>

      <View style={styles.cta}>
        <DashedDivider thickness={2} />
        <View style={styles.ctaLead}>
          <View style={styles.modeRow}>
            <InfinityIcon size={14} color={colors.surface400} />
            <Text style={styles.mode}>
              {isExam ? tExam("modeActive") : tt("modeActive")}
            </Text>
          </View>
          {!isExam && (
            <Text style={styles.prompt}>{tt("challengePrompt")}</Text>
          )}
        </View>
        {/* 模試から本番の試験へは誘わない。本番は合否と段級位の付与に
            アカウントが要り、モバイルはまだログインを持たないため */}
        {!isExam && (
          <>
            <Button
              size="lg"
              fullWidth
              icon={<PlayIcon size={16} color={colors.white} />}
              onPress={() => router.replace(challengeHref)}
            >
              {tt("challengeButton")}
            </Button>
            <Text style={styles.hint}>
              {tp("modeChallengeHint", challengeRules)}
            </Text>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  next: {
    marginTop: 16,
  },
  hidden: {
    opacity: 0,
  },
  actions: {
    alignItems: "center",
    gap: 20,
  },
  disabled: {
    opacity: 0.5,
  },
  cta: {
    gap: 12,
    alignItems: "center",
  },
  ctaLead: {
    marginTop: 20,
    alignItems: "center",
    gap: 4,
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mode: {
    fontSize: 12,
    color: colors.surface400,
  },
  prompt: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface900,
  },
  hint: {
    fontSize: 12,
    color: colors.surface400,
    textAlign: "center",
  },
});
