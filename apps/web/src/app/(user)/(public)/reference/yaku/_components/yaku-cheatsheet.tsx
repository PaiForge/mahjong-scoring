"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  YAKU_HAN_ENTRIES,
  groupYakuHanEntriesByMenzenHan,
  isKuisagariEntry,
} from "@mahjong-scoring/core";
import type { YakuHanEntry } from "@mahjong-scoring/core";
import { yakuHanLabel } from "@mahjong-scoring/features/yaku/yaku-han-label";
import { AccordionCard } from "@/app/(user)/_components/accordion-card";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import {
  YAKU_EXAMPLES,
  hasYakuCheatsheetEntry,
} from "@mahjong-scoring/features/yaku/examples";
import type { YakuExampleSet } from "@mahjong-scoring/features/yaku/examples";
import { YakuExampleList } from "./yaku-example-list";
import { yakuAnchorId } from "@mahjong-scoring/features/yaku/anchors";
import { adIndexAfterGroup } from "@/lib/ads/spacing";

/** チートシートに表示する1役分の項目（役データと例示手牌を束ねる） */
interface YakuCheatItem {
  readonly entry: YakuHanEntry;
  readonly examples: readonly YakuExampleSet[];
}

/** チートシートに載せる役（除外役・例未定義を除く）を門前翻数ごとにグループ化する */
function groupByMenzenHan(): readonly {
  readonly han: number;
  readonly items: readonly YakuCheatItem[];
}[] {
  const groups = groupYakuHanEntriesByMenzenHan(
    YAKU_HAN_ENTRIES.filter((entry) => hasYakuCheatsheetEntry(entry.name)),
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
}

/**
 * 役の早見表（翻数別の一覧）
 * 役チートシート
 *
 * 役名・翻数は core の `YAKU_HAN_ENTRIES` を単一ソースとする。翻数はセクション
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
}: YakuCheatsheetProps) {
  const t = useTranslations("reference.yaku");

  const groups = groupByMenzenHan();

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
                        {entry.name}
                      </span>
                      {markedYakuNames?.includes(entry.name) && (
                        <span className="rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-800">
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
