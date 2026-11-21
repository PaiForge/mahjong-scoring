import { useCallback, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useAnswerRecord,
  type DailyAnswerSaveResult,
} from "@mahjong-scoring/features/daily-problem/use-answer-record";
import { isDailyAnswerSaveProblem } from "@mahjong-scoring/features/daily-problem/save-status";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { isOya } from "@mahjong-scoring/core";
import type {
  AgariProblemPayload,
  JudgementResult,
  RuleSettings,
  UserAnswer,
} from "@mahjong-scoring/core";
import type {
  DailyProblemAnswerState,
  MobileDailyProblemResponse,
} from "@mahjong-scoring/features/daily-problem/mobile-api";
import {
  buildDailyProblemQuestion,
  judgeDailyProblemAnswer,
} from "@mahjong-scoring/features/daily-problem/question";
import { AGARI_SCORE_PRACTICE_HREF } from "@mahjong-scoring/features/routes";

import { useAuth } from "../auth/use-auth";
import { BoardBleedProvider } from "../board/board-bleed";
import { TehaiMentsuBreakdown } from "../board/tehai-mentsu-breakdown";
import { LoadFailed, LoadingIndicator } from "../components/load-state";
import { Screen, type ScreenHandle } from "../components/screen";
import { usePullToRefresh } from "../components/screen-refresh";
import { SectionTitle } from "../components/section-title";
import { TextLink } from "../components/text-link";
import { useCloseSession } from "../hooks/use-close-session";
import { useOpenFromModal } from "../hooks/use-open-from-modal";
import { useRuleSettingsStore } from "../hooks/use-rule-settings-store";
import { hapticJudgement } from "../lib/haptics";
import { colors } from "../lib/theme";
import { useFocusRead } from "../lib/use-focus-read";
import { QuestionDisplay } from "../practice/components/question-display";
import { QuestionPrompt } from "../practice/components/question-prompt";
import { useAgariScoreSettingsStore } from "../hooks/use-score-settings-store";
import { readModeFlags } from "../practice/endless/agari-score/practice-conditions";
import { ResultDisplay } from "../practice/endless/agari-score/result-display";
import { ScorePracticeAnswerForm } from "../practice/endless/agari-score/score-practice-answer-form";
import { PracticeEntryQuota } from "../practice/quota/practice-entry-quota";
import { fetchDailyProblem, sendDailyProblemAnswer } from "./daily-api";

/** 閉じた後に見せる画面。履歴が無い（ディープリンクで開いた）ときはホームへ */
const EXIT_HREF = "/";

/**
 * 1 回の解答。「わからない」で正解を開示したときはどちらも undefined
 * 本日の問題解答
 */
interface DailyProblemAttempt {
  readonly userAnswer?: UserAnswer;
  readonly result?: JudgementResult;
}

/**
 * 本日の問題の出題画面（web の `/daily-problem`）
 * 本日の問題画面
 *
 * 解答中の画面と同じく `(session)` の全画面のモーダルで出し、ヘッダー左の × で
 * 閉じて下の画面（ホーム）へ戻る（`useCloseSession`。ディープリンクで直接開いた
 * ときはホームへ置き換える）。問題と自分の解答はこの画面で読み、表示のたびと
 * 引っ張って更新で読み直す。読み直しに失敗しても、前に読めた盤面は出したまま
 * にする（解いている途中の盤面を失敗の表示で消さない）。
 *
 * ゲストは API を呼ばず、問題を出さない（ホームのカードもログイン中だけ。
 * 端末側に解答済みを残す仕組みが無い）。読めなかった・今日は問題が無いときは
 * 問題なしと読込失敗を区別し、失敗では再読込を案内する。
 */
export function DailyProblemScreen() {
  const { status, user } = useAuth();
  const userId = status === "signedIn" ? user?.id : undefined;
  return (
    <AccountDailyProblemScreen
      key={userId ?? status}
      userId={userId}
      loading={status === "loading"}
    />
  );
}

