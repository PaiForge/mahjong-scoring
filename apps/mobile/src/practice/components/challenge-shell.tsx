import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AppState,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type {
  GameSessionState,
  TimerControl,
} from "@mahjong-scoring/features/session/use-timed-session";
import { useChallengeClock } from "@mahjong-scoring/features/session/use-challenge-clock";
import { useOnFinished } from "@mahjong-scoring/features/session/use-on-finished";
import { useQuitPause } from "@mahjong-scoring/features/session/use-quit-pause";

import { BoardBleedProvider } from "../../board/board-bleed";
import { ConfirmationModal } from "../../components/confirmation-modal";
import { PauseIcon, PlayIcon } from "../../components/icons/icons";
import { Screen } from "../../components/screen";
import { TextLink } from "../../components/text-link";
import { colors } from "../../lib/theme";
import { QuizTimer } from "./quiz-timer";
import { ScoreCounter } from "./score-counter";

interface ChallengeShellProps {
  readonly title: string;
  readonly gameSession: GameSessionState;
  readonly timerControl: TimerControl;
  readonly variant: "practice" | "exam";
  /** 中止したときに戻る先（説明画面） */
  readonly exitHref: string;
  /** 終わったときに呼ぶ（経過時間を渡す）。結果画面への遷移は呼び出し側が持つ */
  readonly onFinish: (elapsedMs: number) => void;
  /** 盤面が表示を切り替えたときに先頭へ戻すための ScrollView の参照 */
  readonly scrollRef: React.RefObject<ScrollView | null>;
  readonly children: ReactNode;
}

/** 残りライフ（ハート） */
function LifeIndicator({
  remainingLives,
  mistakeLimit,
}: {
  readonly remainingLives: number;
  readonly mistakeLimit: number;
}) {
  return (
    <View style={styles.lives}>
      {Array.from({ length: mistakeLimit }, (_, i) => (
        <Text
          key={i}
          style={[
            styles.heart,
            { color: i < remainingLives ? colors.red500 : colors.surface200 },
          ]}
        >
          ♥
        </Text>
      ))}
    </View>
  );
}

/**
 * チャレンジの画面の枠
 * チャレンジシェル
 *
 * web の `ChallengeShell` と同じ並び: 見出し → タイマー・一時停止・ライフ →
 * 盤面 → 正誤カウンタ → 中止。開始時に 3, 2, 1 のカウントダウンを重ね、
 * 一時停止中は盤面を覆って隠す（web はぼかすが、RN にはぼかしが無いため
 * 白で覆う — どちらも一時停止中に問題を読ませない）。
 *
 * モバイル固有の扱い:
 * - アプリが裏に回ったら一時停止する（電話・通知で時間を失わない）
 * - Android の戻るボタンは中止の確認を開く（押しただけで記録を失わない）
 */
export function ChallengeShell({
  title,
  gameSession,
  timerControl,
  variant,
  exitHref,
  onFinish,
  scrollRef,
  children,
}: ChallengeShellProps) {
  const tc = useTranslations("challenge");
  const tq = useTranslations("challenge.quit");
  const router = useRouter();
  const [isQuitOpen, setIsQuitOpen] = useState(false);

  const { remainingSeconds, elapsedMs } = useChallengeClock({
    gameSession,
    timerControl,
  });
  const { pauseForQuit, resumeAfterQuit } = useQuitPause(gameSession);

  // 終わった瞬間の経過時間で 1 回だけ結果へ送る
  useOnFinished(gameSession.finalResult, () => onFinish(elapsedMs));
  const sessionRef = useRef(gameSession);
  useEffect(() => {
    sessionRef.current = gameSession;
  });

  const openQuit = useCallback(() => {
    pauseForQuit();
    setIsQuitOpen(true);
  }, [pauseForQuit]);

  const cancelQuit = useCallback(() => {
    setIsQuitOpen(false);
    resumeAfterQuit();
  }, [resumeAfterQuit]);

  const confirmQuit = useCallback(() => {
    setIsQuitOpen(false);
    router.dismissTo(exitHref);
  }, [router, exitHref]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      openQuit();
      return true;
    });
    return () => sub.remove();
  }, [openQuit]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      const session = sessionRef.current;
      if (
        state !== "active" &&
        !session.isPaused &&
        !session.isFinished &&
        !session.isCountingDown
      ) {
        session.togglePause();
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={styles.root}>
      <Screen ref={scrollRef} title={title}>
        <View style={styles.status}>
          <View style={styles.timerGroup}>
            <QuizTimer
              timeRemaining={remainingSeconds}
              progress={elapsedMs / 1000 / gameSession.timeLimit}
            />
            <Pressable
              onPress={gameSession.togglePause}
              disabled={gameSession.isCountingDown || gameSession.isFinished}
              accessibilityRole="button"
              accessibilityLabel={
                gameSession.isPaused ? tc("resume") : tc("pause")
              }
              hitSlop={8}
              style={({ pressed }) => [
                styles.pauseButton,
                pressed && styles.pauseButtonPressed,
                gameSession.isCountingDown && styles.disabled,
              ]}
            >
              {gameSession.isPaused ? (
                <PlayIcon size={16} color={colors.surface500} />
              ) : (
                <PauseIcon size={16} color={colors.surface500} />
              )}
            </Pressable>
          </View>
          <LifeIndicator
            remainingLives={gameSession.remainingLives}
            mistakeLimit={gameSession.mistakeLimit}
          />
        </View>

        <View>
          <BoardBleedProvider>{children}</BoardBleedProvider>
          {gameSession.isPaused && (
            <View style={styles.pauseOverlay}>
              <Pressable
                onPress={gameSession.togglePause}
                accessibilityRole="button"
                accessibilityLabel={tc("resume")}
                style={({ pressed }) => [
                  styles.resumeButton,
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
              >
                <PlayIcon size={48} color={colors.surface700} />
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <ScoreCounter
            correct={gameSession.correctCount}
            incorrect={gameSession.incorrectCount}
          />
          <TextLink onPress={openQuit}>{tc("quitButton")}</TextLink>
        </View>
      </Screen>

      {gameSession.isCountingDown && (
        <View style={styles.countdown} pointerEvents="auto">
          <Text style={styles.countdownText}>{gameSession.countdownValue}</Text>
        </View>
      )}

      <ConfirmationModal
        isOpen={isQuitOpen}
        title={tq(`${variant}.title`)}
        message={tq("message")}
        confirmText={tq("confirm")}
        cancelText={tq("cancel")}
        confirmVariant="danger"
        onConfirm={confirmQuit}
        onClose={cancelQuit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timerGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pauseButton: {
    padding: 6,
    borderRadius: 10,
  },
  pauseButtonPressed: {
    backgroundColor: colors.surface100,
  },
  disabled: {
    opacity: 0.4,
  },
  lives: {
    flexDirection: "row",
    gap: 2,
  },
  heart: {
    fontSize: 16,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.97)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  resumeButton: {
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 3,
    borderColor: colors.surface200,
    padding: 16,
  },
  footer: {
    marginTop: 8,
    gap: 32,
  },
  countdown: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  countdownText: {
    fontSize: 60,
    fontWeight: "700",
    color: colors.primary500,
  },
});
