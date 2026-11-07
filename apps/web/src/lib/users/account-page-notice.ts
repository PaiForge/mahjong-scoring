/**
 * アカウントのページ（`/mypage/account`）に、外から戻ってきたときの報せを渡す
 * クエリの契約
 * アカウントページの報せ
 *
 * Google の追加（認証サーバー → Google → `/auth/callback`）とメールアドレスの
 * 変更の確認（メールのリンク → `/auth/callback`）は、結果が別のリクエストで
 * 戻ってくるので、トーストの預かりでは届かない（失敗は始めた側で分からない）。
 * `/auth/callback` がここで決めたキーをクエリに付けてページへ送り、ページが
 * 辞書（`mypageAccount.notices.<key>`）で文にする。
 *
 * ページ内で完結する操作（外す・メールの送信）は `toast()` で報せ、ここは通さない。
 */

export const ACCOUNT_PAGE_PATH = "/mypage/account";

const NOTICE_PARAM = "notice";

export const ACCOUNT_PAGE_NOTICES = [
  /** Google アカウントを連携した */
  "linkedGoogle",
  /** 選んだ Google アカウントは、このアカウントか別のアカウントに既につながっている */
  "linkDuplicate",
  /** Google との往復のどこかで失敗した */
  "linkFailed",
  /** メールアドレス変更の確認メールの 1 通目を開いた（もう 1 通で完了） */
  "emailChangePending",
  /** メールアドレスの変更が完了した */
  "emailChangeDone",
  /** メールアドレス変更のリンクが無効か期限切れ */
  "emailChangeLinkInvalid",
] as const;

export type AccountPageNotice = (typeof ACCOUNT_PAGE_NOTICES)[number];

const noticeSet: ReadonlySet<string> = new Set(ACCOUNT_PAGE_NOTICES);

/**
 * アカウントのページの URL（報せ付き）
 *
 * ロケール非依存のパスを返す。`/auth/callback` は入口が付けた `locale` で
 * これをその言語の公開 URL（英語なら `/en/mypage/account?notice=…`）にしてから送る。
 */
export function accountPageHref(notice?: AccountPageNotice): string {
  return notice === undefined
    ? ACCOUNT_PAGE_PATH
    : `${ACCOUNT_PAGE_PATH}?${NOTICE_PARAM}=${notice}`;
}

/**
 * `searchParams` から報せを読む。知らない値・未指定は undefined
 * 報せの読み取り
 */
export function readAccountPageNotice(
  searchParams: Readonly<
    Record<string, string | readonly string[] | undefined>
  >,
): AccountPageNotice | undefined {
  const value = searchParams[NOTICE_PARAM];
  return typeof value === "string" && isAccountPageNotice(value)
    ? value
    : undefined;
}

function isAccountPageNotice(value: string): value is AccountPageNotice {
  return noticeSet.has(value);
}

/**
 * `/auth/callback` に「Google の追加の戻り」だと伝えるクエリ
 * 連携の戻りの印
 *
 * `linkIdentity` の `redirectTo` に付け、認証サーバーが成功（`code`）も失敗
 * （`error_code`）もこのクエリごと戻してくる。コールバックはこれを見て
 * ログインの着地ではなくアカウントのページへ送る。
 */
export const LINK_RETURN_PARAM = "link";
export const LINK_RETURN_GOOGLE = "google";
