import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

import { HeroSection } from "./hero-section";
import { PracticeSection } from "./practice-section";
import { ReferenceSection } from "./reference-section";
import { LearnSection } from "./learn-section";

/**
 * トップページ（LP）の本文
 *
 * 言語は `params` から確定した値を props で受ける（`headers()` / `cookies()` を
 * 読まず静的生成を保つため）。各節の CTA はこの言語で張る先を決める。
 *
 * @param locale - ページの言語
 */
export function LandingPage({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <>
      <HeroSection locale={locale} />
      <PracticeSection locale={locale} />
      <ReferenceSection locale={locale} />
      <LearnSection locale={locale} />
    </>
  );
}
