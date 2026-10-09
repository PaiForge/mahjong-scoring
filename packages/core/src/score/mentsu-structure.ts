import {
  MentsuType,
  getPaymentTotal,
  rankScoresForTehai,
  validateTehai14,
  type CompletedMentsu,
  type Fu,
  type HaiKindId,
  type MentsuHouraStructure,
  type Payment,
  type RankedScoreResult,
  type RuleConfig,
  type ScoreResult,
  type Tehai,
  type Tehai14,
  type YakuResult,
} from "@pai-forge/riichi-mahjong";
import { isOpenMentsuAt } from "../core/score-calculation";
import { isExposedMentsu } from "../problem/shared/hand-skeleton";
import { orderByHandLayout } from "../problem/shared/hand-layout";
import { applyAppScoringRules } from "../problem/score/utils/reconciler";
import type { AgariContext } from "../problem/shared/agari-context";

/**
 * 面子分解表示の1面子
 * 面子分解行
 *
 * 牌の並び（mentsu）に、その面子が手牌でどう見えていたか（副露か・明暗）と
 * 和了牌の位置を添えたもの。表示側はこれを読むだけで、面子の並べ方と
 * ラベルを決められる。
 */
export interface MentsuBreakdownRow {
  /** 面子そのもの。牌・種別・副露のメタ情報を持つ */
  readonly mentsu: CompletedMentsu;
  /**
   * 符計算上「明」として数えるか
   *
   * 副露に加えて、ロンで完成した刻子も明として数える
   * （{@link isOpenMentsuAt}）。手牌の中にあっても明刻になるため、
   * 「晒されているか」（{@link isExposed}）とは一致しない。
   */
  readonly isOpen: boolean;
  /** 手牌の右に晒される面子（副露・槓子）か。暗槓を含む */
  readonly isExposed: boolean;
  /**
   * 和了牌の位置（mentsu.hais のインデックス）
   *
   * この面子で和了していなければ undefined。手牌全体で高々1箇所に付く。
   */
  readonly agariHaiIndex?: number;
}

/**
 * 面子分解表示の雀頭
 * 雀頭分解行
 */
export interface JantouBreakdownRow {
  readonly hais: readonly [HaiKindId, HaiKindId];
  /** 和了牌（単騎待ち）の位置。単騎で和了していなければ undefined */
  readonly agariHaiIndex?: number;
}

/**
 * 面子分解表示の全体
 * 面子分解
 */
export interface MentsuBreakdown {
  readonly fourMentsu: readonly [
    MentsuBreakdownRow,
    MentsuBreakdownRow,
    MentsuBreakdownRow,
    MentsuBreakdownRow,
  ];
  readonly jantou: JantouBreakdownRow;
}

/**
 * 面子分解の候補 1 つ（和了解釈 1 つ分）
 * 面子分解候補
 *
 * 同じ手牌でも「面子分解 × 和了牌の置き場所」で和了解釈は複数ありうる。
 * 候補ごとに分解と、その解釈の点数（翻・符・支払い・役）を添える。
 * 表示側は候補をタブなどで切り替え、`isBest` の候補を最高点として目立たせる。
 */
export interface MentsuBreakdownCandidate {
  /**
   * 候補を識別する安定したキー
   *
   * 雀頭・面子の並び・和了牌の置き場所から作る。配列の添字ではないため、
   * 候補の順序が変わっても同じ解釈は同じキーになる。
   */
  readonly key: string;
  readonly breakdown: MentsuBreakdown;
  /** 総翻数（役 + ドラ） */
  readonly han: number;
  readonly fu: Fu;
  readonly payment: Payment;
  /** 成立した役と翻数（ドラを含まない） */
  readonly yakuResult: YakuResult;
  /**
   * 最も高い点数（支払い）になる解釈か
   *
   * 先頭の候補と支払いが同じ候補はすべて true になる。翻・符が違っても
   * 支払いが同じなら（例: 6翻60符と 6翻50符はどちらも跳満 12000 点）
   * 「最高点」としては同じであり、先頭だけを唯一の正解として扱わない。
   * 候補の並び順（基本点 → 翻数 → 符）はこの印とは別で、先頭が点数計算に
   * 採用される解釈。
   */
  readonly isBest: boolean;
}

