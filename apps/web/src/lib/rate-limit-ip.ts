/**
 * IP ベースのインメモリレートリミッター。
 * Server Action（未認証エンドポイント）向けの固定ウィンドウ方式。
 * IPレートリミッター
 *
 * 制限事項:
 * - インメモリ（Map）ベースのため、マルチインスタンス環境ではインスタンス間で
 *   レートリミットの状態が共有されない。
 * - Serverless 環境（Vercel Functions 等）ではコールドスタートごとにストアが
 *   リセットされるため、制限の精度が低下する。
 * - Supabase サーバーサイドのレートリミットとの二重防御により、上記制限の
 *   影響を緩和している。
 *
 * TODO: 本番環境のスケール時には Redis（Upstash 等）ベースの実装に移行し、
 * インスタンス間で状態を共有できるようにする。
 */

export interface IpRateLimitConfig {
  readonly maxRequests: number;
  readonly windowMs: number;
}

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

/**
 * 期限切れの記録を捨てる。
 *
 * 時刻を引数で受けるのは、呼び出し元の判定と同じ瞬間を見るため。ここで
 * 時計を読み直すと、掃除と許可判定がミリ秒単位でずれた時刻を見ることになり、
 * ちょうど境界に当たった記録を「掃除では期限切れ、判定では有効」と
 * 食い違って扱いうる。
 */
function cleanup(now: number) {
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

/** テスト用: ストアをリセットする */
export function _resetStore() {
  store.clear();
}

/**
 * 指定 IP・アクションの組み合わせがレートリミット内かを判定する。
 * IPレートリミットチェック
 *
 * @param ip - クライアント IP
 * @param action - アクションキー（例: `'signIn'`）
 * @param config - レートリミット設定
 * @param now - 判定に使う現在時刻（ミリ秒）。既定は `Date.now()`
 *
 * `now` を引数に出しているのは、ウィンドウの境界（`resetAt` ちょうど）で
 * 許可するか拒むかという、この関数の一番きわどい分岐をテストが直接
 * 指定できるようにするため。時計を関数の中だけで読んでいると、境界の検証に
 * タイマーの差し替えが要る上、掃除と判定で別々の時刻を見る余地が残る。
 */
export function checkIpRateLimit(
  ip: string,
  action: string,
  config: Readonly<IpRateLimitConfig>,
  now: number = Date.now(),
): { allowed: boolean } {
  cleanup(now);

  const key = `${ip}:${action}`;
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true };
  }

  if (entry.count < config.maxRequests) {
    entry.count++;
    return { allowed: true };
  }

  return { allowed: false };
}

