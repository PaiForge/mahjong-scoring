/**
 * 保存問題の分類（カテゴリー）— 属性に対する条件のレジストリ
 * 問題分類レジストリ
 *
 * @description
 * 保存問題を「役・符・待ち・和了の仕方・点数の区分」で分ける分類を、属性の行
 * （`compute.ts` の `ProblemFacets`）に対する構造化した条件として定義する。同じ条件から
 * 2 つを導く: 組み立てた属性に対する判定（{@link problemMatchesCategory}）と、DB の属性の
 * 表に対する SQL の絞り込み（web の `lib/practice-problems/facet-condition-sql.ts`）。
 * 条件を関数（`(row) => boolean`）で持たないのは、SQL を導けなくなるため。
 *
 * @design 分類そのものは DB に持たず、コードのレジストリに置く
 * 問題に「どの分類に入るか」を書き込むと、分類を足す・条件を直すたびに全行の書き換えが
 * 要る。DB が持つのは分類に依らない属性（翻・符・役・待ち）だけにし、分類は読むときに
 * 条件として当てる。分類を足しても属性の版（`SCORING_VERSION`）は変わらない。
 *
 * @design 分類は練習のバリアントではない
 * 分類は管理・統計・候補の絞り込みに使う内部の条件で、記録の土俵（`leaderboard_key`）にも
 * 練習の出題範囲にもならない。練習に出すときは、少数の分類に名前を付けて練習のレジストリの
 * `variants` に列挙する（自由な組み合わせの絞り込みは作らない）。ID は URL のクエリと
 * 辞書キー（`admin.problemCategories.categories.<id>`）に同じ文字列で使う。
 *
 * @design 分類は標準ルールの値で行う
 * 属性は標準ルールの値なので、連風牌 4 符・切り上げ満貫・役満ルールを有効にした閲覧者には
 * 別の分類になる問題がある。その問題は属性の行の印（`variesBy*`）で分かる。管理画面は
 * 標準ルールの値で分類し、印の立つ問題を「ルールで変わる」と表示する。
 *
 * @design 聴牌形に当てるときの意味を分類ごとに明示する（`tenpaiMatch`）
 * 聴牌形は待ち × ツモ/ロンの和了を複数持つ。`any`（既定）は「どれかの和了が条件を満たす」、
 * `all` は「すべての和了が条件を満たす」。和了形は和了が 1 つなのでどちらでも同じ。
 * 役が無くロンできない和了（`noYaku`）はどの条件も満たさない — `all` の分類は、役なしの
 * ロンを持つ聴牌形を含まない。条件は 1 つの和了の中でだけ組にする（「三暗刻」と「50 符」を
 * 別々の和了が満たしても、「三暗刻で 50 符」の分類には入らない）。
 */
import type { MachiType, ScoreYakuId } from "@mahjong-scoring/core";

import type { ProblemFacetRow, ProblemFacets } from "./compute";

/** 点数の区分（ライブラリの `ScoreLevel` の値。属性の `scoreLevel` に入る文字列） */
export const SCORE_LEVELS = [
  "Normal",
  "Mangan",
  "Haneman",
  "Baiman",
  "Sanbaiman",
  "Yakuman",
  "DoubleYakuman",
] as const;

/**
 * 点数の区分
 * 点数区分
 */
export type ScoreLevelName = (typeof SCORE_LEVELS)[number];

/**
 * 和了 1 つに対する条件（指定した項目をすべて満たす = AND）
 * 属性条件
 *
 * 持たせる項目は、SQL の絞り込みと属性に対する判定の両方を書けるものに限る。項目を足したら
 * {@link facetRowMatches} と web の `facetConditionSql` の両方に足す（片方だけだと、管理画面の
 * 件数と、組み立て直した問題に対する判定が食い違う。統合テストが全項目で突き合わせる）。
 */
