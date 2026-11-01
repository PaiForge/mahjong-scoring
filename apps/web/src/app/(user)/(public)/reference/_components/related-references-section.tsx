import { getTranslations } from "next-intl/server";
import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import {
  relatedReferences,
  type ReferenceKey,
} from "@mahjong-scoring/features/reference/related-references";

/** web の点数表のパス（アプリはタブの `/score-table`） */
const SCORE_TABLE_PATH = "/reference/score-table";

/**
 * 早見表の下に置く「ほかの早見表」の行（自分を除く）
 * 関連早見表セクション
 *
 * @param current - このセクションを置く早見表
 */
export async function RelatedReferencesSection({
  current,
}: {
  readonly current: ReferenceKey;
}) {
  const t = await getTranslations("reference");
  return (
    <section className="space-y-4">
      <SectionTitle>{t("relatedTitle")}</SectionTitle>
      <LinkRowList>
        {relatedReferences(current, SCORE_TABLE_PATH).map(({ key, href }) => (
          <LinkRow
            key={key}
            href={href}
            title={t(`${key}.title`)}
            description={t(`${key}.description`)}
          />
        ))}
      </LinkRowList>
    </section>
  );
}
