import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { randomUUID } from "expo-crypto";
import { useTranslations } from "use-intl";
import type { MobileChallengeStatus } from "@mahjong-scoring/features/challenge/mobile-api";
import type { ChallengeQuestion } from "@mahjong-scoring/features/challenge/types";
import {
  resolveRecordedChallengeMode,
  type RecordedChallengeMode,
  type ServerQuestion,
} from "./recorded-challenge-mode";
import { useReconnectPrompt } from "./use-reconnect-prompt";
import { useServerPauseSync } from "./use-server-pause-sync";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import {
  practiceHref,
  practiceTrainingHref,
} from "@mahjong-scoring/features/routes";
import { QuestionHostProvider } from "@mahjong-scoring/features/practice/use-question-host";
import type { ClockReading } from "@mahjong-scoring/features/session/use-timed-session";

import { refreshAccount, useAuth } from "../auth/use-auth";
import { Button } from "../components/button";
import { Screen } from "../components/screen";
import { PreparingScreen } from "./components/preparing-screen";
import { TextLink } from "../components/text-link";
import { useRuleSettingsStore } from "../hooks/use-rule-settings-store";
import { colors } from "../lib/theme";
import {
  acknowledgeAnswer,
  dropActiveChallenge,
  sendAnswer,
  startChallenge,
} from "../records/account-records";
import { markAttemptLive } from "../records/account-sync";
import { isRetryableFailure } from "../records/failure-policy";
import {
  answerRecordedChallenge,
  beginRecordedChallenge,
  readRecordedChallenge,
  readUnansweredQuestion,
} from "../records/records-api";
import { wait, withRetries } from "../records/with-retries";
import { updateAccountRecords } from "../records/use-account-records-store";

/**
 * サーバーで採点・記録するチャレンジの操作
 * 記録付きチャレンジ
 *
 * web の `useVerifiedChallenge` と同じ役割。盤面はこれを `QuestionHost`
 * として受け取り、問題はサーバーが出し、回答はサーバーへ送って採点を待つ。
 */
export interface RecordedChallenge {
  /** 誰の名義で記録するか（始めたときのユーザー） */
  readonly userId: string;
  readonly attemptId: string;
  /** 回答を送って採点を待っている間 true。この間は時計を止める */
  readonly isGrading: boolean;
  /** 合わせ直す先のサーバーの時計（`TimerControl.clock`） */
  readonly clock: ClockReading | undefined;
  /**
   * 一時停止・再開をサーバーへ伝える
   *
   * 画面はこの結果を待たずに止める（裏に回った直後にアプリが止められると
   * 要求が届かないことがある）。届かなかった間もサーバーの時計は進み、
   * 再開のときにサーバーの状態を読んで時計を合わせ直す。期限を過ぎていれば
   * 合わせ直した時計がそのまま時間切れを起こす。
   */
  readonly pause: (paused: boolean) => void;
  /** 制限時間に達したとき。サーバーの期限を待ち、出ていた問題を結果に足してから `onExpired` を呼ぶ */
  readonly expire: (onExpired: () => void) => void;
  /** 送っている回答の応答を待つ */
  readonly settled: () => Promise<void>;
  /**
   * サーバーが終了と合否の判定に使う合格ライン（昇級試験だけ）。手元の
   * レジストリより優先する（`MobileBeginChallengeResponse` 参照）。古い
   * サーバーが返さなければ undefined
   */
  readonly goalCount: number | undefined;
}

const Context = createContext<RecordedChallenge | undefined>(undefined);

/**
 * 記録付きのチャレンジの操作を読む。ゲスト（端末で採点する）なら undefined
 * 記録付きチャレンジ参照
 */
export function useRecordedChallenge(): RecordedChallenge | undefined {
  return useContext(Context);
}