export interface FacetCondition {
  /** 役にこれらをすべて含む */
  readonly yakuAll?: readonly ScoreYakuId[];
  /** 役にこれらのどれかを含む */
  readonly yakuAny?: readonly ScoreYakuId[];
  /** 符がこの値 */
  readonly fuEq?: number;
  /** 符がこの値以上 */
  readonly fuMin?: number;
  /** 採用された解釈の待ちの形がこのどれか（七対子・国士無双は待ちの形を持たず、満たさない） */
  readonly machiIn?: readonly MachiType[];
  /** ツモ和了か（false はロン） */
  readonly isTsumo?: boolean;
  /** 門前か（false は副露あり。暗槓だけの手は門前） */
  readonly isMenzen?: boolean;
  /** 点数の区分がこのどれか */
  readonly scoreLevelIn?: readonly ScoreLevelName[];
}

/** 分類のまとまり（管理画面の見出し。辞書キー `admin.problemCategories.groups.<group>`） */
export const PROBLEM_CATEGORY_GROUPS = [
  "yaku",
  "fu",
  "machi",
  "agari",
  "level",
] as const;

/**
 * 分類のまとまり
 * 問題分類グループ
 */
export type ProblemCategoryGroup = (typeof PROBLEM_CATEGORY_GROUPS)[number];

/**
 * 分類 1 つ
 * 問題分類
 */
export interface ProblemCategory {
  /** URL のクエリと辞書キーに使う ID（変えると共有済みの URL が切れる） */
  readonly id: string;
  readonly group: ProblemCategoryGroup;
  readonly condition: FacetCondition;
  /** 聴牌形に当てるときの意味（このモジュールの説明） */
  readonly tenpaiMatch: "any" | "all";
}

/** 満貫以上の区分 */
const MANGAN_OR_ABOVE: readonly ScoreLevelName[] = SCORE_LEVELS.filter(
  (level) => level !== "Normal",
);

/** 役牌として内訳に出る役 ID（場風・自風・三元牌。風は内訳では「場風牌 / 自風牌」で出る） */
const YAKUHAI_IDS: readonly ScoreYakuId[] = [
  "Yakuhai",
  "Bakaze",
  "Jikaze",
  "Ton",
  "Nan",
  "Sha",
  "Pei",
  "Haku",
  "Hatsu",
  "Chun",
];

function yakuCategory(id: string, condition: FacetCondition): ProblemCategory {
  return { id, group: "yaku", condition, tenpaiMatch: "any" };
}

/**
 * 分類の一覧（管理画面に出す順）
 * 問題分類一覧
 *
 * 最初の組は、教材と練習の区分（役の翻数・符計算・待ちの符・門前加符・満貫以上）に
 * 合わせて選んだ。件数を見てから足し引きする前提で、網羅を目指していない。どれも
 * 「どれかの和了が満たす」（`any`）。
 */
export const PROBLEM_CATEGORIES: readonly ProblemCategory[] = [
  yakuCategory("riichi", { yakuAll: ["Riichi"] }),
  yakuCategory("tanyao", { yakuAll: ["Tanyao"] }),
  yakuCategory("pinfu", { yakuAll: ["Pinfu"] }),
  yakuCategory("yakuhai", { yakuAny: YAKUHAI_IDS }),
  yakuCategory("iipeikou", { yakuAll: ["Iipeikou"] }),
  yakuCategory("sanshoku-doujun", { yakuAll: ["SanshokuDoujun"] }),
  yakuCategory("ikkitsuukan", { yakuAll: ["Ikkitsuukan"] }),
  yakuCategory("toitoi", { yakuAll: ["Toitoi"] }),
  yakuCategory("chiitoitsu", { yakuAll: ["Chiitoitsu"] }),
  yakuCategory("somete", { yakuAny: ["Honitsu", "Chinitsu"] }),
  { id: "fu-30", group: "fu", condition: { fuEq: 30 }, tenpaiMatch: "any" },
  { id: "fu-40", group: "fu", condition: { fuEq: 40 }, tenpaiMatch: "any" },
  {
    id: "fu-50-plus",
    group: "fu",
    condition: { fuMin: 50 },
    tenpaiMatch: "any",
  },
  {
    id: "machi-ryanmen",
    group: "machi",
    condition: { machiIn: ["Ryanmen"] },
    tenpaiMatch: "any",
  },
  {
    id: "machi-kanchan-penchan",
    group: "machi",
    condition: { machiIn: ["Kanchan", "Penchan"] },
    tenpaiMatch: "any",
  },
  {
    id: "machi-shanpon",
    group: "machi",
    condition: { machiIn: ["Shanpon"] },
    tenpaiMatch: "any",
  },
  {
    id: "machi-tanki",
    group: "machi",
    condition: { machiIn: ["Tanki"] },
    tenpaiMatch: "any",
  },
  {
    id: "menzen-ron",
    group: "agari",
    condition: { isTsumo: false, isMenzen: true },
    tenpaiMatch: "any",
  },
  {
    id: "furo",
    group: "agari",
    condition: { isMenzen: false },
    tenpaiMatch: "any",
  },
  {
    id: "mangan-plus",
    group: "level",
    condition: { scoreLevelIn: MANGAN_OR_ABOVE },
    tenpaiMatch: "any",
  },
];

