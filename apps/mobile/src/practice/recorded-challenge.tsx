import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { randomUUID } from "expo-crypto";
import { useTranslations } from "use-intl";
import type { ChallengeQuestion } from "@mahjong-scoring/features/challenge/types";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { practiceTrainingHref } from "@mahjong-scoring/features/routes";
import { QuestionHostProvider } from "@mahjong-scoring/features/practice/use-question-host";
import type { ClockReading } from "@mahjong-scoring/features/session/use-timed-session";

import { refreshAccount, useAuth } from "../auth/use-auth";
import { Button } from "../components/button";
import { Screen } from "../components/screen";
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
import {
  answerRecordedChallenge,
  beginRecordedChallenge,
  isRetryableFailure,
  pauseRecordedChallenge,
  readRecordedChallenge,
  readUnansweredQuestion,
  type RecordsApiResult,
} from "../records/records-api";
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
}

const Context = createContext<RecordedChallenge | undefined>(undefined);

/**
 * 記録付きのチャレンジの操作を読む。ゲスト（端末で採点する）なら undefined
 * 記録付きチャレンジ参照
 */
export function useRecordedChallenge(): RecordedChallenge | undefined {
  return useContext(Context);
}

/** 通信の失敗を送り直す間隔（ミリ秒）。尽きたら利用者に再接続を任せる */
const RETRY_DELAYS_MS = [500, 1000, 2000] as const;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 通信の失敗だけを、間を空けて数回送り直す */
async function withRetries<T>(
  send: () => Promise<RecordsApiResult<T>>,
): Promise<RecordsApiResult<T>> {
  let result = await send();
  for (const delay of RETRY_DELAYS_MS) {
    if (!("error" in result) || !isRetryableFailure(result.error)) break;
    await wait(delay);
    result = await send();
  }
  return result;
}

interface ServerQuestion {
  readonly question: ChallengeQuestion;
  readonly sequence: number;
}

type Mode =
  | { readonly kind: "checking" }
  | { readonly kind: "local" }
  | { readonly kind: "offline" }
  | {
      readonly kind: "ready";
      readonly userId: string;
      readonly attemptId: string;
      readonly initial: ServerQuestion;
    };

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
 */
