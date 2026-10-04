import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/(user)/_components/section-title";
import { LinkRowList } from "@/app/(user)/_components/link-row";
import { NativeAdRow } from "@/app/(user)/_components/native-ad-row";
import { NativeAdCard } from "@/app/(user)/(public)/_components/native-ad-card";
import { CatalogPracticeCard } from "@/app/(user)/(public)/practice/_components/catalog-practice-card";
import { PracticeChapterSection } from "@/app/(user)/(public)/practice/_components/practice-chapter-section";
import { getNativeAdCreative } from "@/lib/ads/creatives";
import {
  lessonPracticeLinks,
  type LessonDefinition,
} from "@mahjong-scoring/features/lessons/registry";

interface LessonRelatedLinksProps {
  readonly lesson: LessonDefinition;
}

/**
 * レッスンの完了画面の末尾に出す、練習・教本への導線と広告
 * レッスン関連リンク
 *
 * Server Component。上から次の順に並べる。
 *
 * - 関連する練習 — 確認問題は練習のチュートリアルにあたるので、終えた
 *   直後に同じ形の問題を解く練習へ送る。練習一覧と同じカードで、一覧で
 *   見る練習と同じものだと分かるようにする。カードの並びの末尾に、練習一覧と
 *   同じカードの形のネイティブ広告（掲載中の広告があるときだけ）を置く。
 *   練習リンクを持たないレッスン（レジストリの `practiceLinks`）では節ごと
 *   出さない
 * - 関連する教本 — レッスンの章。練習の説明ページの「関連する教本の章」と
 *   同じ目次の書式。「目次へ」は目次の中のこの章の位置へ着地させる。
 *   末尾にネイティブ広告（掲載中の広告があるときだけ）を、教本の目次
 *   （`/learn`）と同じ行の形で置く。学習と練習の導線を見たあとで、それより
 *   前には出さない
 */
export async function LessonRelatedLinks({ lesson }: LessonRelatedLinksProps) {
  const links = lessonPracticeLinks(lesson);
  const [t, practiceAd, chapterAd] = await Promise.all([
    getTranslations("lessons.related"),
    getNativeAdCreative("lesson-practices-native-ad"),
    getNativeAdCreative("lesson-chapters-native-ad"),
  ]);

  return (
    <>
      {links.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>{t("practiceTitle")}</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            {links.map(({ slug, variant }) => (
              <CatalogPracticeCard
                key={`${slug}:${variant ?? ""}`}
                slug={slug}
                variant={variant}
              />
            ))}
            {practiceAd && <NativeAdCard creative={practiceAd} />}
          </div>
        </section>
      )}

      <div className="space-y-8">
        <PracticeChapterSection
          title={t("chapterTitle")}
          slugs={[lesson.chapterSlug]}
          tocFocusSlug={lesson.chapterSlug}
        />
        {chapterAd && (
          <LinkRowList>
            <NativeAdRow creative={chapterAd} />
          </LinkRowList>
        )}
      </div>
    </>
  );
}
