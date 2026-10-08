/**
 * ログイン中のアカウントのために端末に預けておく記録（純粋な状態遷移）
 * アカウント記録
 *
 * サーバーへ送り切るまで端末に残すものを、ユーザーごとに分けて持つ。
 * 送る先は預けたときのユーザーに固定し、ログアウト・別のユーザーへの
 * 切り替えの後も、他人の名義では送らない（送る側が `asUser` で確かめる）。
 * ログアウトしても消さず、同じ人がログインし直したら続きを送る。退会を
 * 受け付けたらそのユーザーの分を消す。
 *
 * ゲストの記録（端末ストアのレッスン完了・「チャレンジを終えた練習」）とは
 * 所有者を分ける。ログイン中の記録をゲストの記録へ書かず、ログアウトしても
 * ゲストの記録へ移さない。
 */

/**
 * 解いている途中の記録付きチャレンジ
 * 進行中のチャレンジ
 *
 * アプリが落ちても、次の起動で後始末できるように残す。
 */
export interface ActiveChallenge {
  readonly attemptId: string;
  readonly slug: string;
  readonly variant: string;
  /**
   * 送ったが応答をまだ受け取っていない回答。同じ番号・同じ中身で送り直すと、
   * サーバーは採点し直さずに同じ応答を返す
   */
  readonly pendingAnswer?: {
    readonly sequence: number;
    readonly answer: unknown;
  };
}

/**
 * 終わったが確定（成績の記録）を受け取れていないチャレンジ
 * 確定待ちのチャレンジ
 */
export interface PendingFinish {
  readonly attemptId: string;
  readonly slug: string;
  readonly variant: string;
}

/** 1 人のユーザーのために預けている記録 */
export interface UserRecords {
  readonly active?: ActiveChallenge;
  readonly pendingFinishes: readonly PendingFinish[];
  /** まだサーバーに記録していないレッスンの完了（章の slug） */
  readonly pendingLessons: readonly string[];
}

/** 端末全体の預かり */
export interface AccountRecords {
  readonly byUser: Readonly<Record<string, UserRecords>>;
  /**
   * ゲストのレッスン完了を、どこかのアカウントへ取り込み済みか
   *
   * 取り込むのは端末で 1 度だけ、最初にログインしたアカウントへ。2 人目の
   * アカウントへ同じゲストの記録を渡さない。その後にゲストで終えた
   * レッスンは端末のゲストの記録に残るだけで、どのアカウントにも入らない。
   */
  readonly guestLessonsImported: boolean;
}

/** 何も預けていない状態 */
export const EMPTY_ACCOUNT_RECORDS: AccountRecords = {
  byUser: {},
  guestLessonsImported: false,
};

const EMPTY_USER_RECORDS: UserRecords = {
  pendingFinishes: [],
  pendingLessons: [],
};

/** ユーザーの預かりを読む。無ければ空 */
export function recordsOf(
  records: AccountRecords,
  userId: string,
): UserRecords {
  return records.byUser[userId] ?? EMPTY_USER_RECORDS;
}

function updateUser(
  records: AccountRecords,
  userId: string,
  update: (user: UserRecords) => UserRecords,
): AccountRecords {
  return {
    ...records,
    byUser: { ...records.byUser, [userId]: update(recordsOf(records, userId)) },
  };
}

/**
 * チャレンジを始める前に、進行中として預ける
 *
 * 開始の要求より前に書く。応答を失って落ちても、同じ ID で後始末できる。
 * 前の進行中のチャレンジは捨てる（1 人が同時に解くのは 1 つだけ）。
 */
export function startChallenge(
  records: AccountRecords,
  userId: string,
  challenge: Pick<ActiveChallenge, "attemptId" | "slug" | "variant">,
): AccountRecords {
  return updateUser(records, userId, (user) => ({
    ...user,
    active: { ...challenge },
  }));
}

