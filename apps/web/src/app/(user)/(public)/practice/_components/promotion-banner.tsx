import { getTranslations } from "next-intl/server";

import { BeltBadge } from "@/app/(user)/_components/belt-badge";
import { getOptionalUser } from "@/lib/auth";
import { getUserRankSlugs } from "@/lib/db/rank-queries";
import { beltBorderClass, beltTintClasses } from "@/lib/ranks/belt-colors";
import { highestRank, rankTier, type RankSlug } from "@/lib/ranks/registry";

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
  // 授与された段級位。複数同時に付与されうるため最上位の色で出す
  const awarded = highestRank(verified)?.slug;

  return (
    /* 枠も面も帯色。既定の ink（緑）と bg-primary-50 で祝うと、緑が授与
       された級の色に見えてしまう（5級はオレンジ）。見出しの色は section の
       文字色を継いで帯色の濃い側になる。 */
    <section
      aria-live="polite"
      data-belt-slug={awarded ?? "unranked"}
      className={`rounded-xl border-3 p-5 text-center ${beltBorderClass(awarded)} ${beltTintClasses(awarded)}`}
    >
      <BeltBadge slug={awarded} />
      {/* 見出しは最上位の段級位の種別で出す（級と段が同時に付いたときは
          上の段の言い方に寄せる）。行ごとの文はそれぞれの種別で出す */}
      <h2 className="mt-3 text-lg font-bold">
        {t(`promotion.title.${rankTier(awarded ?? verified[0])}`)}
      </h2>
      <div className="mt-1 space-y-0.5">
        {verified.map((slug) => (
          <p key={slug} className="font-medium text-surface-700">
            {t(`promotion.message.${rankTier(slug)}`, {
              rank: t(`names.${slug}`),
            })}
          </p>
        ))}
      </div>
    </section>
  );
}
