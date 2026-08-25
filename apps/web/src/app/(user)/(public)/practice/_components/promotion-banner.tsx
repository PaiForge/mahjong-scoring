import { getTranslations } from "next-intl/server";

import { getOptionalUser } from "@/lib/auth";
import { getUserRankSlugs } from "@/lib/db/rank-queries";
import type { RankSlug } from "@/lib/ranks/registry";

interface PromotionBannerProps {
  /** URL クエリ由来の昇級候補スラッグ（表示前に user_ranks と突き合わせる） */
  readonly slugs: readonly RankSlug[];
}

/**
 * 結果ページの昇級バナー
 * 昇級バナー
 *
 * Server Component。URL クエリの `promoted` は改竄できるため鵜呑みにせず、
 * 本人の `user_ranks` に実在するランクだけを表示する（改竄しても本人が
 * 保持していないランクのバナーは出ない）。
 */
export async function PromotionBanner({ slugs }: PromotionBannerProps) {
  if (slugs.length === 0) return undefined;

  const user = await getOptionalUser();
  if (!user) return undefined;

  const owned = new Set(await getUserRankSlugs(user.id));
  const verified = slugs.filter((slug) => owned.has(slug));
  if (verified.length === 0) return undefined;

  const t = await getTranslations("ranks");

  return (
    <section
      aria-live="polite"
      className="rounded-xl border-3 border-ink bg-primary-50 p-5 text-center"
    >
      <p className="text-3xl" aria-hidden="true">
        🎓
      </p>
      <h2 className="mt-2 text-lg font-bold text-primary-800">
        {t("promotion.title")}
      </h2>
      <div className="mt-1 space-y-0.5">
        {verified.map((slug) => (
          <p key={slug} className="font-medium text-surface-700">
            {t("promotion.message", { rank: t(`names.${slug}`) })}
          </p>
        ))}
      </div>
    </section>
  );
}
