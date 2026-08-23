/**
 * 役一覧（チートシート）
 *
 * @description
 * 各役を翻数別に一覧表示するビジュアル早見表。役名・翻数は core の
 * YAKU_HAN_ENTRIES を単一ソースとする。翻数はセクション見出しで示し、
 * 食い下がり役のみカードに「鳴きN翻」を併記する。手牌の例は練習結果の問題一覧と
 * 同じ AccordionCard の開閉で表示し、出題盤面と同じ TehaiHand コンポーネントで描画する。
 * 立直・門前清自摸和は手牌の形を持たない状況役のため除外する。
 *
 * @flow
 * リファレンスハブ（/reference）の「役一覧」カードから遷移して閲覧する。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { YAKU_HAN_ENTRIES, YAKUMAN_HAN } from "@mahjong-scoring/core";
import type { YakuHanEntry } from "@mahjong-scoring/core";
import { AccordionCard } from "@/app/(user)/_components/accordion-card";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { YAKU_EXAMPLES, YAKU_CHEATSHEET_EXCLUDED } from "./_lib/yaku-examples";
import type { YakuExample } from "./_lib/yaku-examples";
import { YakuExampleList } from "./_components/yaku-example-list";

/** チートシートに表示する1役分の項目（役データと例示手牌を束ねる） */
interface YakuCheatItem {
  readonly entry: YakuHanEntry;
  readonly examples: readonly YakuExample[];
}

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("reference.yaku");
}

/** チートシートに載せる役（除外役・例未定義を除く）を門前翻数ごとにグループ化する */
function groupByMenzenHan(): readonly {
  readonly han: number;
  readonly items: readonly YakuCheatItem[];
}[] {
  const order: number[] = [];
  const map = new Map<number, YakuCheatItem[]>();
  for (const entry of YAKU_HAN_ENTRIES) {
    if (YAKU_CHEATSHEET_EXCLUDED.has(entry.name)) continue;
    const examples = YAKU_EXAMPLES[entry.name];
    if (examples === undefined) continue;
    let arr = map.get(entry.menzenHan);
    if (arr === undefined) {
      arr = [];
      map.set(entry.menzenHan, arr);
      order.push(entry.menzenHan);
    }
    arr.push({ entry, examples });
  }
  return order.map((han) => ({ han, items: map.get(han) ?? [] }));
}

/** 食い下がり役（門前と鳴きで翻数が変わる）かどうか */
function isKuisagari(entry: YakuHanEntry): boolean {
  return entry.nakiHan !== undefined && entry.nakiHan !== entry.menzenHan;
}

export default async function ReferenceYakuPage() {
  const t = await getTranslations("reference.yaku");
  const tHub = await getTranslations("reference");

  const groups = groupByMenzenHan();

  const groupLabel = (han: number) =>
    han === YAKUMAN_HAN ? t("yakuman") : t("hanUnit", { count: han });

  return (
    <ContentContainer
      breadcrumb={[
        { label: tHub("title"), href: "/reference" },
        { label: t("title") },
      ]}
    >
      <PageTitle>{t("title")}</PageTitle>

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.han} className="space-y-3">
            <SectionTitle>{groupLabel(group.han)}</SectionTitle>
            <div className="space-y-2">
              {group.items.map(({ entry, examples }) => (
                <AccordionCard
                  key={entry.name}
                  title={
                    <span className="font-semibold text-surface-900">
                      {entry.name}
                    </span>
                  }
                  trailing={
                    isKuisagari(entry) && entry.nakiHan !== undefined ? (
                      <span className="text-sm text-surface-500">
                        {t("nakiHan", { count: entry.nakiHan })}
                      </span>
                    ) : undefined
                  }
                >
                  <YakuExampleList examples={examples} />
                </AccordionCard>
              ))}
            </div>
          </section>
        ))}
      </div>
    </ContentContainer>
  );
}
