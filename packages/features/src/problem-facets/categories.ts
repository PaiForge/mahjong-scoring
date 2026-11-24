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
 * `variants` に列挙する。自由な検索から解くものは記録なしのトレーニングに限る。ID は URL のクエリと
 * 辞書キー（`admin.problemCategories.categories.<id>`）に同じ文字列で使う。
 *
 * @design 属性・単一値の分類・名前付き条件の 3 層に分ける
 * DB は事実、単一値は学習上の値、名前付き条件は OR・範囲・軸をまたぐ AND。
 * 人の判断で付けるラベルだけが将来のタグ表の対象で、自動分類の n:n 表は作らない。
 * 単一値の ID は <軸>-<値>。名前付き条件は固有名を使う。旧 fu-50-plus などは
 * 管理画面だけで使われていたため互換エイリアスを設けない（未知 ID は未選択）。
 * 符は core の FU_VALUES の全値を扱い、50 符以上のような範囲へ丸めない。
 * 待ち・役・点数区分も正本から生成し、表示したい値だけを別に列挙しない。
 *
 * @design 分類の件数は排他的な分布ではない
 * 単一値も tenpaiMatch を持ち、一覧は any で数える。20 符ツモ・30 符ロンの聴牌形は
 * 両方に 1 問ずつ入る。all にすると両方から消えるため、集計の重複回避には使わない。
 * 役は和了形でも複数に入る。七対子・国士の待ち null を単騎へ読み替えない。
 *
 * @design 検索と出題の条件は後段で決める
 * 検索は同じ和了の中で条件を満たす必要がある。現条件には符の複数値 OR・上限や
 * 翻の条件が無いため、検索 UI の段階で判定と SQL を一緒に拡張する。
 * Normal 限定は符別の点数回答ドリルの条件で、分類や符そのものを答える練習には
 * 適用しない。記録を残す点数ドリルは切り上げ満貫等の回答が割れる境界を除く。
 * 符だけを答える練習に点数の境界を機械的に適用しない。
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
import {
  FU_VALUES,
  isScoreYakuId,
  SCORE_YAKU_NAME_MAP,
  type MachiType,
  type ScoreYakuId,
} from "@mahjong-scoring/core";
import { ScoreLevel } from "@mahjong-scoring/core/core/constants";
import { SITUATIONAL_YAKU_KEYS } from "@mahjong-scoring/core/core/yaku-names";
import {
  MACHI_TYPES,
  calculateMachiFu,
} from "@mahjong-scoring/core/score/machi-fu";

import type { ProblemFacetRow, ProblemFacets } from "./compute";

/** 点数の区分（ライブラリの `ScoreLevel` の値。属性の `scoreLevel` に入る文字列） */
export const SCORE_LEVELS = Object.values(ScoreLevel);

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
  "menzen",
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
  /** 単一値の分類か、名前付きの条件か */
  readonly kind: "value" | "named";
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

/** PascalCase の属性値を、URL と辞書に使うケバブケースにする。ID の集合は契約テストで固定する。 */
function valueSlug(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function valueCategory(
  group: ProblemCategoryGroup,
  value: string,
  condition: FacetCondition,
): ProblemCategory {
  return {
    id: `${group}-${valueSlug(value)}`,
    group,
    kind: "value",
    condition,
    tenpaiMatch: "any",
  };
}

/**
 * 単一値の分類。符・役・待ち・点数区分の正本は core に置く。
 * 単一値分類
 *
 * @design 役牌は生の役 ID ではなく学習上の 1 値
 * 場風・自風・三元牌の内訳は保存したまま、読む条件だけで役牌にまとめる。
 * 書き込み時の正規化は情報を失い、採点の版と再計算も必要になるため採らない。
 * 状況役は保存盤面に情報が無く出題しないため除く。他の役を手で選抜しない。
 */
export const PROBLEM_VALUE_CATEGORIES: readonly ProblemCategory[] = [
  ...Object.keys(SCORE_YAKU_NAME_MAP)
    .filter(isScoreYakuId)
    .filter(
      (id) =>
        !SITUATIONAL_YAKU_KEYS.includes(id) &&
        (!YAKUHAI_IDS.includes(id) || id === "Yakuhai"),
    )
    .map((id) =>
      valueCategory(
        "yaku",
        id,
        id === "Yakuhai" ? { yakuAny: YAKUHAI_IDS } : { yakuAll: [id] },
      ),
    ),
  ...FU_VALUES.map((fu) => valueCategory("fu", String(fu), { fuEq: fu })),
  ...MACHI_TYPES.map((machi) =>
    valueCategory("machi", machi, { machiIn: [machi] }),
  ),
  ...[true, false].map((isTsumo) =>
    valueCategory("agari", isTsumo ? "tsumo" : "ron", { isTsumo }),
  ),
  ...[true, false].map((isMenzen) =>
    valueCategory("menzen", String(isMenzen), { isMenzen }),
  ),
  ...SCORE_LEVELS.map((level) =>
    valueCategory("level", level, { scoreLevelIn: [level] }),
  ),
];

/** 名前付き条件。単一値の分類とは別に、OR や軸をまたぐ AND に教材上の名前を付ける。 */
export const NAMED_PROBLEM_CATEGORIES: readonly ProblemCategory[] = [
  {
    id: "somete",
    group: "yaku",
    kind: "named",
    condition: { yakuAny: ["Honitsu", "Chinitsu"] },
    tenpaiMatch: "any",
  },
  {
    id: "menzen-ron",
    group: "agari",
    kind: "named",
    condition: { isMenzen: true, isTsumo: false },
    tenpaiMatch: "any",
  },
  {
    id: "mangan-plus",
    group: "level",
    kind: "named",
    condition: { scoreLevelIn: MANGAN_OR_ABOVE },
    tenpaiMatch: "any",
  },
  {
    id: "machi-fu-2",
    group: "machi",
    kind: "named",
    condition: {
      machiIn: MACHI_TYPES.filter((machi) => calculateMachiFu(machi) === 2),
    },
    tenpaiMatch: "any",
  },
];

/** 全分類。件数・一覧・ID 検索は単一値と名前付き条件の同じ判定を使う。 */
export const PROBLEM_CATEGORIES: readonly ProblemCategory[] = [
  ...PROBLEM_VALUE_CATEGORIES,
  ...NAMED_PROBLEM_CATEGORIES,
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
