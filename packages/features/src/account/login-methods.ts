import type { KnownAuthProvider } from "./auth-provider";

/**
 * アカウントにつながっているログインの連携（認証サーバーの identity）1 つ
 * ログイン連携
 *
 * `email` の連携はメールアドレスとパスワードでログインした人に 1 つだけできる。
 * `google` / `apple` は外のアカウントごとに 1 つで、同じプロバイダのものが
 * 複数つながることがある（仕事用と個人用の Google 等。付け替えの途中も
 * 新旧 2 つが並ぶ）。
 */
export interface LinkedIdentity {
  /** 認証サーバーが付けた連携の ID（外すときに指す） */
  readonly id: string;
  readonly provider: KnownAuthProvider;
  /** その連携先のアカウントのメールアドレス。アカウントのアドレスと違うことがある */
  readonly email?: string;
}

/**
 * アカウントのログイン方法のまとめ
 * ログイン方法
 *
 * メールアドレスとパスワードでログインできるかは `hasPassword` で決まり、
 * `email` の連携の有無では決まらない。Google だけで登録した人が
 * パスワードを足しても認証サーバーは `email` の連携を作らず、逆に
 * メールアドレスの変更を終えた人には連携だけができてパスワードが無い。
 */
export interface LoginMethods {
  readonly identities: readonly LinkedIdentity[];
  readonly hasPassword: boolean;
}

/**
 * web でログインできる手段のプロバイダ
 * web のログイン手段
 *
 * Apple の入口は iOS のアプリにしか無い。連携を外したあとに web で
 * ログインできる手段が残るかは、これに含まれるプロバイダで数える。
 */
const WEB_LOGIN_PROVIDERS: ReadonlySet<KnownAuthProvider> = new Set([
  "email",
  "google",
]);

/**
 * 連携を外せない理由
 *
 * - `notLinked` — その連携がこのアカウントに無い
 * - `notRemovable` — メールアドレスの連携は外す対象ではない（パスワードは
 *   API で消せず、アカウントのメールアドレスはログイン手段とは別に持つ）
 * - `lastWebMethod` — 外すと web でログインできる手段（パスワードか Google）が
 *   無くなる。先にパスワードを設定するか別の Google を追加すれば外せる
 */
export type IdentityRemovalBlocker =
  "notLinked" | "notRemovable" | "lastWebMethod";

export type IdentityRemovalDecision =
  | { readonly allowed: true; readonly identity: LinkedIdentity }
  | { readonly allowed: false; readonly reason: IdentityRemovalBlocker };

/**
 * 連携を外してよいか
 * 連携解除の判定
 *
 * 規則は「その連携を持っている」「外せる種類である」「外した後に web で
 * ログインできる手段が 1 つ以上残る」の 3 つ。認証サーバー自身の制約
 * （連携が 1 つだけなら外せない）より厳しい側に寄せる — Apple だけが
 * 残ると、今いる web には次回ログインできない。
 *
 * サーバー（Server Action）とボタンの無効化で同じ判定を使う。
 */
export function evaluateIdentityRemoval(
  methods: LoginMethods,
  identityId: string,
): IdentityRemovalDecision {
  const identity = methods.identities.find((i) => i.id === identityId);
  if (!identity) return { allowed: false, reason: "notLinked" };
  if (identity.provider === "email")
    return { allowed: false, reason: "notRemovable" };
  const remaining = methods.identities.filter((i) => i.id !== identityId);
  if (
    !hasWebLoginMethod({
      identities: remaining,
      hasPassword: methods.hasPassword,
    })
  )
    return { allowed: false, reason: "lastWebMethod" };
  return { allowed: true, identity };
}

/**
 * web でログインできる手段を 1 つ以上持っているか
 * web ログイン手段の有無
 *
 * パスワードがあれば `email` の連携の有無に関わらず数える。
 */
export function hasWebLoginMethod(methods: LoginMethods): boolean {
  return (
    methods.hasPassword ||
    methods.identities.some(
      (i) => i.provider !== "email" && WEB_LOGIN_PROVIDERS.has(i.provider),
    )
  );
}

/** Apple の「メールを非公開」が発行する中継アドレスのドメイン */
const APPLE_PRIVATE_RELAY_DOMAIN = "privaterelay.appleid.com";

/**
 * Apple の「メールを非公開」の中継アドレスか
 * Apple 中継アドレス判定
 *
 * 中継アドレスへのメールは、送信元のドメインを Apple の Private Email Relay に
 * 登録していないと届かない。確認メールを要する操作（メールアドレスの変更・
 * パスワードの設定）はこのアドレスでは完了できないので、画面は先に断る。
 */
export function isApplePrivateRelayEmail(email: string | undefined): boolean {
  if (email === undefined) return false;
  const at = email.lastIndexOf("@");
  return (
    at >= 0 && email.slice(at + 1).toLowerCase() === APPLE_PRIVATE_RELAY_DOMAIN
  );
}
