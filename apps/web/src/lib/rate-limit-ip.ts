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
  resetPassword: { maxRequests: 5, windowMs: 300_000 },
  username: { maxRequests: 5, windowMs: 300_000 },
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

/**
 * Server Action 用の IP レートリミットラッパー。
 * `getClientIp()` の呼び出しとガード判定を一括で行い、
 * 制限超過時は `{ error: 'rateLimited' }` を返す。
 * IPレートリミット一括チェック
 *
 * @param key - アクションキー（`IP_RATE_LIMITS` のキー等）
 * @param config - レートリミット設定
 */
export async function enforceIpRateLimit(
  key: string,
  config: Readonly<IpRateLimitConfig>,
): Promise<{ error: "rateLimited" } | undefined> {
  const { getClientIp } = await import("./client-ip");
  const ip = await getClientIp();
  return checkIpRateLimitGuard(ip, key, config);
}