/** 読込済みの盤面と解答はアカウントごとに持つ。 */
function AccountDailyProblemScreen({
  userId,
  loading,
}: {
  readonly userId?: string;
  readonly loading: boolean;
}) {
  const t = useTranslations("dailyProblem");
  const close = useCloseSession(EXIT_HREF);
  const scrollRef = useRef<ScreenHandle>(null);
  // ゲスト（とログインの状態を読んでいる間）は read を渡さず、API を呼ばない
  const { state, reload } = useFocusRead(
    useMemo(
      () =>
        userId === undefined ? undefined : () => fetchDailyProblem(userId),
      [userId],
    ),
  );
  usePullToRefresh(reload);
  // 読み直しの失敗で、出している盤面を消さない（最後に読めた値を持ち続ける。
  // 描画中に前の描画の値から更新する、React の「前の props から導く state」の形）
  const [lastLoaded, setLastLoaded] = useState<
    MobileDailyProblemResponse | undefined
  >(undefined);
  if (state.kind === "loaded" && state.value !== lastLoaded)
    setLastLoaded(state.value);
  const latest = state.kind === "loaded" ? state.value : lastLoaded;
  const loaded = userId === undefined ? undefined : latest;
  const waiting = loading || (userId !== undefined && state.kind === "loading");

  const body = (() => {
    if (waiting) return <LoadingIndicator />;
    if (state.kind === "failed" && loaded === undefined)
      return (
        <LoadFailed
          message={t("board.loadFailed")}
          retry={{ label: t("board.reload"), onPress: () => void reload() }}
        />
      );
    if (loaded === undefined || loaded.problem === null || userId === undefined)
      return <Text style={styles.notice}>{t("board.unavailable")}</Text>;
    return (
      <DailyProblemBoard
        // 日をまたいで読み直したら別の問題なので、解答の状態ごと作り直す
        key={loaded.day}
        userId={userId}
        day={loaded.day}
        payload={loaded.problem.payload}
        initialAnswer={loaded.answer ?? undefined}
        scrollToTop={() => scrollRef.current?.scrollToTop()}
        onClose={close}
        onReload={reload}
      />
    );
  })();

  return (
    <Screen
      ref={scrollRef}
      title={t("title")}
      back
      backIcon="close"
      onBack={close}
      contentStyle={styles.content}
    >
      {body}
    </Screen>
  );
}

