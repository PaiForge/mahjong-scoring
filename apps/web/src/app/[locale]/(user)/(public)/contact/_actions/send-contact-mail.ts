"use server";

import { Resend } from "resend";

import { SITE_NAME } from "@/app/_lib/metadata";
import type { ActionResult } from "@/lib/action-types";
import { escapeHtml } from "@/lib/escape-html";
import { logExternalError } from "@/lib/log-error";
import { readOperatorMailConfig } from "@/lib/operator-mail";
import { enforceIpRateLimit } from "@/lib/rate-limit-ip";
import type { RateLimitErrorCode } from "@/lib/rate-limit-ip";
import { parseContactForm } from "@/lib/validations/contact";
import type { ContactValidationErrorKey } from "@/lib/validations/contact";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

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
 * 送信設定（`readOperatorMailConfig`）が揃っていなければ送らずに `sendFailed`。
 *
 * 日本語以外の UI から来た問い合わせは、本文（text・html とも）の先頭に
 * `UI の言語: en` の 1 行を足す。英語で来た問い合わせだと運営が一目で分かり、
 * 返信の言語を決められるようにするため。日本語の UI からの問い合わせには
 * 何も足さない（従来のメールのまま）。件名・ラベル・利用者の本文は変えず、
 * 利用者の文章を翻訳して送ることもしない。
 *
 * @param input - 入力フォームの内容（検証前）
 * @param uiLocale - 送信した画面の言語。クライアントが明示で渡す
 *   （Server Action にリクエストのロケールが届くかに依らないため）。
 *   対応言語でない値・省略は日本語として扱う
 */
export async function sendContactMail(
  input: unknown,
  uiLocale?: string,
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

  const mail = readOperatorMailConfig();
  if (!mail) {
    console.error(
      "[sendContactMail] RESEND_API_KEY / CONTACT_TO_EMAIL が未設定のため送信できません",
    );
    return { error: "sendFailed" };
  }

  // 運営向けのラベルなので日本語のまま（辞書に載せない）。値は対応言語のコードだけ
  const uiLanguage =
    // Server Action の引数は外から任意の値で叩けるので、型に頼らず確かめる
    typeof uiLocale === "string" &&
    isSupportedLocale(uiLocale) &&
    uiLocale !== DEFAULT_LOCALE
      ? uiLocale
      : undefined;

  const resend = new Resend(mail.apiKey);
  try {
    const { error } = await resend.emails.send({
      from: mail.from,
      to: mail.to,
      replyTo: email,
      subject: `[${SITE_NAME}] ${subject}`,
      text: [
        ...(uiLanguage ? [`UI の言語: ${uiLanguage}`] : []),
        `お名前: ${name}`,
        `メールアドレス: ${email}`,
        `件名: ${subject}`,
        "",
        message,
      ].join("\n"),
      html: [
        ...(uiLanguage
          ? [`<p><strong>UI の言語:</strong> ${uiLanguage}</p>`]
          : []),
        `<p><strong>お名前:</strong> ${escapeHtml(name)}</p>`,
        `<p><strong>メールアドレス:</strong> ${escapeHtml(email)}</p>`,
        `<p><strong>件名:</strong> ${escapeHtml(subject)}</p>`,
        `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
      ].join(""),
    });
    if (error) {
      logExternalError("sendContactMail", "Resend API error", error);
      return { error: "sendFailed" };
    }
  } catch (cause) {
    // SDK は API のエラーを戻り値で返すが、ネットワーク断などは例外で来る
    logExternalError("sendContactMail", "送信に失敗しました", cause);
    return { error: "sendFailed" };
  }

  return { success: true };
}