/** 各アクションのレートリミット設定 */
export const IP_RATE_LIMITS = {
  signIn: { maxRequests: 10, windowMs: 300_000 },
  signUp: { maxRequests: 5, windowMs: 300_000 },
  forgotPassword: { maxRequests: 3, windowMs: 300_000 },
  resendEmail: { maxRequests: 3, windowMs: 300_000 },
  resetPassword: { maxRequests: 5, windowMs: 300_000 },
  username: { maxRequests: 5, windowMs: 300_000 },
  deleteAccount: { maxRequests: 5, windowMs: 300_000 },
  uploadAvatar: { maxRequests: 5, windowMs: 600_000 },
  deleteAvatar: { maxRequests: 5, windowMs: 600_000 },
  // 管理画面の広告画像。管理者しか通らないが、差し替えを続けて試す運用を
  // 妨げない程度に緩めにする
  uploadAdImage: { maxRequests: 30, windowMs: 600_000 },
  updateProfile: { maxRequests: 10, windowMs: 600_000 },
  updateLeaderboardVisibility: { maxRequests: 20, windowMs: 600_000 },
  // 未ログインで叩けるメール送信。Resend の送信枠（アカウント単位）を
  // 1 つの IP に食い潰されないよう短い窓で絞る
  contact: { maxRequests: 3, windowMs: 60_000 },
  // エンドレス練習の 1 問ごとの消費。本来の上限は無料枠（1 日 3〜5 問）と
  // Pro の無制限で決まるので、ここは連打や自動化を止める網だけ。1 問に
  // 数秒は掛かるため、10 分で 120 回なら人の操作は引っ掛からない
  beginPracticeQuestion: { maxRequests: 120, windowMs: 600_000 },
  // 盤面に戻ってきたときの残数の取り直し（消費しない）。戻る操作の回数
  // だけ増えるので、出題の網とは別に数えて互いの枠を食い合わせない
  peekPracticeQuota: { maxRequests: 120, windowMs: 600_000 },
  // Stripe Checkout の作成と完了の着地。Stripe 側に顧客・Session を作る操作
  // なので、連打や自動化で Stripe の API を叩かせない
  createCheckoutSession: { maxRequests: 5, windowMs: 600_000 },
  completeCheckout: { maxRequests: 10, windowMs: 600_000 },
  // 通知の既読化。一覧を順に開くと 1 件ずつ飛ぶので、人の操作が
  // 引っ掛からない程度に取る
  markNotificationsRead: { maxRequests: 60, windowMs: 600_000 },
  // チャレンジの開始。呼ぶたびに challenge_attempts へ 1 行作るので、連打や
  // 自動化で行を増やし続けさせない。1 回は最短でも数十秒掛かり、すぐ
  // やり直しても 10 分で 60 回には届かない
  beginChallenge: { maxRequests: 60, windowMs: 600_000 },
  // アプリが起動・復帰・ログインのたびに読むアカウント状態。書き込みは
  // しないので、認証サーバーへの問い合わせを連打させない程度に取る
  readMobileAccount: { maxRequests: 60, windowMs: 600_000 },
  // アプリの記録付きチャレンジの回答。1 回のチャレンジで数十問、通信の
  // 失敗で同じ回答を送り直すこともあるので、人の操作が届かない程度に広く取る
  answerChallenge: { maxRequests: 600, windowMs: 600_000 },
  // アプリのチャレンジの一時停止・状態の取り直し・時間切れの問題の取得。
  // 裏に回る・通信が戻るたびに飛ぶ
  readChallenge: { maxRequests: 300, windowMs: 600_000 },
  // アプリのチャレンジの確定。送り直しを含めても開始の回数を超えない
  finishChallenge: { maxRequests: 60, windowMs: 600_000 },
  // アプリが画面を開くたびに読む進み具合
  readMobileProgress: { maxRequests: 120, windowMs: 600_000 },
  // アプリのレッスン完了の記録（未送信分の送り直しを含む）
  completeLessons: { maxRequests: 60, windowMs: 600_000 },
  // アプリが Apple でログインした直後に認可コードを預ける。ログイン 1 回に
  // 1 度（失敗の送り直しを含めて数回）しか飛ばない。Apple への問い合わせを伴う
  saveAppleToken: { maxRequests: 20, windowMs: 600_000 },
} as const;

/**
 * Server Action 用の IP レートリミットガード。
 * 制限超過時は `{ error: 'rateLimited' }` を返し、許可時は undefined を返す。
 * IPレートリミットガード
 *
 * @param ip - クライアント IP（`getClientIp()` の戻り値）
 * @param key - アクションキー（例: `'signIn'`）
 * @param config - レートリミット設定
 */
/**
 * レートリミット超過を表すエラーコード
 *
 * これを返すアクションは `ActionResult` の union にこの型を含める。
 */
export type RateLimitErrorCode = "rateLimited";

export function checkIpRateLimitGuard(
  ip: string | undefined,
  key: string,
  config: Readonly<IpRateLimitConfig>,
): { error: RateLimitErrorCode } | undefined {
  const effectiveIp = ip ?? "unknown";
  const { allowed } = checkIpRateLimit(effectiveIp, key, config);
  if (!allowed) {
    return { error: "rateLimited" };
  }
  return undefined;
}

/**
 * Server Action 用の IP レートリミットラッパー。
 * `getClientIp()` の呼び出しとガード判定を一括で行い、
 * 制限超過時は `{ error: 'rateLimited' }` を返す。
 * IPレートリミット一括チェック
 *
 * @param key - アクションキー（`IP_RATE_LIMITS` のキー）
 * @param config - レートリミット設定（省略時は `IP_RATE_LIMITS[key]`）
 */
export async function enforceIpRateLimit(
  key: keyof typeof IP_RATE_LIMITS,
  config: Readonly<IpRateLimitConfig> = IP_RATE_LIMITS[key],
): Promise<{ error: RateLimitErrorCode } | undefined> {
  const { getClientIp } = await import("./client-ip");
  const ip = await getClientIp();
  return checkIpRateLimitGuard(ip, key, config);
}
