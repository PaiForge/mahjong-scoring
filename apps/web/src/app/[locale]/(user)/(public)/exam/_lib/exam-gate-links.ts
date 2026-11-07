import "server-only";

import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import { DOJO_PATH } from "@mahjong-scoring/features/routes";

import {
  EXAM_GATE_SIGN_UP_PATH,
  type ExamGateLinks,
} from "../_components/exam-gate-links";

/**
 * 受験ゲートの導線を、ページの言語で張る先に解決する
 * 受験ゲートの導線解決
 *
 * 登録・道場の行き先がその言語で公開していればその言語の href、未公開なら
 * 日本語の href のまま `crossLocale`（ゲートは素の `<a hrefLang="ja">` と
 * 「日本語のみ」の印で描く）。登録は言語をまたいでも成立するので、未公開でも
 * 導線そのものは出す。判定は公開状態で、言語では分岐しない（登録を英語で
 * 公開すれば何も書き換えずに英語の登録を指す）。
 *
 * 登録ページは戻り先（`?redirect=`）を受け取らないので付けない。
 *
 * @param locale - ゲートを置くページの言語
 */
export function resolveExamGateLinks(locale: SupportedLocale): ExamGateLinks {
  return {
    signUp: resolveNavTargetFor(EXAM_GATE_SIGN_UP_PATH, locale),
    dojo: resolveNavTargetFor(DOJO_PATH, locale),
  };
}