/**
 * 本日の問題の盤面
 * 本日の問題盤面
 *
 * 全員に同じ和了形の点数計算 1 問を、和了形の点数計算の盤面と同じ表示部品で
 * 解かせる（盤面 → 出題文 → 回答欄 → 「わからない」、答え合わせでは面子分解 →
 * 結果表 → 「もっと解く」）。
 *
 * @design 回数制限を通さず、保存 API にも送らず、盤面はローカルの state で持つ
 * 出題の許可（`beginPracticeQuestion` / `usePracticeQuota`）を取らず、出した問題を
 * 練習の問題の保存 API（`practice-problems`）にも送らない。全員に同じ 1 問なので、
 * 何度開いても無料枠の抜け道にならない。和了形の点数計算の単一ストア
 * （`useAgariScoreStore`）も、無限訓練のシェル（`useEndlessBoardShell`）も使わない —
 * 共有すると無限訓練の成績・出題中の問題と混ざるため。解答の状態はこの部品の
 * `useState` だけに置く。手牌の見せ方の設定（`HandPresentationProvider`）も
 * 通さない（全員に同じ盤面を同じ形で見せる）。
 *
 * @design 解答済みでも同じ盤面をもう一度解ける。記録は変わらない
 * 見直しを禁じる理由が無いので、解答済み（`initialAnswer`）でも盤面はそのまま出す。
 * 日付・解答済み・記録済みの案内は盤面に足さない — 和了形の点数計算と同じ並びに
 * 保つため。知らせるのは記録できなかったときだけ（`isDailyAnswerSaveProblem`）。記録の API は、この盤面を
 * 開いてから最初の回答または「わからない」で記録する（「わからない」は
 * 不正解）。サーバーは最初の解答だけを残し、日付をまたいで届いた解答（前日に
 * 開いたまま今日解いたもの）は `staleDay` で弾いて記録しない — 前日の問題を今日の
 * 解答として残さない。送信の失敗（通信・`staleDay`・ユーザー名未設定）は答え合わせを
 * 止めず、その旨を示す。通信失敗は最初の正誤を端末に預け、同じ内容を再送する。
 *
 * 問題は端末のルール設定（設定画面の麻雀ルール。端末ローカル）で組み立て、採点も
 * 同じ設定で行う（`buildDailyProblemQuestion` / `judgeDailyProblemAnswer`。回答する
 * 項目（役・翻数と符・5翻以上の翻数・満貫以上の符）は和了形の点数計算の設定に
 * 揃え、回答欄・採点・結果表に同じ値を渡す）。出題する盤面はどの設定でも
 * 正解が変わらないものに絞ってある。組み立てに失敗したら（保存形式と現行の
 * ルールの食い違い等）「出題できない」とだけ出す。
 *
 * 答え合わせのあとは「もっと解く」の節に、和了形の点数計算の設定画面への入口
 * （モーダルを閉じてから積む `useOpenFromModal`）と今日の残り回数
 * （`PracticeEntryQuota`）、ホームへ戻る操作を置く。ホームから来た導線なので
 * 料金への誘いは控えめにしたい（web は料金のリンクを使い切ったときだけ出す）が、
 * アプリの `PracticeEntryQuota` はもともと料金への導線を持たない（審査ガイドライン
 * 3.1.1。Pro の案内はペイウォールとプラン画面）ので、そのまま置けば足りる。
 * Pro・付与の利用者には既存の「回数無制限」の帯がそのまま出る。
 */