/**
 * ID から分類を引く
 * 問題分類検索
 *
 * @param id - URL のクエリなどから来た文字列
 * @returns 一覧にあればその分類。無ければ undefined
 */
export function findProblemCategory(
  id: string | null | undefined,
): ProblemCategory | undefined {
  return PROBLEM_CATEGORIES.find((category) => category.id === id);
}

/** 条件の判定に使う、問題に共通の属性 */
interface FacetSetAttributes {
  readonly isMenzen: boolean;
}

/**
 * 和了 1 つが条件を満たすか
 * 属性条件判定
 *
 * 役が無くロンできない和了（`noYaku`）はどの条件も満たさない（条件が空でも）。
 *
 * @param condition - 条件（指定した項目をすべて満たすとき真）
 * @param set - 問題に共通の属性（門前かどうか）
 * @param row - 和了 1 つの属性
 */
export function facetRowMatches(
  condition: FacetCondition,
  set: FacetSetAttributes,
  row: ProblemFacetRow,
): boolean {
  if (row.result !== "scored") return false;
  const { yakuAll, yakuAny, fuEq, fuMin, machiIn, scoreLevelIn } = condition;
  if (yakuAll && !yakuAll.every((id) => row.yaku.includes(id))) return false;
  if (yakuAny && !yakuAny.some((id) => row.yaku.includes(id))) return false;
  if (fuEq !== undefined && row.fu !== fuEq) return false;
  if (fuMin !== undefined && row.fu < fuMin) return false;
  if (machiIn && !machiIn.some((machi) => machi === row.machi)) return false;
  if (condition.isTsumo !== undefined && row.isTsumo !== condition.isTsumo) {
    return false;
  }
  if (condition.isMenzen !== undefined && set.isMenzen !== condition.isMenzen) {
    return false;
  }
  if (scoreLevelIn && !scoreLevelIn.some((level) => level === row.scoreLevel)) {
    return false;
  }
  return true;
}

/**
 * 問題が分類に入るか
 * 問題分類判定
 *
 * 計算に失敗した問題（`failed`）はどの分類にも入らない。聴牌形は分類の `tenpaiMatch` で、
 * どれかの和了（`any`）かすべての和了（`all`）が条件を満たすかを見る。
 *
 * @param category - 分類
 * @param facets - {@link computeProblemFacets} が計算した属性
 */
export function problemMatchesCategory(
  category: Pick<ProblemCategory, "condition" | "tenpaiMatch">,
  facets: ProblemFacets,
): boolean {
  const { set, rows } = facets;
  if (set.status !== "ok" || rows.length === 0) return false;
  const matches = (row: ProblemFacetRow) =>
    facetRowMatches(category.condition, set, row);
  return category.tenpaiMatch === "all"
    ? rows.every(matches)
    : rows.some(matches);
}