/** 回答を送る前に、未確認の回答として預ける */
export function sendAnswer(
  records: AccountRecords,
  userId: string,
  attemptId: string,
  pendingAnswer: NonNullable<ActiveChallenge["pendingAnswer"]>,
): AccountRecords {
  return updateUser(records, userId, (user) =>
    user.active?.attemptId === attemptId
      ? { ...user, active: { ...user.active, pendingAnswer } }
      : user,
  );
}

/** 回答の応答を受け取ったら、未確認の回答を外す（その番号のものだけ） */
export function acknowledgeAnswer(
  records: AccountRecords,
  userId: string,
  attemptId: string,
  sequence: number,
): AccountRecords {
  return updateUser(records, userId, (user) => {
    const active = user.active;
    if (
      active?.attemptId !== attemptId ||
      active.pendingAnswer?.sequence !== sequence
    )
      return user;
    return {
      ...user,
      active: {
        attemptId: active.attemptId,
        slug: active.slug,
        variant: active.variant,
      },
    };
  });
}

/**
 * 終わったチャレンジを確定待ちへ移す
 *
 * 進行中でなくても（後始末の途中で落ちた等）確定待ちには積む。同じ ID は重ねない。
 */
export function finishChallenge(
  records: AccountRecords,
  userId: string,
  challenge: PendingFinish,
): AccountRecords {
  return updateUser(records, userId, (user) => ({
    ...user,
    active:
      user.active?.attemptId === challenge.attemptId ? undefined : user.active,
    pendingFinishes: user.pendingFinishes.some(
      (pending) => pending.attemptId === challenge.attemptId,
    )
      ? user.pendingFinishes
      : [...user.pendingFinishes, { ...challenge }],
  }));
}

/** 進行中のチャレンジを捨てる（中止・後始末を終えた） */
export function dropActiveChallenge(
  records: AccountRecords,
  userId: string,
  attemptId: string,
): AccountRecords {
  return updateUser(records, userId, (user) =>
    user.active?.attemptId === attemptId
      ? { ...user, active: undefined }
      : user,
  );
}

/** 確定待ちから外す（記録できた・記録できないと分かった） */
export function dropPendingFinish(
  records: AccountRecords,
  userId: string,
  attemptId: string,
): AccountRecords {
  return updateUser(records, userId, (user) => ({
    ...user,
    pendingFinishes: user.pendingFinishes.filter(
      (pending) => pending.attemptId !== attemptId,
    ),
  }));
}

/** レッスンの完了を未送信として預ける。預け済みなら何もしない */
export function addPendingLessons(
  records: AccountRecords,
  userId: string,
  slugs: readonly string[],
): AccountRecords {
  const user = recordsOf(records, userId);
  const added = slugs.filter((slug) => !user.pendingLessons.includes(slug));
  if (added.length === 0) return records;
  return updateUser(records, userId, (current) => ({
    ...current,
    pendingLessons: [...current.pendingLessons, ...new Set(added)],
  }));
}

/** サーバーが受け取ったレッスンの完了を未送信から外す */
export function removePendingLessons(
  records: AccountRecords,
  userId: string,
  slugs: readonly string[],
): AccountRecords {
  const done = new Set(slugs);
  return updateUser(records, userId, (user) => ({
    ...user,
    pendingLessons: user.pendingLessons.filter((slug) => !done.has(slug)),
  }));
}

/**
 * ゲストのレッスン完了を、このユーザーの未送信へ取り込む（端末で 1 度だけ）
 *
 * 取り込み済みの印は未送信へ積むのと同じ書き込みで立てる。送るのは
 * いつもの未送信の送信が行う。
 */
export function importGuestLessons(
  records: AccountRecords,
  userId: string,
  guestSlugs: readonly string[],
): AccountRecords {
  if (records.guestLessonsImported) return records;
  return {
    ...addPendingLessons(records, userId, guestSlugs),
    guestLessonsImported: true,
  };
}

/** ユーザーの預かりをすべて消す（退会を受け付けたとき） */
export function purgeUser(
  records: AccountRecords,
  userId: string,
): AccountRecords {
  if (!(userId in records.byUser)) return records;
  const byUser = Object.fromEntries(
    Object.entries(records.byUser).filter(([id]) => id !== userId),
  );
  return { ...records, byUser };
}
