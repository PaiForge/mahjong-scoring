import { YAKU_HAN_ENTRIES } from "@mahjong-scoring/core";
import type { YakuHanEntry } from "@mahjong-scoring/core";

/**
 * 鳴いたときの翻数の変わり方の区分
 * 鳴き区分
 *
 * - `menzenOnly`: 門前限定（鳴くと成立しない）
 * - `kuisagari`: 食い下がり（鳴くと 1 翻下がる）
 * - `unchanged`: 鳴いても翻数が変わらない
 *
 * 辞書キー `yaku.learn.nakiKinds.<区分>` と同じ文字列を使う。
 */
export const NakiKind = {
  MenzenOnly: "menzenOnly",
  Kuisagari: "kuisagari",
  Unchanged: "unchanged",
} as const;
export type NakiKind = (typeof NakiKind)[keyof typeof NakiKind];

/** 門前と鳴きの比較表の 1 区分 */
export interface NakiComparisonGroup {
  readonly kind: NakiKind;
  readonly entries: readonly YakuHanEntry[];
}

/**
 * 比較表に載せる役（区分ごと、表の並び順）
 *
 * レッスン「役と翻数の数え方」の節「門前と鳴き」が本文で例に挙げた役だけに
 * 絞る。全役（30 余り）を並べると表が長くなり、本文の 3 区分を確かめる
 * という表の役目が埋もれるため。残りの役は役一覧（`/reference/yaku`）に
 * 任せる — 役一覧は役ごとに「門前限定」「鳴き◯翻」のラベルを持つので、
 * この表と同じ見方で読める。本文の例を差し替えたらここも揃える。
 */
const NAKI_COMPARISON_YAKU_NAMES: Readonly<
  Record<NakiKind, readonly string[]>
> = {
  menzenOnly: ["立直", "平和", "一盃口", "七対子"],
  kuisagari: ["三色同順", "一気通貫", "混一色", "清一色"],
  unchanged: ["断么九", "対々和"],
};

/** 表に出す区分の順（本文が説明する順） */
const NAKI_KIND_ORDER: readonly NakiKind[] = [
  NakiKind.MenzenOnly,
  NakiKind.Kuisagari,
  NakiKind.Unchanged,
];

/**
 * 門前と鳴きの翻数の比較表の中身を組み立てる
 * 門前鳴き比較表
 *
 * 翻数は core の `YAKU_HAN_ENTRIES` から引き、ここでは役名と区分しか持たない
 * （役一覧・出題と翻数が食い違わないようにするため）。
 */
export function buildNakiComparisonGroups(): readonly NakiComparisonGroup[] {
  return NAKI_KIND_ORDER.map((kind) => ({
    kind,
    entries: NAKI_COMPARISON_YAKU_NAMES[kind].flatMap((name) =>
      YAKU_HAN_ENTRIES.filter((entry) => entry.name === name),
    ),
  }));
}
