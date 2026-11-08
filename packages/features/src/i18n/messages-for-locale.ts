/**
 * アプリの言語ごとの辞書
 *
 * @description
 * アプリ（Expo）が辞書（`@mahjong-scoring/messages`）を丸ごと読む唯一の場所。
 * 言語は `resolveAppLocale()` で起動時に 1 つに決まり、辞書の Provider と
 * Provider の外で動く `createTranslator`（購入の同期のトースト）が、ここで選んだ
 * 同じ辞書を読む。web は `apps/web/src/i18n/request.ts` が別に読む
 * （サーバーで言語ごとに読み分け、クライアントへは一部の名前空間だけを渡す）。
 *
 * 辞書は同梱で、選ぶのは同期 — 起動直後に日本語で描いてから英語へ切り替える
 * ちらつきを出さない。
 */

import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";
import type { Messages } from "use-intl";

import type { SupportedLocale } from "./locales";

/**
 * 言語の辞書を返す
 *
 * 日本語は全名前空間、英語は完訳の名前空間の束（`@mahjong-scoring/messages/en`）。
 * 英語で日本語へ fallback しない — 英語の束に無い名前空間を引く画面は、英語では
 * キーがそのまま出る（英語の束は完訳したものだけを載せる規則）。
 *
 * 型は use-intl の `Messages`（辞書の形を型に載せていないので任意の木）。
 * `AbstractIntlMessages`（文字列と入れ子だけ）にしないのは、辞書に配列の値
 * （`mypage.heatmap.monthNames`。`t.raw` で読む）があり、その形に収まらないため
 * （収めるには型の断定が要る。web の `selectClientMessages` と同じ理由）。
 *
 * @param locale - アプリの表示言語
 * @returns use-intl の Provider と `createTranslator` に渡す辞書
 */
export function messagesForLocale(locale: SupportedLocale): Messages {
  return locale === "en" ? enMessages : jaMessages;
}
