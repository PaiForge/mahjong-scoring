import {
  KNOWN_AUTH_PROVIDERS,
  isKnownAuthProvider,
} from "@mahjong-scoring/features/account/auth-provider";

/**
 * ログイン方法のプロバイダを `app_metadata` から読む
 * ログイン方法読み取り
 *
 * `providers` は連携しているプロバイダの一覧（Google を足した人は
 * `["email", "google"]`）。認証サーバーがログイン・検証のたびに書き直す値で、
 * 管理 API で連携だけ足した直後は古いことがある。無ければ最初に登録した
 * `provider` 1 つに落とす。
 *
 * 並びは `KNOWN_AUTH_PROVIDERS` の順に揃え、辞書に無いプロバイダはその後ろに
 * 元の順で置く。`providers` は連携した順で人ごとに並びが違うため、そのままだと
 * 一覧の列を縦に目で追えない。重複は 1 つにまとめる。
 */
export function readLoginProviders(appMetadata: {
  readonly provider?: string;
  readonly providers?: unknown;
}): readonly string[] {
  const names = rawProviders(appMetadata);
  const unique = [...new Set(names)];
  return [
    ...KNOWN_AUTH_PROVIDERS.filter((known) => unique.includes(known)),
    ...unique.filter((name) => !isKnownAuthProvider(name)),
  ];
}

/** `providers`（無ければ `provider`）を並べ替える前の形で取り出す */
function rawProviders(appMetadata: {
  readonly provider?: string;
  readonly providers?: unknown;
}): readonly string[] {
  const { providers } = appMetadata;
  if (Array.isArray(providers)) {
    const names = providers.filter((p): p is string => typeof p === "string");
    if (names.length > 0) return names;
  }
  return appMetadata.provider === undefined ? [] : [appMetadata.provider];
}
