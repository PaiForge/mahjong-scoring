import "server-only";

/**
 * Apple と直接やり取りする（認可コードの交換・連携の取り消し）ための設定
 * Apple連携設定
 */
export interface AppleServerConfig {
  /** Apple Developer のチーム ID */
  readonly teamId: string;
  /** Sign in with Apple の鍵の ID */
  readonly keyId: string;
  /** Sign in with Apple の鍵（.p8 の中身。PEM） */
  readonly privateKey: string;
  /** refresh token を暗号化する鍵（32 バイト） */
  readonly encryptionKey: Buffer;
}

/**
 * 環境変数から Apple の設定を読む。どれかが無い・形が違えば undefined
 * Apple連携設定取得
 *
 * 無いときは Apple の交換・取り消しをしない（ローカルで Apple を使わない
 * 開発や、設定前のデプロイでも他の機能は動く）。退会の取り消しの工程は、
 * 取り消すトークンがあるのに設定が無ければ失敗として再試行に回す。
 *
 * `APPLE_PRIVATE_KEY` は改行をそのまま入れても、`\n` に置き換えた 1 行でもよい
 * （`.env.local` は 1 行で書くことが多い）。
 */
export function readAppleServerConfig(): AppleServerConfig | undefined {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const encryptionKey = decodeEncryptionKey(
    process.env.APPLE_TOKEN_ENCRYPTION_KEY,
  );
  if (!teamId || !keyId || !privateKey || !encryptionKey) return undefined;
  return { teamId, keyId, privateKey, encryptionKey };
}

/** base64 の 32 バイトの鍵を読む。長さが違えば undefined */
function decodeEncryptionKey(value: string | undefined): Buffer | undefined {
  if (!value) return undefined;
  const key = Buffer.from(value, "base64");
  return key.length === 32 ? key : undefined;
}