/**
 * 面子分解の解決に使う和了状況
 * 面子分解コンテキスト
 *
 * ドラは全ての解釈で同数だが、翻数が上がると満貫で点数が頭打ちになり、
 * 符の差で勝っていた解釈と翻数で勝つ解釈の順位が入れ替わることがある。
 * 候補の順位と点数を問題の採点と揃えるため、採点に使ったドラ表示牌・
 * ルール設定・リーチ（立直の 1 翻と裏ドラ）を渡す。`ScoreQuestion` は
 * これらを同じ名前で持つのでそのまま渡せる。持たない出題（符の練習など）は
 * 省略してよい。
 */
export interface MentsuBreakdownContext extends AgariContext {
  readonly doraMarkers?: readonly HaiKindId[];
  readonly ruleConfig?: RuleConfig;
  /** リーチを宣言しているか。立直の 1 翻と裏ドラを候補の点数に乗せる */
  readonly isRiichi?: boolean;
  /** 裏ドラ表示牌（リーチしている手だけが持つ） */
  readonly uraDoraMarkers?: readonly HaiKindId[];
}

/** 和了牌の位置。雀頭で和了した場合は mentsuIndex を持たない */
interface AgariLocation {
  readonly mentsuIndex?: number;
  readonly haiIndex: number;
}

/**
 * 面子内での和了牌の位置を返す
 *
 * 順子は牌種が全て異なるため位置が一意に決まる。刻子・槓子・雀頭は
 * 同じ牌が並ぶので、実卓で最後に加わった牌の見え方に合わせて右端を採る。
 */
function agariHaiIndexIn(
  hais: readonly HaiKindId[],
  type: MentsuType,
  agariHai: HaiKindId,
): number {
  return type === MentsuType.Shuntsu ? hais.indexOf(agariHai) : hais.length - 1;
}

/**
 * 和了牌がどの面子のどの位置にあるかを解決する
 *
 * どのブロックを完成させたかはライブラリが和了形に持たせている
 * （`structure.agari`）ので、ここでは牌の並びの中の位置に直すだけ。
 * 同じ牌種が複数の面子に跨る手でも、ライブラリが高点法で採った置き場所に
 * 従うため、符の内訳と食い違わない。
 */
function locateAgariHai(structure: MentsuHouraStructure): AgariLocation {
  const { agari } = structure;
  if (agari.kind === "Jantou") return { haiIndex: 1 };

  const mentsu = structure.fourMentsu[agari.index];
  return {
    mentsuIndex: agari.index,
    haiIndex: agariHaiIndexIn(mentsu.hais, mentsu.type, agari.hai),
  };
}

/**
 * 候補を識別するキーを作る
 *
 * 面子は種別・牌・副露を並べ替えて多重集合として比べ、和了牌の置き場所は
 * 完成させたブロックの牌で表す。
 */
function candidateKeyOf(structure: MentsuHouraStructure): string {
  const mentsuKeys = structure.fourMentsu
    .map(
      (m) =>
        `${m.type}:${m.hais.join(",")}:${m.furo ? `${m.furo.type}/${m.furo.from}` : "closed"}`,
    )
    .sort();
  const { agari } = structure;
  const agariKey =
    agari.kind === "Jantou"
      ? "jantou"
      : `${structure.fourMentsu[agari.index].hais.join(",")}@${agari.hai}`;
  return `${structure.jantou.hais.join(",")}|${mentsuKeys.join("|")}|${agariKey}`;
}

/**
 * ライブラリの和了構造を分解表示に直す
 *
 * 面子の牌だけでは「その面子が手牌でどう見えていたか」が落ちるため、
 * 副露・明暗・和了牌の位置をここで併せて解決する。符内訳が「明刻子」と
 * 書いている面子を分解表示が単に「刻子」と出すと、同じ手牌の説明が
 * 2箇所で食い違って見える。面子は手牌の左から右の並びの順に並べる
 * （{@link orderByHandLayout}）。ライブラリの和了構造は面子を独自の順で
 * 持つため、そのままでは分解の表と手牌の並びが食い違う。
 */
function toBreakdown(
  structure: MentsuHouraStructure,
  isTsumo: boolean,
): MentsuBreakdown {
  const agari = locateAgariHai(structure);

  const toRow = (
    mentsu: CompletedMentsu,
    index: number,
  ): MentsuBreakdownRow => ({
    mentsu,
    isOpen: isOpenMentsuAt(structure, index, isTsumo),
    isExposed: isExposedMentsu(mentsu),
    agariHaiIndex: agari.mentsuIndex === index ? agari.haiIndex : undefined,
  });

  const [first, second, third, fourth] = orderByHandLayout(
    structure.fourMentsu.map(toRow),
    (row) => ({ tiles: row.mentsu.hais, isExposed: row.isExposed }),
  );

  return {
    fourMentsu: [first, second, third, fourth],
    jantou: {
      hais: structure.jantou.hais,
      agariHaiIndex:
        agari.mentsuIndex === undefined ? agari.haiIndex : undefined,
    },
  };
}

