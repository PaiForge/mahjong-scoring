import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PracticeCard } from "@/app/(user)/(public)/practice/_components/practice-card";
import { practiceCardRank } from "@/app/(user)/(public)/practice/_lib/practice-card-rank";
import { practiceCardVisual } from "@/app/(user)/(public)/practice/_lib/practice-card-visual";
import {
  practiceHref,
  practiceMenuFromCatalog,
  practiceTitleKey,
} from "@/app/(user)/(public)/practice/_lib/practice-catalog";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";

interface RecommendedPracticeSectionProps {
  /** 勧める練習のスラッグ（カリキュラム順） */
  readonly slugs: readonly PracticeMenuSlug[];
}

/**
 * ダッシュボードの「おすすめの練習」セクション。
 * おすすめの練習
 *
 * 読み終えた章に対応する練習のうち、まだ挑戦していないものを出す。カードは
 * 練習一覧と同じ `PracticeCard` を使う。ここに来るユーザーは章を読んだ直後
 * ではないので、カードから教本へ戻す導線（`learnHref`）は渡さない。
 *
 * 勧めるものが無いときは親がこのセクションを出さない。
 */
export async function RecommendedPracticeSection({
  slugs,
}: RecommendedPracticeSectionProps) {
  const [t, tPractice, tRanks] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("practice"),
    getTranslations("ranks"),
  ]);

  const menus = slugs
    .map((slug) => practiceMenuFromCatalog(slug))
    .filter((menu) => menu !== undefined);

  if (menus.length === 0) return undefined;

  return (
    <div className="space-y-4">
      <SectionTitle>{t("recommendedPracticeTitle")}</SectionTitle>

      <div
        className={
          menus.length === 1
            ? undefined
            : "grid grid-cols-1 gap-4 md:grid-cols-2"
        }
      >
        {menus.map((menu) => (
          <PracticeCard
            key={menu.slug}
            visual={practiceCardVisual(menu.slug, tPractice)}
            href={practiceHref(menu.slug)}
            title={tPractice(practiceTitleKey(menu.slug))}
            rank={practiceCardRank(menu.rank, tRanks)}
            detailLabel={tPractice("detail")}
          />
        ))}
      </div>

      <div className="text-right">
        <Link
          href="/practice"
          className={`text-sm font-medium ${TEXT_LINK_CLASSES}`}
        >
          {t("viewAllPractices")}
        </Link>
      </div>
    </div>
  );
}
