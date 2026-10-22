import type { ChallengeQuestion } from "@mahjong-scoring/features/challenge/types";
import type { useAuth } from "../auth/use-auth";

/** サーバーが出した問題と、その番号 */
export interface ServerQuestion {
  readonly question: ChallengeQuestion;
  readonly sequence: number;
}

/**
 * 記録付きチャレンジの始め方
 * 記録付きチャレンジの状態
 *
 * - `checking`: アカウントの状態を読んでいる、またはサーバーに開始を頼んでいる
 * - `local`: 端末で採点する（ゲスト・ユーザー名を決める前・BAN 中・サーバーが
 *   記録付きで始めることを断った）
 * - `offline`: 通信できず、記録付きでは始められない
 * - `ready`: サーバーが始めた。出題と採点はサーバー
 */
export type RecordedChallengeMode =
  | { readonly kind: "checking" }
  | { readonly kind: "local" }
  | { readonly kind: "offline" }
  | {
      readonly kind: "ready";
      readonly userId: string;
      readonly attemptId: string;
      readonly initial: ServerQuestion;
      readonly goalCount: number | undefined;
    };

/** 始め方の判定に要るアカウントの状態 */
export type RecordedChallengeAuth = Pick<
  ReturnType<typeof useAuth>,
  "status" | "user" | "account" | "accountError"
>;

/**
 * 始め方の判定
 * 記録付きチャレンジの判定
 */
export interface RecordedChallengeDecision {
  /** 今の始め方（確定前は `checking`） */
  readonly mode: RecordedChallengeMode;
  /** サーバーに開始を頼むべきか（記録できる人で、まだ頼んでいない） */
  readonly shouldBegin: boolean;
  /** 記録できる人のユーザー ID。記録できなければ undefined */
  readonly userId: string | undefined;
  /** アカウントの状態を読めなかった（通信の失敗）。もう一度試すときに読み直す */
  readonly accountUnreachable: boolean;
}

/**
 * アカウントの状態と、サーバーに頼んだ結果から、始め方を決める
 * 記録付きチャレンジの判定
 *
 * ログインしてユーザー名を決めた人だけが記録できる。アカウントの状態を
 * 読み終えるまでは `checking`。読めなかった（通信の失敗）ときは記録できる人か
 * 分からないので `offline`（始められない）。
 *
 * @param begun - サーバーが開始に答えた結果（記録付きで始めた・始められなかった・断られた）
 * @param frozen - 1 度決めた始め方。解いている途中でアカウントの読み直しが
 *   通信で失敗しても、盤面を差し替えない
 */
export function resolveRecordedChallengeMode(
  auth: RecordedChallengeAuth,
  {
    begun,
    frozen,
  }: {
    readonly begun: RecordedChallengeMode | undefined;
    readonly frozen: RecordedChallengeMode | undefined;
  },
): RecordedChallengeDecision {
  const signedIn = auth.status === "signedIn";
  const recordable =
    signedIn &&
    auth.user !== undefined &&
    auth.account?.profile !== undefined &&
    auth.account.profile !== null;
  const waitingForAccount =
    auth.status === "loading" ||
    (signedIn && auth.account === undefined && auth.accountError === undefined);
  const accountUnreachable =
    signedIn &&
    auth.accountError !== undefined &&
    auth.accountError !== "banned";
  const userId = recordable ? auth.user?.id : undefined;
  const shouldBegin =
    !frozen &&
    !begun &&
    !waitingForAccount &&
    !accountUnreachable &&
    userId !== undefined;
  const mode: RecordedChallengeMode =
    frozen ??
    begun ??
    (waitingForAccount || shouldBegin
      ? { kind: "checking" }
      : accountUnreachable
        ? { kind: "offline" }
        : { kind: "local" });
  return { mode, shouldBegin, userId, accountUnreachable };
}
