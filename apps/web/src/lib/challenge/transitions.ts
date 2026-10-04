import { practiceMenuByType } from "@mahjong-scoring/features/practice-menu-types";
import type {
  ChallengeQuestion,
  ChallengeState,
} from "@mahjong-scoring/features/challenge/types";

/** 挑戦行を受け付ける期限。これを過ぎた行は回答も確定もできない。 */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
/** 開始直後のカウントダウン（3, 2, 1）の長さ。この間は時計を進めない。 */
const COUNTDOWN_MS = 3000;
/** 回答から次の回答を受け付けるまでの間隔。連打で問題を読み飛ばさせない。 */
const ANSWER_INTERVAL_MS = 800;
/**
 * 採点の応答を返してから時計を動かし始めるまでの猶予
 * 応答の猶予
 *
 * 採点はサーバーで行うため、押してから正誤が画面に届くまで通信の往復と
 * サーバーの処理が掛かる。その時間を競技時間に数えると、回線の遅い人ほど
 * 同じ 60 秒で解ける問題が減る。
 *
 * サーバーの処理時間（認証・行ロック・採点・次問の生成）は、回答を受け取った
 * 時刻と応答を組んだ時刻の差として実測できるので、そのまま除く。ネットワークの
 * 往復はクライアントの申告になり信用できないので、全員に同じ固定の猶予を
 * 与える（日本から東京リージョンへの往復の典型値）。受け取るまでの片道は
 * 数えられてしまうが、押した時刻は申告でしか知れないので受け入れる。
 *
 * 正誤の表示（`ANSWER_INTERVAL_MS`）は猶予に含めない — これは採点が
 * ローカルだった頃から数えていた時間で、含めると 1 分で解ける問題数が
 * 2 割以上増えて過去の記録と比べられなくなる。
 */
export const RESPONSE_GRACE_MS = 100;

/** サーバー時計で測る実プレイ時間。一時停止時間を含めない。 */
export function challengeElapsed(state: ChallengeState, now: number): number {
  return (
    state.elapsedMs + (state.paused ? 0 : Math.max(0, now - state.resumedAt))
  );
}

/** 制限時間（ミリ秒）。サーバー時計の経過時間と比べる単位に揃える。 */
function timeLimitMs(state: ChallengeState): number {
  return practiceMenuByType(state.menuType).timeLimit * 1000;
}

/** 制限時間を使い切ったか */
export function isChallengeTimeUp(state: ChallengeState, now: number): boolean {
  return challengeElapsed(state, now) >= timeLimitMs(state);
}

/** 行が受付期限（作成から 24 時間）を過ぎたか */
function isChallengeStale(state: ChallengeState, now: number): boolean {
  return now - state.createdAt >= MAX_AGE_MS;
}

/** 開始直後の状態。カウントダウンが終わるまで時計も回答も止めておく。 */
export function startedChallenge(
  fields: Pick<
    ChallengeState,
    "menuType" | "variant" | "settings" | "question"
  >,
  now: number,
): ChallengeState {
  return {
    ...fields,
    sequence: 0,
    score: 0,
    incorrectAnswers: 0,
    elapsedMs: 0,
    resumedAt: now + COUNTDOWN_MS,
    paused: false,
    answerAfter: now + COUNTDOWN_MS,
    createdAt: now,
  };
}

/** 回答受付条件。古い問題番号、早押し、停止中、期限切れ、ミス上限後は拒否する。 */
export function canAnswerChallenge(
  state: ChallengeState,
  sequence: number,
  now: number,
): boolean {
  const rules = practiceMenuByType(state.menuType);
  return (
    sequence === state.sequence &&
    !state.paused &&
    now >= state.answerAfter &&
    now >= state.resumedAt &&
    !isChallengeStale(state, now) &&
    !isChallengeTimeUp(state, now) &&
    state.incorrectAnswers < rules.mistakeLimit
  );
}

/**
 * 受け付けた回答を数え、次の問題へ進めた状態
 *
 * 回答を受け取った時刻（`receivedAt`）までの経過を畳み込み、時計の起点を
 * 応答を組んだ時刻（`respondedAt`）の猶予（{@link RESPONSE_GRACE_MS}）後に
 * 置く。カウントダウン中（{@link startedChallenge}）と同じ仕組みで、起点が
 * 来るまで `challengeElapsed` は進まない。受け取ってから応答を組むまでの
 * 処理時間は、こうしてそのまま競技時間から外れる。
 *
 * 画面側は押してから応答が届くまで時計を止め、届いた応答の経過時間に
 * 合わせ直す。応答が届くのは `respondedAt` の片道後なので、画面はサーバーが
 * 動き出す（猶予後）のとほぼ同時に動き出す。
 */
export function answeredChallenge(
  state: ChallengeState,
  correct: boolean,
  next: ChallengeQuestion,
  receivedAt: number,
  respondedAt: number = receivedAt,
): ChallengeState {
  return {
    ...state,
    question: next,
    sequence: state.sequence + 1,
    score: state.score + Number(correct),
    incorrectAnswers: state.incorrectAnswers + Number(!correct),
    elapsedMs: challengeElapsed(state, receivedAt),
    resumedAt: respondedAt + RESPONSE_GRACE_MS,
    answerAfter: receivedAt + ANSWER_INTERVAL_MS,
  };
}

/** 一時停止・再開を受け付けられるか。期限切れと時間切れの後は動かさない。 */
export function canPauseChallenge(state: ChallengeState, now: number): boolean {
  return !isChallengeStale(state, now) && !isChallengeTimeUp(state, now);
}

/** 一時停止・再開した状態。それまでの経過を畳み込み、時計の起点を今にする。 */
export function pausedChallenge(
  state: ChallengeState,
  paused: boolean,
  now: number,
): ChallengeState {
  return {
    ...state,
    paused,
    elapsedMs: challengeElapsed(state, now),
    resumedAt: now,
  };
}

/**
 * 成績として確定できるなら、記録する所要時間（秒）を返す
 *
 * ミス上限か時間切れに達するまで挑戦は未完了で、早期提出では確定させない。
 * 所要時間は制限時間を上限に丸める（一時停止を挟んでも制限時間を超えて
 * 記録しない）。期限切れの行は確定しない。
 */
export function finishedChallengeTime(
  state: ChallengeState,
  now: number,
): number | undefined {
  if (isChallengeStale(state, now)) return undefined;
  const rules = practiceMenuByType(state.menuType);
  const elapsed = challengeElapsed(state, now);
  if (
    state.incorrectAnswers < rules.mistakeLimit &&
    elapsed < timeLimitMs(state)
  )
    return undefined;
  return Math.min(rules.timeLimit, Math.round(elapsed / 1000));
}

/** 残り時間（ミリ秒）。0 以下なら時間切れ。 */
export function challengeRemainingMs(
  state: ChallengeState,
  now: number,
): number {
  return timeLimitMs(state) - challengeElapsed(state, now);
}
