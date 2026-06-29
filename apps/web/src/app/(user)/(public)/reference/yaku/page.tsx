/**
 * 役一覧（チートシート）
 *
 * @description
 * 各役を翻数別に一覧表示するビジュアル早見表。役名・翻数は core の
 * YAKU_HAN_ENTRIES を単一ソースとする。翻数はセクション見出しで示し、
 * 食い下がり役のみカードに「鳴きN翻」を併記する。手牌の例は「例」リンクの
 * 開閉で表示し、出題盤面と同じ TehaiHand コンポーネントで描画する。
 * 立直・門前清自摸和は手牌の形を持たない状況役のため除外する。
 *
 * @flow
 * リファレンスハブ（/reference）の「役一覧」カードから遷移して閲覧する。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { YAKU_HAN_ENTRIES, YAKUMAN_HAN } from "@mahjong-scoring/core";
import type { YakuHanEntry } from "@mahjong-scoring/core";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { SectionTitle } from "@/app/_components/section-title";
import { createMetadata } from "@/app/_lib/metadata";
import { YAKU_EXAMPLES, YAKU_CHEATSHEET_EXCLUDED } from "./_lib/yaku-examples";
import type { YakuExample } from "./_lib/yaku-examples";
import { YakuExampleDisclosure } from "./_components/yaku-example-disclosure";

/** チートシートに表示する1役分の項目（役データと例示手牌を束ねる） */
interface YakuCheatItem {
  readonly entry: YakuHanEntry;
  readonly examples: readonly YakuExample[];
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reference.yaku");
  return createMetadata({ title: t("title"), description: t("description") });
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
        <p className="text-sm text-surface-500">{t("lead")}</p>

        {groups.map((group) => (
          <section key={group.han} className="space-y-3">
            <SectionTitle>{groupLabel(group.han)}</SectionTitle>
            <div className="space-y-2">
              {group.items.map(({ entry, examples }) => (
                <div
                  key={entry.name}
                  className="space-y-2 rounded-xl border border-surface-200 bg-white p-4"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-surface-900">
                      {entry.name}
                    </span>
                    {isKuisagari(entry) && entry.nakiHan !== undefined && (
                      <span className="shrink-0 text-sm text-surface-500">
                        {t("nakiHan", { count: entry.nakiHan })}
                      </span>
                    )}
                  </div>
                  <YakuExampleDisclosure examples={examples} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </ContentContainer>
  );
}
