/**
 * 役一覧（チートシート）
 *
 * @description
 * 各役の翻数（門前・食い下がり）と代表的な手牌の例を、翻数別に一覧表示する
 * ビジュアル早見表。役名・翻数は core の YAKU_HAN_ENTRIES を単一ソースとし、
 * 手牌の例は yaku-examples の MPSZ 記法から牌画像へ変換して表示する。
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
import { parseTiles } from "./_lib/parse-tiles";
import { YAKU_EXAMPLE_NOTATIONS } from "./_lib/yaku-examples";
import { YakuExampleHand } from "./_components/yaku-example-hand";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reference.yaku");
  return createMetadata({ title: t("title"), description: t("description") });
}

/** YAKU_HAN_ENTRIES を門前翻数ごとにグループ化する（出現順を保持） */
function groupByMenzenHan(): readonly {
  readonly han: number;
  readonly entries: readonly YakuHanEntry[];
}[] {
  const order: number[] = [];
  const map = new Map<number, YakuHanEntry[]>();
  for (const entry of YAKU_HAN_ENTRIES) {
    let arr = map.get(entry.menzenHan);
    if (arr === undefined) {
      arr = [];
      map.set(entry.menzenHan, arr);
      order.push(entry.menzenHan);
    }
    arr.push(entry);
  }
  return order.map((han) => ({ han, entries: map.get(han) ?? [] }));
}

export default async function ReferenceYakuPage() {
  const t = await getTranslations("reference.yaku");
  const tHub = await getTranslations("reference");

  const groups = groupByMenzenHan();

  const groupLabel = (han: number) =>
    han === YAKUMAN_HAN ? t("yakuman") : t("hanUnit", { count: han });

  const hanLabel = (entry: YakuHanEntry) => {
    if (entry.menzenHan === YAKUMAN_HAN) return t("yakuman");
    if (entry.nakiHan !== undefined && entry.nakiHan !== entry.menzenHan) {
      return t("menzenNaki", { menzen: entry.menzenHan, naki: entry.nakiHan });
    }
    return t("hanUnit", { count: entry.menzenHan });
  };

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
              {group.entries.map((entry) => {
                const notation = YAKU_EXAMPLE_NOTATIONS[entry.name];
                return (
                  <div
                    key={entry.name}
                    className="space-y-2 rounded-xl border border-surface-200 bg-white p-4"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold text-surface-900">
                        {entry.name}
                      </span>
                      <span className="shrink-0 text-sm text-surface-500">
                        {hanLabel(entry)}
                      </span>
                    </div>
                    {notation !== undefined && (
                      <YakuExampleHand tiles={parseTiles(notation)} />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </ContentContainer>
  );
}
