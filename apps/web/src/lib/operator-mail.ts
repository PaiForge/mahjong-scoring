import "server-only";

/**
 * Resend で送信元ドメインを認証していない環境向けの送信元。
 * Resend が用意しているテスト用アドレスで、アカウント所有者のメールアドレス
 * 宛てにしか届かない。本番では `CONTACT_FROM_EMAIL` を必ず設定する
 */
const FALLBACK_FROM_EMAIL = "onboarding@resend.dev";

/** 運営宛てのメールを Resend で送るための設定 */
export interface OperatorMailConfig {
  readonly apiKey: string;
  /** 送信元 */
  readonly from: string;
  /** 受信する運営のメールアドレス */
  readonly to: string;
}

/**
 * 運営宛てのメール（お問い合わせ・通報の知らせ）の送信設定を環境変数から読む
 * 運営宛てメール設定
 *
 * 環境変数:
 * - `RESEND_API_KEY` — 必須
 * - `CONTACT_TO_EMAIL` — 必須。受信する運営のメールアドレス
 * - `CONTACT_FROM_EMAIL` — Resend で認証済みドメインのアドレス。
 *   未設定なら Resend のテスト用アドレスから送る
 *
 * 必須の値が欠けていれば undefined。送れないときにどう振る舞うか
 * （失敗を返すか、記録だけして続けるか）は呼び出し側が決める。
 */
export function readOperatorMailConfig(): OperatorMailConfig | undefined {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) return undefined;
  return {
    apiKey,
    from: process.env.CONTACT_FROM_EMAIL || FALLBACK_FROM_EMAIL,
    to,
  };
}