/**
 * 記録付きのチャレンジを始め、盤面に出題と採点を渡す
 * 記録付きチャレンジ提供
 *
 * ログインしてユーザー名を決めた人だけがサーバーで採点・記録する。ゲスト・
 * ユーザー名を決める前・BAN 中は、今までどおり端末で採点する（記録しない）。
 *
 * - 通信できないときは記録付きでは始めない（オフラインで解いた成績を
 *   後から正式な成績として送らない）。もう一度試すか、トレーニングへ
 * - 回答が届かなければ同じ番号・同じ回答で送り直す（サーバーは採点し
 *   直さずに同じ応答を返す）。尽きたら盤面の上に再接続の案内を重ね、
 *   チャレンジを作り直さない
 * - 始める前・回答を送る前に端末へ預ける（`account-records.ts`）。アプリが
 *   落ちても、次の起動で後始末できる
 * - 画面を閉じた（中止した）ら預かりを捨てる。途中で抜けたチャレンジは記録しない
 * - `requireRecording`（昇級試験）では端末で採点しない。記録付きで始められない
 *   （ゲスト・ユーザー名を決める前・BAN 中・受験資格が無いとサーバーが断った）
 *   ときは試験の説明画面へ戻す（web の play ページの受験ガードと同じ）。合否と
 *   段級位はサーバーが判定するもので、端末で解いても何も残らないため
 */
export function RecordedChallengeProvider({
  slug,
  variant,
  requireRecording = false,
  children,
}: {
  readonly slug: PracticeMenuSlug;
  readonly variant: string;
  readonly requireRecording?: boolean;
  readonly children: ReactNode;
}) {
  const auth = useAuth();
  // サーバーが開始に答えた結果と、1 度決めた始め方（`resolveRecordedChallengeMode`）
  const [begun, setBegun] = useState<RecordedChallengeMode | undefined>(
    undefined,
  );
  const [frozen, setFrozen] = useState<RecordedChallengeMode | undefined>(
    undefined,
  );
  const [generation, setGeneration] = useState(0);
  // 始める ID は画面ごとに 1 つ。もう一度試すときも同じ ID で送る（サーバーは
  // 同じチャレンジを返す）
  const attemptIdRef = useRef<string | undefined>(undefined);
  const { mode, shouldBegin, userId, accountUnreachable } =
    resolveRecordedChallengeMode(auth, { begun, frozen });
  if (!frozen && (mode.kind === "ready" || mode.kind === "local"))
    setFrozen(mode);

  useEffect(() => {
    if (!shouldBegin || userId === undefined) return;
    let active = true;
    const attemptId = (attemptIdRef.current ??= randomUUID());
    const { menuType } = practiceMenuBySlug(slug);
    const { renfonpaiAs4Fu } = useRuleSettingsStore.getState();
    updateAccountRecords((records) =>
      startChallenge(records, userId, { attemptId, slug, variant }),
    );
    void beginRecordedChallenge(userId, {
      id: attemptId,
      menuType,
      variant,
      settings: { renfonpaiAs4Fu },
    }).then((result) => {
      if (!active) return;
      if ("value" in result) {
        const { goalCount, ...initial } = result.value;
        setBegun({ kind: "ready", userId, attemptId, initial, goalCount });
        return;
      }
      updateAccountRecords((records) =>
        dropActiveChallenge(records, userId, attemptId),
      );
      // 通信の失敗は「始められない」。それ以外（サーバーが記録付きで
      // 始めることを断った）は端末で採点する
      setBegun(
        isRetryableFailure(result.error)
          ? { kind: "offline" }
          : { kind: "local" },
      );
    });
    return () => {
      active = false;
    };
  }, [shouldBegin, userId, slug, variant, generation]);

  const retry = useCallback(() => {
    if (accountUnreachable) void refreshAccount();
    setBegun(undefined);
    setGeneration((value) => value + 1);
  }, [accountUnreachable]);

  if (mode.kind === "local")
    return requireRecording ? <BackToIntro slug={slug} /> : children;
  if (mode.kind === "offline")
    return <OfflineScreen slug={slug} variant={variant} onRetry={retry} />;
  if (mode.kind === "checking") return <PreparingScreen slug={slug} />;
  return (
    <RecordedSession
      key={mode.attemptId}
      userId={mode.userId}
      attemptId={mode.attemptId}
      initial={mode.initial}
      goalCount={mode.goalCount}
    >
      {children}
    </RecordedSession>
  );
}