function DailyProblemBoard({
  userId,
  day,
  payload,
  initialAnswer,
  scrollToTop,
  onClose,
  onReload,
}: {
  /** 解答を記録する名義（読んだときのログイン中のユーザー） */
  readonly userId: string;
  /** 問題の日付（JST の `YYYY-MM-DD`）。記録の API へそのまま送る */
  readonly day: string;
  /** 今日の問題の盤面 */
  readonly payload: AgariProblemPayload;
  /** 今日すでに解答していればその記録（最初の解答） */
  readonly initialAnswer: DailyProblemAnswerState | undefined;
  /** 本文を先頭へ戻す（回答・開示で表示が切り替わったとき） */
  readonly scrollToTop: () => void;
  /** 画面を閉じる（「ホームへ戻る」） */
  readonly onClose: () => void;
  readonly onReload: () => Promise<void>;
}) {
  const t = useTranslations("dailyProblem");
  const tScore = useTranslations("agariScore");
  const tTraining = useTranslations("training");
  const openFromModal = useOpenFromModal();
  // ストアの状態は RuleSettings の全項目を持つ（setter を足した形）。参照は値が
  // 変わったときだけ変わるので、そのまま組み立ての依存にする
  const settings: RuleSettings = useRuleSettingsStore();
  // 回答する項目は和了形の点数計算の設定に揃える。練習の盤面と同じく開いたときの
  // 設定で固定する（解いている途中で欄が変わらない）
  const [mode] = useState(() =>
    readModeFlags(useAgariScoreSettingsStore.getState()),
  );
  const built = useMemo(
    () => buildDailyProblemQuestion(payload, settings),
    [payload, settings],
  );
  const question = built.isOk() ? built.value : undefined;

  const [attempt, setAttempt] = useState<DailyProblemAttempt | undefined>(
    undefined,
  );

  const isAnswered = attempt !== undefined;

  const send = useCallback(
    async (isCorrect: boolean): Promise<DailyAnswerSaveResult> => {
      const response = await sendDailyProblemAnswer(userId, day, isCorrect);
      if ("value" in response) return "saved";
      if (response.error === "staleDay") return "staleDay";
      if (
        response.error === "deleted" ||
        response.error === "banned" ||
        response.error === "unauthorized"
      )
        return "blocked";
      return "failed";
    },
    [userId, day],
  );
  const { ready, status, record, retry } = useAnswerRecord({
    day,
    userId,
    storage: AsyncStorage,
    send,
    answered: initialAnswer !== undefined,
  });

  const handleSubmit = useCallback(
    (answer: UserAnswer) => {
      if (question === undefined) return;
      scrollToTop();
      const result = judgeDailyProblemAnswer(question, answer, settings, mode);
      hapticJudgement(result.isCorrect ? "correct" : "incorrect");
      setAttempt({ userAnswer: answer, result });
      record(result.isCorrect);
    },
    [question, settings, mode, record, scrollToTop],
  );

  const handleReveal = useCallback(() => {
    scrollToTop();
    setAttempt({});
    record(false);
  }, [record, scrollToTop]);

  if (question === undefined) {
    return <Text style={styles.notice}>{t("board.unsupported")}</Text>;
  }

  return (
    <>
      {isDailyAnswerSaveProblem(status) && (
        <View accessibilityLiveRegion="polite" style={styles.result}>
          <Text style={styles.notice}>
            {
              t(
                `save.${status}`,
              ) /* save.failed / save.staleDay / save.anonymous / save.blocked */
            }
          </Text>
          {status === "failed" && (
            <TextLink onPress={() => void retry()} testID="daily-problem-retry">
              {t("save.retry")}
            </TextLink>
          )}
          {status === "staleDay" && (
            <TextLink
              onPress={() => void onReload()}
              testID="daily-problem-reload"
            >
              {t("board.reload")}
            </TextLink>
          )}
        </View>
      )}
      {/* 盤面が本文の先頭にあるときだけ手牌の帯をヘッダーの直下へ詰める（和了形の
          点数計算と同じ）。記録できなかった案内が上にあるときは詰めない — 詰めると
          案内に食い込む */}
      <BoardBleedProvider flushTop={!isDailyAnswerSaveProblem(status)}>
        <View style={styles.board}>
          <QuestionDisplay question={question} />

          {isAnswered ? (
            <View style={styles.result}>
              <TehaiMentsuBreakdown tehai={question.tehai} context={question} />
              <ResultDisplay
                question={question}
                userAnswer={attempt.userAnswer}
                result={attempt.result}
                {...mode}
              />
            </View>
          ) : !ready ? (
            <LoadingIndicator />
          ) : (
            <View style={styles.answering}>
              <QuestionPrompt>{tScore("board.questionPrompt")}</QuestionPrompt>
              <ScorePracticeAnswerForm
                onSubmit={handleSubmit}
                isTsumo={question.isTsumo}
                isOya={isOya(question.jikaze)}
                {...mode}
                autoSubmit
              />
            </View>
          )}
        </View>
      </BoardBleedProvider>

      {isAnswered ? (
        <>
          <View style={styles.more} testID="daily-problem-more">
            <SectionTitle>{t("more.title")}</SectionTitle>
            <Text style={styles.notice}>{t("more.hint")}</Text>
            <View style={styles.moreLink}>
              <TextLink
                onPress={() => openFromModal(AGARI_SCORE_PRACTICE_HREF)}
                testID="daily-problem-to-practice"
              >
                {t("more.link")}
              </TextLink>
            </View>
            <PracticeEntryQuota menu="agari-score" />
          </View>
          <View style={styles.home}>
            <TextLink onPress={onClose} testID="daily-problem-home">
              {t("more.home")}
            </TextLink>
          </View>
        </>
      ) : (
        ready && (
          <View style={styles.home}>
            <TextLink onPress={handleReveal} testID="daily-problem-reveal">
              {tTraining("revealButton")}
            </TextLink>
          </View>
        )
      )}
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  board: {
    gap: 24,
  },
  result: {
    gap: 16,
  },
  answering: {
    gap: 16,
  },
  more: {
    gap: 16,
  },
  moreLink: {
    alignItems: "flex-start",
  },
  home: {
    alignItems: "center",
  },
  notice: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface500,
  },
});