/** 2 つの点数計算結果の支払いが同じか（翻・符は問わない） */
function isSamePayment(a: ScoreResult, b: ScoreResult): boolean {
  return getPaymentTotal(a.payment) === getPaymentTotal(b.payment);
}

/**
 * 候補の点数に、問題の正解と同じアプリの採点規則（立直・裏ドラの後付け、
 * 役満では乗せない）を適用する
 */
function scoreCandidate(
  result: RankedScoreResult,
  tehai: Tehai14,
  context: MentsuBreakdownContext,
): ScoreResult {
  const riichi =
    context.isRiichi === true
      ? { uraDoraMarkers: context.uraDoraMarkers ?? [] }
      : undefined;
  return applyAppScoringRules({
    tehai,
    answer: result,
    yakuResult: result.detail.yakuResult,
    isTsumo: context.isTsumo,
    jikaze: context.jikaze,
    ruleConfig: context.ruleConfig,
    riichi,
  }).answer;
}

/**
 * 手牌の面子分解の候補を、高点法の順に解決する
 * 面子分解候補解決
 *
 * 同一手牌でも面子分解は一意ではなく（例: 111222333 は暗刻3つとも
 * 順子3つとも割れる）、さらに同じ分解でも和了牌をどのブロックに入れたかで
 * 待ち・明暗が変わる。独自に分解すると符内訳
 * （convertScoreDetailToFuDetails）と食い違う分割を表示しかねないため、
 * ライブラリが点数計算で評価した和了解釈（`rankScoresForTehai`）を土台にする。
 *
 * 候補は高点法の降順で、先頭が点数計算に採用された解釈。先頭と支払いが
 * 同じ候補も `isBest` になる。役が成立しない解釈は和了ではないため候補に入らない。
 * 候補ごとの翻・支払いには、問題の正解と同じくアプリの採点規則（立直の
 * 1 翻と裏ドラ。役満の手には乗せない）を適用する。
 * 面子手でない解釈（七対子・国士無双）は分解表示を持たないため除く。
 *
 * 手牌が14枚でない・成立する和了が無い場合は空配列を返す。呼び出し側は
 * 分解表示自体を諦める。
 */
export function resolveMentsuBreakdowns(
  tehai: Readonly<Tehai>,
  context: MentsuBreakdownContext,
): readonly MentsuBreakdownCandidate[] {
  const tehai14 = validateTehai14(tehai);
  if (tehai14.isErr()) return [];

  const ranked = rankScoresForTehai(tehai14.value, {
    agariHai: context.agariHai,
    isTsumo: context.isTsumo,
    jikaze: context.jikaze,
    bakaze: context.bakaze,
    doraMarkers: context.doraMarkers ?? [],
    ...(context.ruleConfig ? { ruleConfig: context.ruleConfig } : {}),
  });
  const [best] = ranked;
  if (best === undefined) return [];
  const bestScore = scoreCandidate(best, tehai14.value, context);

  return ranked.flatMap((result): MentsuBreakdownCandidate[] => {
    const { structure } = result.detail;
    if (structure.type !== "Mentsu") return [];
    const score = scoreCandidate(result, tehai14.value, context);
    return [
      {
        key: candidateKeyOf(structure),
        breakdown: toBreakdown(structure, context.isTsumo),
        han: score.han,
        fu: score.fu,
        payment: score.payment,
        yakuResult: result.detail.yakuResult,
        isBest: isSamePayment(score, bestScore),
      },
    ];
  });
}

/**
 * 手牌から「4面子1雀頭」の分解表示に使える情報を解決する
 * 面子分解解決
 *
 * {@link resolveMentsuBreakdowns} の先頭、すなわち点数計算に採用された解釈の
 * 分解。面子手でない場合（七対子・国士無双）と、手牌が14枚でない・点数計算が
 * 成立しない場合は undefined を返す。
 */
export function resolveMentsuBreakdown(
  tehai: Readonly<Tehai>,
  context: MentsuBreakdownContext,
): MentsuBreakdown | undefined {
  return resolveMentsuBreakdowns(tehai, context)[0]?.breakdown;
}