/** 始めたチャレンジの出題・採点・時計 */
function RecordedSession({
  userId,
  attemptId,
  initial,
  goalCount,
  children,
}: {
  readonly userId: string;
  readonly attemptId: string;
  readonly initial: ServerQuestion;
  readonly goalCount: number | undefined;
  readonly children: ReactNode;
}) {
  const t = useTranslations("challenge.recording");
  const [current, setCurrent] = useState(initial);
  const [grading, setGrading] = useState(false);
  const [clock, setClock] = useState<ClockReading | undefined>(undefined);
  const { reconnect, waitForReconnect } = useReconnectPrompt();
  const next = useRef<ServerQuestion | undefined>(undefined);
  const pending = useRef<Promise<void> | undefined>(undefined);
  const busy = useRef(false);
  const serverExpired = useRef(false);
  const expiring = useRef(false);
  const unanswered = useRef<
    ((question: ChallengeQuestion) => void) | undefined
  >(undefined);
  // 解いている間は起動時の後始末の対象から外し、閉じたら（中止・終了）
  // 進行中の預かりを捨てる。終えたチャレンジは確定待ちへ移してあるので
  // ここでは消えない
  useEffect(() => {
    const release = markAttemptLive(attemptId);
    return () => {
      release();
      updateAccountRecords((records) =>
        dropActiveChallenge(records, userId, attemptId),
      );
    };
  }, [userId, attemptId]);

  const registerUnanswered = useCallback(
    (callback: ((question: ChallengeQuestion) => void) | undefined) => {
      unanswered.current = callback;
    },
    [],
  );

  const advance = useCallback(() => {
    const following = next.current;
    if (!following) return;
    next.current = undefined;
    setCurrent(following);
  }, []);

  /**
   * サーバーの状態を読み、今の問題と時計を合わせ直す。読めなければ undefined
   *
   * サーバーで終わっている（時間切れ）なら、時計を制限時間まで進める
   * （画面のタイマーが次の刻みで時間切れを出し、`expire` に進む）。
   */
  const resync = useCallback(async (): Promise<
    MobileChallengeStatus | undefined
  > => {
    const status = await withRetries(() =>
      readRecordedChallenge(userId, attemptId),
    );
    if ("error" in status) return undefined;
    const { value } = status;
    if (!next.current && value.sequence !== current.sequence)
      setCurrent({ question: value.question, sequence: value.sequence });
    setClock({
      elapsedMs: value.finished
        ? value.elapsedMs + Math.max(0, value.remainingMs)
        : value.elapsedMs,
      sequence: value.sequence,
    });
    return value;
  }, [userId, attemptId, current.sequence]);

  const { resuming, pause, isSyncing, recoverFromServerPaused } =
    useServerPauseSync({
      userId,
      attemptId,
      pending,
      resync,
      waitForReconnect,
    });

  const grade = useCallback(
    (answer: unknown, onGraded: (question: ChallengeQuestion) => void) => {
      if (
        busy.current ||
        next.current ||
        expiring.current ||
        serverExpired.current ||
        isSyncing()
      )
        return false;
      busy.current = true;
      setGrading(true);
      const { sequence } = current;
      updateAccountRecords((records) =>
        sendAnswer(records, userId, attemptId, { sequence, answer }),
      );
      const send = async (): Promise<void> => {
        const result = await withRetries(() =>
          answerRecordedChallenge(userId, attemptId, sequence, answer),
        );
        if ("error" in result) {
          if (isRetryableFailure(result.error)) {
            // 同じ回答を送り直す。押すまで時計は止めたまま
            await waitForReconnect("connectionLost");
            return send();
          }
          // 受け付けられなかった（別の端末で進んだ・止まったまま等）。
          // サーバーに合わせ、止まっていたら動かし直す
          recoverFromServerPaused(await resync());
          return;
        }
        updateAccountRecords((records) =>
          acknowledgeAnswer(records, userId, attemptId, sequence),
        );
        const { value } = result;
        if ("expired" in value) {
          serverExpired.current = true;
          return;
        }
        next.current = { question: value.question, sequence: value.sequence };
        setCurrent((previous) => ({ ...previous, question: value.answered }));
        setClock({ elapsedMs: value.elapsedMs, sequence: value.sequence });
        onGraded(value.answered);
      };
      pending.current = send().finally(() => {
        busy.current = false;
        setGrading(false);
      });
      return true;
    },
    [
      current,
      userId,
      attemptId,
      resync,
      recoverFromServerPaused,
      waitForReconnect,
      isSyncing,
    ],
  );

  const settled = useCallback(async () => {
    await pending.current;
  }, []);

  const expire = useCallback(
    (onExpired: () => void) => {
      if (expiring.current) return;
      expiring.current = true;
      const reveal = async (): Promise<void> => {
        await pending.current;
        let result = await withRetries(() =>
          readUnansweredQuestion(userId, attemptId),
        );
        // サーバーの時計と画面のタイマーの差を待つ。早く終わらせない
        if ("value" in result && "remainingMs" in result.value) {
          await wait(Math.max(0, result.value.remainingMs) + 20);
          result = await withRetries(() =>
            readUnansweredQuestion(userId, attemptId),
          );
        }
        if ("error" in result && isRetryableFailure(result.error)) {
          await waitForReconnect("connectionLost");
          return reveal();
        }
        // フィードバック中は、まだ表示していない次問を結果に足さない
        if ("value" in result && "question" in result.value && !next.current)
          unanswered.current?.(result.value.question);
        onExpired();
      };
      void reveal();
    },
    [userId, attemptId, waitForReconnect],
  );

  return (
    <Context.Provider
      value={{
        userId,
        attemptId,
        isGrading: grading || resuming,
        clock,
        pause,
        expire,
        settled,
        goalCount,
      }}
    >
      <QuestionHostProvider
        value={{
          question: current.question,
          advance,
          grade,
          registerUnanswered,
        }}
      >
        {/* 平坦化させない。押せなくする間だけ実体の view ができると、中の
            ネイティブの view が付け替えられ、開いたばかりの中止の確認
            （Modal）が iOS で表示に失敗して、押せない画面が残る */}
        <View
          style={styles.fill}
          collapsable={false}
          pointerEvents={grading || resuming ? "none" : "auto"}
        >
          {children}
        </View>
      </QuestionHostProvider>
      {reconnect && (
        <View style={styles.overlay}>
          <View style={styles.reconnectPanel}>
            <Text style={styles.reconnectText}>{t(reconnect.message)}</Text>
            <Button onPress={reconnect.onPress}>{t("reconnect")}</Button>
          </View>
        </View>
      )}
    </Context.Provider>
  );
}

