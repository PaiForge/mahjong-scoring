import { getTranslations } from "next-intl/server";

import {
  practiceMenuFromCatalog,
  practiceTitleKey,
  relatedChaptersForPractice,
} from "@mahjong-scoring/features/practice/catalog";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";
import { chapterHref, practiceHref } from "@mahjong-scoring/features/routes";

import { practiceVariantLabel } from "@mahjong-scoring/features/practice/practice-variant-label";
import { practiceCardRank } from "../_lib/practice-card-rank";
import { practiceCardVisual } from "@mahjong-scoring/features/practice/card-visual";
import { PracticeCard } from "./practice-card";

interface CatalogPracticeCardProps {
  readonly slug: PracticeMenuSlug;
  /**
   * 送り先のバリアント。渡すと行き先に `?variant=` を載せ、練習名に
   * バリアント名を添える（「点数表早引き（子・満貫以上）」）
   */
  readonly variant?: string;
}

/**
 * カタログの練習 1 件を練習一覧と同じカードにする
 * カタログ練習カード
 *
 * Server Component。練習一覧と、一覧の外で練習を勧める画面（レッスンの
 * 完了画面）が同じカードを出すため、練習名・帯・段級位ピル・教本アイコンの
 * 組み立てをここに閉じる。
 *
 * カードの「教本を読む」は 1 本だけなので、関連章のうち最初にその練習を
 * 扱う章へ送る（複数の章が扱う練習は説明ページが全部出す）。
 */
export async function CatalogPracticeCard({
  slug,
  variant,
}: CatalogPracticeCardProps) {
  const [t, tRanks, tAll] = await Promise.all([
    getTranslations("practice"),
    getTranslations("ranks"),
    getTranslations(),
  ]);
  const firstChapter = relatedChaptersForPractice(slug)[0];
  const title = t(practiceTitleKey(slug));
  const variantLabel = practiceVariantLabel(tAll, slug, variant);

  return (
    <PracticeCard
      visual={practiceCardVisual(slug, t)}
      href={practiceHref(slug, variant)}
      title={variantLabel ? `${title}（${variantLabel}）` : title}
      rank={practiceCardRank(practiceMenuFromCatalog(slug)?.rank, tRanks)}
      detailLabel={t("detail")}
      learnHref={firstChapter ? chapterHref(firstChapter) : undefined}
      learnLabel={firstChapter ? t("learn") : undefined}
    />
  );
}
