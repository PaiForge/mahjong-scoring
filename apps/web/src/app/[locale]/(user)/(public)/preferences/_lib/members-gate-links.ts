import "server-only";

import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import { localizedHref } from "@/i18n/public-path";
import { buildSignInHref } from "@/lib/redirect";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

import type { MembersGateLinks } from "../_components/members-only-gate";

/** 会員登録のページ（ロケール非依存のパス） */
const SIGN_UP_PATH = "/sign-up";

/**
 * 会員限定ゲートの導線（会員登録・ログイン）をページの言語で組む
 * 会員限定ゲートの張る先
 *
 * 張る先は公開状態の表から引く（`resolveNavTargetFor`）。会員登録・ログインは
 * 設定のページを出している言語では出しているので、同じ言語の href になる。
 * ログインの戻り先（`?redirect=`）もこのページの言語の URL にし、ログイン後に
 * 言語が切り替わらないようにする。日本語ではどちらも従来の href のまま
 * （`/sign-up`・`/sign-in?redirect=%2Fpreferences`）。
 *
 * @param returnPath - ログイン後に戻すページのロケール非依存のパス
 * @param locale - ページの言語
 */
export function membersGateLinks(
  returnPath: string,
  locale: SupportedLocale,
): MembersGateLinks {
  return {
    signUpHref: resolveNavTargetFor(SIGN_UP_PATH, locale).href,
    signInHref: resolveNavTargetFor(
      buildSignInHref(localizedHref(returnPath, locale)),
      locale,
    ).href,
  };
}
