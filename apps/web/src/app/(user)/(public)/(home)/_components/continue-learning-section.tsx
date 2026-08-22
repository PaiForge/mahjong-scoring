import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { CurriculumProgressBar } from "@/app/(user)/(public)/learn/_components/curriculum-progress-bar";
import { CurriculumToc } from "@/app/(user)/(public)/learn/_components/curriculum-toc";
import {
  CURRICULUM,
  pickNextChapter,
} from "@/app/(user)/(public)/learn/_lib/curriculum";
import { fetchReadChapterSlugs } from "@/app/(user)/(public)/learn/_lib/progress";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

/**
 * ダッシュボードの「学習の続き」セクション。
 * 学習の続き
 *
 * 進捗バーと「次はここから」の章 1 件を `/learn` と同じ見た目で表示し、
 * 再訪ユーザーが読みかけの位置へ 1 クリックで戻れるようにする。
 * 目次全体は `/learn` の役目なので、ここでは次の 1 章だけに絞る。
 *
 * @remarks
 * サーバーコンポーネント。読了状態は `fetchReadChapterSlugs()`（`cache()` 済みの
 * `getOptionalUser()` 経由）で取るため、同一リクエスト内で他の呼び出しと重複しない。
 */
export async function ContinueLearningSection() {
  const [t, tLearn, readSlugs] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("learnCurriculum.index"),
    fetchReadChapterSlugs(),
  ]);

  const next = pickNextChapter(readSlugs);
  const allCompleted = !next;

  return (
    <div className="space-y-4">
      <SectionTitle>{t("continueLearningTitle")}</SectionTitle>

      <CurriculumProgressBar
        readCount={readSlugs.size}
        totalCount={CURRICULUM.length}
        allCompleted={allCompleted}
      />

      {next ? (
        <CurriculumToc
          section={next.section}
          chapters={[next]}
          readSlugs={readSlugs}
          nextSlug={next.slug}
        />
      ) : (
        <p className="text-center text-sm text-surface-600">
          {tLearn("allCompletedMessage")}
        </p>
      )}

      <div className="text-right">
        <Link
          href="/learn"
          className={`text-sm font-medium ${TEXT_LINK_CLASSES}`}
        >
          {t("viewAllChapters")}
        </Link>
      </div>
    </div>
  );
}
