/**
 * IP ベースのインメモリレートリミッター。
 * Server Action（未認証エンドポイント）向けの固定ウィンドウ方式。
 * IPレートリミッター
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

function cleanup() {
  const now = Date.now();
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
 */
export function checkIpRateLimit(
  ip: string,
  action: string,
  config: Readonly<IpRateLimitConfig>,
): { allowed: boolean } {
  cleanup();

  const now = Date.now();
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
} as const;

/**
 * Server Action 用の IP レートリミットガード。
 * 制限超過時は `{ error: 'rateLimited' }` を返し、許可時は null を返す。
 * IPレートリミットガード
 *
 * @param ip - クライアント IP（`getClientIp()` の戻り値）
 * @param key - アクションキー（例: `'signIn'`）
 * @param config - レートリミット設定
 */
export function checkIpRateLimitGuard(
  ip: string | undefined,
  key: string,
  config: Readonly<IpRateLimitConfig>,
): { error: "rateLimited" } | undefined {
  const effectiveIp = ip ?? "unknown";
  const { allowed } = checkIpRateLimit(effectiveIp, key, config);
  if (!allowed) {
    return { error: "rateLimited" };
  }
  return undefined;
}
