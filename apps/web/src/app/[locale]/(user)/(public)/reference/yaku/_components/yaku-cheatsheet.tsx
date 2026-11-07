"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  YAKU_HAN_ENTRIES,
  groupYakuHanEntriesByMenzenHan,
  isKuisagariEntry,
} from "@mahjong-scoring/core";
import type { YakuHanEntry } from "@mahjong-scoring/core";
import { yakuHanLabel } from "@mahjong-scoring/features/yaku/yaku-han-label";
import { YAKU_TO_KEY } from "@mahjong-scoring/features/yaku/yaku-labels";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";
import { AccordionCard } from "@/app/[locale]/(user)/_components/accordion-card";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { ToggleGroup } from "@/app/[locale]/(user)/_components/toggle-group";
import {
  YAKU_EXAMPLES,
  hasYakuCheatsheetEntry,
} from "@mahjong-scoring/features/yaku/examples";
import type { YakuExampleSet } from "@mahjong-scoring/features/yaku/examples";
import { YakuExampleList } from "./yaku-example-list";
import { yakuAnchorId } from "@mahjong-scoring/features/yaku/anchors";
import { adIndexAfterGroup } from "@mahjong-scoring/features/ads/spacing";
import {
  ALL_NAKI_KINDS,
  NAKI_FILTER_OPTIONS,
  matchesNakiFilter,
  type NakiFilter,
} from "@mahjong-scoring/features/yaku/naki-kind";

/** チートシートに表示する1役分の項目（役データと例示手牌を束ねる） */
interface YakuCheatItem {
  readonly entry: YakuHanEntry;
  readonly examples: readonly YakuExampleSet[];
}

/**
 * チートシートに載せる役（除外役・例未定義を除く）を門前翻数ごとにグループ化する
 *
 * 絞り込みに当てはまる役が 1 つも無い翻数は、まとまりごと出さない。
 */
function groupByMenzenHan(filter: NakiFilter): readonly {
  readonly han: number;
  readonly items: readonly YakuCheatItem[];
}[] {
  const groups = groupYakuHanEntriesByMenzenHan(
    YAKU_HAN_ENTRIES.filter(
      (entry) =>
        hasYakuCheatsheetEntry(entry.name) && matchesNakiFilter(filter, entry),
    ),
  );
  return groups.map(({ han, entries }) => ({
    han,
    items: entries.map((entry) => ({
      entry,
      examples: YAKU_EXAMPLES[entry.name],
    })),
  }));
}

/** 門前限定役（鳴くと成立しない）かどうか */
function isMenzenOnly(entry: YakuHanEntry): boolean {
  return entry.nakiHan === undefined;
}

interface YakuCheatsheetProps {
  /**
   * アンカー id を振るかどうか
   *
   * 役一覧ページでは教本からの直リンク（`/reference/yaku#yaku-混一色`）に
   * 応答させるため付ける。モーダルで開くときは URL のハッシュと無関係に
   * 表示するので付けない。
   */
  readonly withAnchors?: boolean;
  /**
   * 「今見ている手で成立している役」として目印を付ける役名
   *
   * 答え合わせからモーダルで開いたときに、正解だった役へ視線を誘導する。
   */
  readonly markedYakuNames?: readonly string[];
  /**
   * 表示直後に開いて、そこまでスクロールする役名
   *
   * 答え合わせで役をタップして開いたときに、その役へ直接着地させる。
   */
  readonly focusedYakuName?: string;
  /**
   * 翻数のまとまりの末尾に混ぜる広告（並び順どおり。描画済みの要素）
   *
   * 何番目のまとまりの後に置くかは `adIndexAfterGroup` が決める。広告は
   * サーバーで引くため、役一覧ページが描画した要素を渡す。モーダルでは渡さない
   */
  readonly ads?: readonly ReactNode[];
  /**
   * 鳴いたときの扱い（門前限定・食い下がり・鳴いても同じ）で絞り込む
   * 切り替えを一覧の上に出すかどうか
   *
   * 役一覧ページでだけ出す。答え合わせのモーダルは正解だった役へ直接
   * 着地させる用途で、絞ると着地先の役が隠れうるため出さない。
   */
  readonly withNakiFilter?: boolean;
  /**
   * 一覧を置くページの言語（省略時は日本語）
   *
   * 日本語では core の役名（`YAKU_HAN_ENTRIES.name`）をそのまま描き、それ以外の
   * 言語では辞書 `yakuNames` から引く。日本語でも辞書を引かないのは、辞書の
   * 日本語の値が core の役名と同じ文字列（`yaku-names.test.ts` が固定）で表示が
   * 変わらない一方、翻訳キーを返す intl のスタブで描くテスト（点数訓練の答え
   * 合わせのモーダル）が役名の文字列を手掛かりにしているため。モーダルは
   * 日本語でしか出さない練習の中にあるので省略してよい。
   */
  readonly locale?: SupportedLocale;
}

