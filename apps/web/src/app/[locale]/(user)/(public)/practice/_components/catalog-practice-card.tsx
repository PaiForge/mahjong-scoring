import { getTranslations } from "next-intl/server";

import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import { currentLocale } from "@/i18n/current-locale";

import {
  practiceMenuFromCatalog,
  relatedChaptersForPractice,
} from "@mahjong-scoring/features/practice/catalog";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";
import { chapterHref, practiceHref } from "@mahjong-scoring/features/routes";

import { practiceDisplayTitle } from "@mahjong-scoring/features/practice/practice-variant-label";
import { practiceCardRank } from "../_lib/practice-card-rank";
import { practiceCardVisual } from "@mahjong-scoring/features/practice/card-visual";
import { PracticeAttemptedMark } from "./attempted-practices";
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
 *
 * 下段の左の「挑戦済み」の印は、練習一覧（`AttemptedPracticesProvider` の中）に
 * 置いたときだけ出る。
 *
 * 行き先（説明・章・級）は今の言語で張る（`currentLocale()` + `resolveNavTargetFor`）。
 * 練習一覧を公開している言語では、練習の説明・レッスン・級の詳細も公開している。
 */
export async function CatalogPracticeCard({
  slug,
  variant,
}: CatalogPracticeCardProps) {
  const [t, tRanks, tAll, locale] = await Promise.all([
    getTranslations("practice"),
    getTranslations("ranks"),
    getTranslations(),
    currentLocale(),
  ]);
  const hrefFor = (path: string) => resolveNavTargetFor(path, locale).href;
  const firstChapter = relatedChaptersForPractice(slug)[0];
  const title = practiceDisplayTitle(tAll, slug, variant);
  const rank = practiceCardRank(practiceMenuFromCatalog(slug)?.rank, tRanks);

  return (
    <PracticeCard
      visual={practiceCardVisual(slug, t)}
      href={hrefFor(practiceHref(slug, variant))}
      title={title}
      rank={rank && { ...rank, href: hrefFor(rank.href) }}
      detailLabel={t("detail")}
      learnHref={firstChapter ? hrefFor(chapterHref(firstChapter)) : undefined}
      learnLabel={firstChapter ? t("learn") : undefined}
      footerStart={<PracticeAttemptedMark slug={slug} label={t("attempted")} />}
    />
  );
}
