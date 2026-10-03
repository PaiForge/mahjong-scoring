import { getTranslations } from "next-intl/server";

import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { CURRICULUM } from "@mahjong-scoring/features/curriculum/registry";

/**
 * ダッシュボードの「教本」セクション（行程が進行中のときの補助リンク）
 * 教本リンク
 *
 * 黒帯への道が進行中のあいだ、教本は「次の一歩」と並ぶ別の再開先ではなく、
 * 目次への 1 行のリンクとしてだけ置く。級に属さない章（基礎のセクション・
 * 点数記憶術）へは目次から行ける。「次はここから」の章は示さない — 行程の章は
 * 「次の一歩」が順に案内し、ホームに「次」が 2 つ並ぶと今やることが決まらない。
 *
 * 読むためのリンクなので、押して始める面（太枠 + 影のカード）ではなく
 * `LinkRow` を使う。
 */
export async function TextbookLinkSection() {
  const t = await getTranslations("dashboard.textbook");

  return (
    <section className="space-y-4">
      <SectionTitle>{t("title")}</SectionTitle>
      <p className="text-sm leading-relaxed text-surface-500">{t("lead")}</p>
      <LinkRowList>
        <LinkRow
          href="/learn"
          title={t("tocTitle")}
          description={t("tocDescription", { count: CURRICULUM.length })}
        />
      </LinkRowList>
    </section>
  );
}
