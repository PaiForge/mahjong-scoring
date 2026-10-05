import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/(user)/_components/section-title";
import { PracticeLinkButton } from "@/app/(user)/_components/practice-link-button";
import { NativeAdCard } from "@/app/(user)/(public)/_components/native-ad-card";
import { CatalogPracticeCard } from "@/app/(user)/(public)/practice/_components/catalog-practice-card";
import { getNativeAdCreative } from "@/lib/ads/creatives";
import {
  getChapterBySlug,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";
import { quizLessonBySlug } from "@mahjong-scoring/features/lessons/registry";

import { FREE_PRACTICE_LINKS } from "../_lib/free-practice-links";
import { ExamCtaCard } from "./exam-cta-card";
import { RelatedPracticeCardSlot } from "./related-practice-card-slot";

interface ChapterRelatedLinksProps {
  readonly slug: CurriculumChapterSlug;
}

/**
 * レッスンの本文の後に出す、練習・昇級試験への導線と広告
 * レッスン関連リンク
 *
 * Server Component。確認問題を持つレッスンでは完了画面の末尾（と完了済みの
 * 人が開いた本文の下）に、持たないレッスンでは完了ボタンの下に出す。
 * 「本文 → 確認問題 → 練習・試験」の順で、確認問題より前に押して始める
 * ボタンを置かない。上から次の順に並べる。
 *
 * - 関連する練習 — 確認問題は練習のチュートリアルにあたるので、終えた
 *   直後に同じ形の問題を解く練習へ送る。練習一覧と同じカードで、一覧で
 *   見る練習と同じものだと分かるようにする。送り先は確認問題を持つレッスン
 *   ならレジストリの `practiceLinks`（範囲が先へはみ出す練習も指す）、持たない
 *   レッスンなら章の `practiceLinks`。カードの並びの末尾に、練習一覧と
 *   同じカードの形のネイティブ広告（掲載中の広告があるときだけ）を置く。
 *   完了画面の次の一歩と同じ練習のカードは出さない（`RelatedPracticeCardSlot`）。
 *   カタログ外の練習（総合演習の絞り込み。`FREE_PRACTICE_LINKS`）はカードに
 *   できないので、並びの下にボタンで添える
 * - 昇級試験 — 試験を持つ章（CURRICULUM の `examSlug`）のみ。練習で腕試し →
 *   昇級試験、の順
 *
 * 練習も試験も無い章（基礎のセクション）では何も出さない。
 */
export async function ChapterRelatedLinks({ slug }: ChapterRelatedLinksProps) {
  const chapter = getChapterBySlug(slug);
  const practiceLinks =
    quizLessonBySlug(slug)?.practiceLinks ?? chapter?.practiceLinks ?? [];
  const freePractice = FREE_PRACTICE_LINKS[slug];
  const examSlug = chapter?.examSlug;
  const hasPractice = practiceLinks.length > 0 || freePractice !== undefined;
  if (!hasPractice && examSlug === undefined) return undefined;

  const [t, tAll, practiceAd] = await Promise.all([
    getTranslations("lessons.related"),
    getTranslations(),
    hasPractice ? getNativeAdCreative("lesson-practices-native-ad") : undefined,
  ]);

  return (
    <>
      {hasPractice && (
        <section className="space-y-4">
          <SectionTitle>{t("practiceTitle")}</SectionTitle>
          {practiceLinks.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {practiceLinks.map((link) => (
                <RelatedPracticeCardSlot
                  key={`${link.slug}:${link.variant ?? ""}`}
                  link={link}
                >
                  <CatalogPracticeCard
                    slug={link.slug}
                    variant={link.variant}
                  />
                </RelatedPracticeCardSlot>
              ))}
              {practiceAd && <NativeAdCard creative={practiceAd} />}
            </div>
          )}
          {freePractice && (
            <PracticeLinkButton
              href={freePractice.href}
              label={tAll(freePractice.labelKey)}
            />
          )}
        </section>
      )}

      {examSlug && <ExamCtaCard slug={examSlug} />}
    </>
  );
}
