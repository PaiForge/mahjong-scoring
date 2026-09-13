"use server";

import { Resend } from "resend";

import { SITE_NAME } from "@/app/_lib/metadata";
import type { ActionResult } from "@/lib/action-types";
import { escapeHtml } from "@/lib/escape-html";
import { enforceIpRateLimit } from "@/lib/rate-limit-ip";
import type { RateLimitErrorCode } from "@/lib/rate-limit-ip";
import { parseContactForm } from "@/lib/validations/contact";
import type { ContactValidationErrorKey } from "@/lib/validations/contact";

/**
 * Resend で送信元ドメインを認証していない環境向けの送信元。
 * Resend が用意しているテスト用アドレスで、アカウント所有者のメールアドレス
 * 宛てにしか届かない。本番では `CONTACT_FROM_EMAIL` を必ず設定する
 */
const FALLBACK_FROM_EMAIL = "onboarding@resend.dev";

/**
 * 問い合わせ送信の失敗理由
 *
 * - `invalidInput` / 各検証キー — 内容が検証を通らない（確認画面へ来る前に
 *   入力画面で弾いているので、通常は直接 URL を組んだ場合にしか出ない）
 * - `sendFailed` — Resend が受け付けなかった、または送信設定が無い
 */
export type SendContactMailError =
  | RateLimitErrorCode
  | ContactValidationErrorKey
  | "invalidInput"
  | "sendFailed";

export type SendContactMailResult = ActionResult<SendContactMailError>;

/**
 * 問い合わせ内容を運営のメールアドレスへ送る Server Action。
 * 問い合わせ送信
 *
 * 未ログインでも叩けるため、IP レートリミット → 検証 → 送信の順に通す。
 * 返信先（Reply-To）に送信者のメールアドレスを入れるので、受信側は
 * メーラーの「返信」でそのまま返せる。
 *
 * 環境変数:
 * - `RESEND_API_KEY` — 必須。無ければ送らずに `sendFailed`
 * - `CONTACT_TO_EMAIL` — 必須。受信する運営のメールアドレス
 * - `CONTACT_FROM_EMAIL` — Resend で認証済みドメインのアドレス。
 *   未設定なら Resend のテスト用アドレスから送る
 */
export async function sendContactMail(
  input: unknown,
): Promise<SendContactMailResult> {
  const rateLimited = await enforceIpRateLimit("contact");
  if (rateLimited) {
    return rateLimited;
  }

  const parsed = parseContactForm(input);
  if (!parsed.ok) {
    return { error: parsed.error };
  }
  const { name, email, subject, message } = parsed.value;

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.error(
      "[sendContactMail] RESEND_API_KEY / CONTACT_TO_EMAIL が未設定のため送信できません",
    );
    return { error: "sendFailed" };
  }

  const resend = new Resend(apiKey);
  try {
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || FALLBACK_FROM_EMAIL,
      to,
      replyTo: email,
      subject: `[${SITE_NAME}] ${subject}`,
      text: [
        `お名前: ${name}`,
        `メールアドレス: ${email}`,
        `件名: ${subject}`,
        "",
        message,
      ].join("\n"),
      html: [
        `<p><strong>お名前:</strong> ${escapeHtml(name)}</p>`,
        `<p><strong>メールアドレス:</strong> ${escapeHtml(email)}</p>`,
        `<p><strong>件名:</strong> ${escapeHtml(subject)}</p>`,
        `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
      ].join(""),
    });
    if (error) {
      console.error("[sendContactMail] Resend API error", error);
      return { error: "sendFailed" };
    }
  } catch (cause) {
    // SDK は API のエラーを戻り値で返すが、ネットワーク断などは例外で来る
    console.error("[sendContactMail] 送信に失敗しました", cause);
    return { error: "sendFailed" };
  }

  return { success: true };
}
