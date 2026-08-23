/**
 * 役一覧（チートシート）
 *
 * @description
 * 各役を翻数別に一覧表示するビジュアル早見表。役名・翻数は core の
 * YAKU_HAN_ENTRIES を単一ソースとする。翻数はセクション見出しで示し、
 * 鳴きの扱いはカード右端に併記する（門前限定役は「門前限定」バッジ、
 * 食い下がり役は「鳴きN翻」。無表示は鳴いても翻数が変わらない役）。手牌の例は練習結果の問題一覧と
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

/** 門前限定役（鳴くと成立しない）かどうか */
function isMenzenOnly(entry: YakuHanEntry): boolean {
  return entry.nakiHan === undefined;
}

export default async function ReferenceYakuPage() {
  const t = await getTranslations("reference.yaku");
  const tHub = await getTranslations("reference");

  const groups = groupByMenzenHan();

  const groupLabel = (han: number) =>
    han === YAKUMAN_HAN ? t("yakuman") : t("hanUnit", { count: han });

  /**
   * カード右端の鳴きラベル。
   * 門前限定と食い下がりで意味が違うため、前者は成立可否の制約としてバッジで
   * 強調し、後者は翻数の補足として控えめな文字で出す。鳴いても翻数が変わらない
   * 役は無表示（凡例で補う）。
   */
  const nakiLabel = (entry: YakuHanEntry) => {
    if (isMenzenOnly(entry)) {
      return (
        <span className="rounded-full border-2 border-ink bg-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-900">
          {t("menzenOnly")}
        </span>
      );
    }
    if (isKuisagari(entry) && entry.nakiHan !== undefined) {
      return (
        <span className="text-sm text-surface-500">
          {t("nakiHan", { count: entry.nakiHan })}
        </span>
      );
    }
    return undefined;
  };

  return (
    <ContentContainer
      breadcrumb={[
        { label: tHub("title"), href: "/reference" },
        { label: t("title") },
      ]}
    >
      <PageTitle>{t("title")}</PageTitle>

      <p className="mb-6 text-sm text-surface-500">{t("nakiNote")}</p>

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
                  trailing={nakiLabel(entry)}
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