/** 記録付きでしか始めないチャレンジを始められなかった。説明画面へ置き換える */
function BackToIntro({ slug }: { readonly slug: PracticeMenuSlug }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(practiceHref(slug));
  }, [router, slug]);
  return <PreparingScreen slug={slug} />;
}

/** 通信できず、記録付きのチャレンジを始められなかった */
function OfflineScreen({
  slug,
  variant,
  onRetry,
}: {
  readonly slug: PracticeMenuSlug;
  readonly variant: string;
  readonly onRetry: () => void;
}) {
  const t = useTranslations("challenge.recording");
  const tMenu = useTranslations(practiceMenuBySlug(slug).namespace);
  const router = useRouter();
  return (
    <Screen title={tMenu("title")} back backIcon="close">
      <View style={styles.offline}>
        <Text style={styles.offlineTitle}>{t("offlineTitle")}</Text>
        <Text style={styles.offlineMessage}>{t("offlineMessage")}</Text>
        <Button onPress={onRetry} fullWidth>
          {t("retry")}
        </Button>
        <TextLink
          onPress={() => router.replace(practiceTrainingHref(slug, variant))}
        >
          {t("training")}
        </TextLink>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  reconnectPanel: {
    gap: 16,
    alignItems: "center",
  },
  reconnectText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.foreground,
    textAlign: "center",
  },
  offline: {
    gap: 16,
    paddingVertical: 24,
    alignItems: "center",
  },
  offlineTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  offlineMessage: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface600,
    textAlign: "center",
  },
});