export function RecordedChallengeProvider({
  slug,
  variant,
  children,
}: {
  readonly slug: PracticeMenuSlug;
  readonly variant: string;
  readonly children: ReactNode;
}) {
  const auth = useAuth();
  const recordable =
    auth.status === "signedIn" &&
    auth.user !== undefined &&
    auth.account?.profile !== undefined &&
    auth.account.profile !== null;
  const waitingForAccount =
    auth.status === "loading" ||
    (auth.status === "signedIn" &&
      auth.account === undefined &&
      auth.accountError === undefined);
  // アカウントの状態を読めなかった（通信の失敗）。記録できる人かが
  // 分からないので、始められない扱いにする
  const accountUnreachable =
    auth.status === "signedIn" &&
    auth.accountError !== undefined &&
    auth.accountError !== "banned";

  // サーバーが開始に答えた結果（記録付きで始めた・始められなかった・断られた）
  const [begun, setBegun] = useState<Mode | undefined>(undefined);
  // 始め方（記録付き・端末で採点）は 1 度決めたら変えない。解いている
  // 途中でアカウントの読み直しが通信で失敗しても、盤面を差し替えない
  const [frozen, setFrozen] = useState<Mode | undefined>(undefined);
  const [generation, setGeneration] = useState(0);
  // 始める ID は画面ごとに 1 つ。もう一度試すときも同じ ID で送る（サーバーは
  // 同じチャレンジを返す）
  const attemptIdRef = useRef<string | undefined>(undefined);
  const userId = auth.user?.id;
  const shouldBegin =
    !frozen &&
    !begun &&
    !waitingForAccount &&
    !accountUnreachable &&
    recordable &&
    userId !== undefined;

  const mode: Mode =
    frozen ??
    begun ??
    (waitingForAccount || shouldBegin
      ? { kind: "checking" }
      : accountUnreachable
        ? { kind: "offline" }
        : { kind: "local" });
  if (!frozen && (mode.kind === "ready" || mode.kind === "local"))
    setFrozen(mode);

  useEffect(() => {
    if (!shouldBegin) return;
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
        setBegun({ kind: "ready", userId, attemptId, initial: result.value });
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

  if (mode.kind === "local") return children;
  if (mode.kind === "offline")
    return <OfflineScreen slug={slug} variant={variant} onRetry={retry} />;
  if (mode.kind === "checking") return <PreparingScreen slug={slug} />;
  return (
    <RecordedSession
      key={mode.attemptId}
      userId={mode.userId}
      attemptId={mode.attemptId}
      initial={mode.initial}
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
  children,
}: {
  readonly userId: string;
  readonly attemptId: string;
  readonly initial: ServerQuestion;
  readonly children: ReactNode;
}) {
  const t = useTranslations("challenge.recording");
  const [current, setCurrent] = useState(initial);
  const [grading, setGrading] = useState(false);
  const [clock, setClock] = useState<ClockReading | undefined>(undefined);
  const [reconnect, setReconnect] = useState<(() => void) | undefined>(
    undefined,
  );
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

  /** サーバーの状態を読み、今の問題と時計を合わせ直す */
  const resync = useCallback(async (): Promise<boolean> => {
    const status = await withRetries(() =>
      readRecordedChallenge(userId, attemptId),
    );
    if ("error" in status) return false;
    const { value } = status;
    if (!next.current && value.sequence !== current.sequence)
      setCurrent({ question: value.question, sequence: value.sequence });
    setClock({ elapsedMs: value.elapsedMs, sequence: value.sequence });
    return true;
  }, [userId, attemptId, current.sequence]);

  const grade = useCallback(
    (answer: unknown, onGraded: (question: ChallengeQuestion) => void) => {
      if (
        busy.current ||
        next.current ||
        expiring.current ||
        serverExpired.current
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
            await new Promise<void>((resolve) => {
              setReconnect(() => () => {
                setReconnect(undefined);
                resolve();
              });
            });
            return send();
          }
          // 受け付けられなかった（別の端末で進んだ等）。サーバーに合わせる
          await resync();
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
    [current, userId, attemptId, resync],
  );

  const pause = useCallback(
    (paused: boolean) => {
      void (async () => {
        await pending.current;
        await pauseRecordedChallenge(userId, attemptId, paused);
        if (!paused) await resync();
      })();
    },
    [userId, attemptId, resync],
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
          await new Promise<void>((resolve) => {
            setReconnect(() => () => {
              setReconnect(undefined);
              resolve();
            });
          });
          return reveal();
        }
        // フィードバック中は、まだ表示していない次問を結果に足さない
        if ("value" in result && "question" in result.value && !next.current)
          unanswered.current?.(result.value.question);
        onExpired();
      };
      void reveal();
    },
    [userId, attemptId],
  );

  return (
    <Context.Provider
      value={{
        userId,
        attemptId,
        isGrading: grading,
        clock,
        pause,
        expire,
        settled,
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
        <View style={styles.fill} pointerEvents={grading ? "none" : "auto"}>
          {children}
        </View>
      </QuestionHostProvider>
      {reconnect && (
        <View style={styles.overlay}>
          <View style={styles.reconnectPanel}>
            <Text style={styles.reconnectText}>{t("connectionLost")}</Text>
            <Button onPress={reconnect}>{t("reconnect")}</Button>
          </View>
        </View>
      )}
    </Context.Provider>
  );
}

/** アカウントとサーバーを確かめている間 */
function PreparingScreen({ slug }: { readonly slug: PracticeMenuSlug }) {
  const t = useTranslations(practiceMenuBySlug(slug).namespace);
  return (
    <Screen title={t("title")} back backIcon="close">
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary500} />
      </View>
    </Screen>
  );
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
  center: {
    paddingVertical: 48,
    alignItems: "center",
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
