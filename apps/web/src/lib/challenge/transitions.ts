import { ANSWER_FEEDBACK_DURATION_MS } from "@mahjong-scoring/features/challenge/challenge-result-bounds";
import { practiceMenuByType } from "@mahjong-scoring/features/practice-menu-types";
import { rankRequiringMenu } from "@mahjong-scoring/features/ranks/registry";
import type {
  ChallengeQuestion,
  ChallengeState,
} from "@mahjong-scoring/features/challenge/types";

/** 挑戦行を受け付ける期限。これを過ぎた行は回答も確定もできない。 */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
/** 開始直後のカウントダウン（3, 2, 1）の長さ。この間は時計を進めない。 */
const COUNTDOWN_MS = 3000;
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
 * 実測で除けるのは「受け取ってから、時計の起点を行に書く UPDATE の直前まで」。
 * 起点を行に書く以上、UPDATE・COMMIT・応答の直列化と送出は起点より後に
 * 掛かり、この猶予の中から消費される。2026-10 の本番実測（雀頭符 11 問、
 * hnd1 → ap-northeast-1）では UPDATE + COMMIT は 13〜16ms で、100ms に
 * 十分収まっていた。参考に、同じ実測での 1 回答のサーバー処理は定常で
 * 58〜83ms（Supabase Auth の `getUser()` が 22〜41ms、BAN 判定 9〜10ms、
 * 行ロック 13〜15ms）、ブラウザから見た往復は 136〜233ms で、約 90ms は
 * 通信と Server Action の枠組みの時間。挑戦の最初の回答だけ往復 684ms
 * （接続が冷えた形で、関数のコールドスタートと見ている）。
 *
 * 正誤の表示（`ANSWER_FEEDBACK_DURATION_MS`）は猶予に含めない — これは採点が
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

/**
 * 正解数が目標に届いたか
 *
 * 目標は昇級試験の合格点（`RANK_REGISTRY` の `minScore`）。届いた時点で
 * 合否は決まり、その先の回答で結果は変わらないので、挑戦はそこで終わる。
 * 試験でない練習には目標が無く、常に false。
 */
function hasReachedGoal(state: ChallengeState): boolean {
  const goal = rankRequiringMenu(state.menuType)?.requirement.minScore;
  return goal !== undefined && state.score >= goal;
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

/** 回答受付条件。古い問題番号、早押し、停止中、期限切れ、ミス上限後、目標到達後は拒否する。 */
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
    state.incorrectAnswers < rules.mistakeLimit &&
    !hasReachedGoal(state)
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
    // 回答から次の回答を受け付けるまでの間隔。連打で問題を読み飛ばさせない。
    // クライアントの正誤表示と同じ長さで、ずれると表示中に送った回答を弾く
    answerAfter: receivedAt + ANSWER_FEEDBACK_DURATION_MS,
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
 * ミス上限・時間切れ・目標到達のどれかに達するまで挑戦は未完了で、早期提出
 * では確定させない。
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
    elapsed < timeLimitMs(state) &&
    !hasReachedGoal(state)
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