/**
 * 役の早見表（翻数別の一覧）
 * 役チートシート
 *
 * 役・翻数は core の `YAKU_HAN_ENTRIES` を単一ソースとする。英語の役名は
 * 辞書 `yakuNames.<YAKU_TO_KEY[役名]>` から引く（ローマ字の慣用名。日本語は
 * core の役名のまま。理由は `locale` の TSDoc）。
 * 絞り込み・目印・アンカー id（`yaku-混一色`）は core の役名のまま。翻数はセクション
 * 見出しで示し、鳴きの扱いはカード右端に併記する（門前限定役は「門前限定」
 * バッジ、食い下がり役は「鳴きN翻」。無表示は鳴いても翻数が変わらない役）。
 * 手牌の例はカードを開くと出題盤面と同じ `TehaiHand` で表示する（鳴いて
 * 成立する役は門前形と副露形の両方、役牌は三元牌それぞれの対）。
 * 立直・門前清自摸和は手牌の形を持たない状況役のため除外する。
 *
 * 役一覧ページと、点数訓練の答え合わせから開くモーダルで共有する。
 */
export function YakuCheatsheet({
  withAnchors = false,
  markedYakuNames,
  focusedYakuName,
  ads = [],
  withNakiFilter = false,
  locale = DEFAULT_LOCALE,
}: YakuCheatsheetProps) {
  const t = useTranslations("reference.yaku");
  const tYakuNames = useTranslations("yakuNames");
  // 絞り込みは URL に載せない。クエリを読むと静的なページが動的になるうえ、
  // 共有して開き直したい状態でもないため
  const [nakiFilter, setNakiFilter] = useState<NakiFilter>(ALL_NAKI_KINDS);

  const groups = groupByMenzenHan(nakiFilter);

  const groupLabel = (han: number) => yakuHanLabel(han, t);

  /**
   * カード右端の鳴きラベル。
   * 門前限定と食い下がりで意味が違うため、前者は成立可否の制約としてバッジで
   * 強調し、後者は翻数の補足として控えめな文字で出す。鳴いても翻数が変わらない
   * 役は無表示（凡例で補う）。
   */
  const nakiLabel = (entry: YakuHanEntry) => {
    if (isMenzenOnly(entry)) {
      return (
        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
          {t("menzenOnly")}
        </span>
      );
    }
    if (isKuisagariEntry(entry) && entry.nakiHan !== undefined) {
      return (
        <span className="text-sm text-surface-500">
          {t("nakiHan", { count: entry.nakiHan })}
        </span>
      );
    }
    return undefined;
  };

  return (
    <div className="space-y-8">
      {withNakiFilter && (
        <div role="group" aria-label={t("nakiFilterLabel")} className="flex">
          <ToggleGroup
            options={NAKI_FILTER_OPTIONS.map((value) => ({
              value,
              label: t(`nakiFilters.${value}`),
            }))}
            selected={nakiFilter}
            onChange={setNakiFilter}
          />
        </div>
      )}
      {groups.map((group, groupIndex) => {
        const adIndex = adIndexAfterGroup(groupIndex);
        const ad = adIndex === undefined ? undefined : ads[adIndex];
        return (
          <section key={group.han} className="space-y-3">
            <SectionTitle>{groupLabel(group.han)}</SectionTitle>
            <div className="space-y-2">
              {group.items.map(({ entry, examples }) => (
                <AccordionCard
                  key={entry.name}
                  anchorId={withAnchors ? yakuAnchorId(entry.name) : undefined}
                  autoOpen={entry.name === focusedYakuName}
                  title={
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="font-semibold text-surface-900">
                        {locale === DEFAULT_LOCALE
                          ? entry.name
                          : // 完成形のキーの例: yakuNames.honitsu（core の「混一色」）
                            tYakuNames(YAKU_TO_KEY[entry.name])}
                      </span>
                      {markedYakuNames?.includes(entry.name) && (
                        <span className="rounded-md bg-brand-subtle px-2 py-0.5 text-[11px] font-bold text-brand-subtle-foreground">
                          {t("inThisHand")}
                        </span>
                      )}
                    </span>
                  }
                  trailing={nakiLabel(entry)}
                >
                  <YakuExampleList examples={examples} />
                </AccordionCard>
              ))}
              {ad}
            </div>
          </section>
        );
      })}
    </div>
  );
}
