import {
  MentsuType,
  calculateScoreForTehai,
  validateTehai14,
  type CompletedMentsu,
  type HaiKindId,
  type MachiType,
  type MentsuHouraStructure,
  type Tehai,
} from "@pai-forge/riichi-mahjong";
import { isOpenMentsuForFu } from "../core/score-calculation";
import { isExposedMentsu } from "../problem/shared/hand-skeleton";
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
   * （{@link isOpenMentsuForFu}）。手牌の中にあっても明刻になるため、
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
 * 待ちの形から、和了牌が入る面子の種別を引く
 *
 * 同じ牌種が複数の面子に跨る手（例: 二索の暗刻 + 一二三索で二索和了）では、
 * 牌種だけでは和了牌がどの面子を完成させたのか決まらない。ライブラリが
 * 点数計算で採用した待ちの形が、その曖昧さを解く唯一の手掛かりになる。
 */
const MACHI_TARGET = {
  Tanki: "Jantou",
  Shanpon: MentsuType.Koutsu,
  Ryanmen: MentsuType.Shuntsu,
  Kanchan: MentsuType.Shuntsu,
  Penchan: MentsuType.Shuntsu,
} as const satisfies Record<MachiType, string>;

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
 * 副露と槓子は和了牌の入り先から除く。鳴いた面子は和了より前に完成して
 * おり、槓子はロン・ツモのどちらでも和了牌では完成しないため。
 */
function locateAgariHai(
  structure: MentsuHouraStructure,
  machiType: MachiType | undefined,
  agariHai: HaiKindId,
): AgariLocation | undefined {
  const target = machiType === undefined ? undefined : MACHI_TARGET[machiType];
  const jantouMatches = structure.jantou.hais[0] === agariHai;

  if (target === "Jantou") {
    return jantouMatches ? { haiIndex: 1 } : undefined;
  }

  const mentsuIndex = structure.fourMentsu.findIndex(
    (mentsu) =>
      !isExposedMentsu(mentsu) &&
      mentsu.hais.includes(agariHai) &&
      (target === undefined || mentsu.type === target),
  );
  if (mentsuIndex !== -1) {
    const mentsu = structure.fourMentsu[mentsuIndex];
    return {
      mentsuIndex,
      haiIndex: agariHaiIndexIn(mentsu.hais, mentsu.type, agariHai),
    };
  }

  // 待ちの形が取れなかった手牌の保険。牌種が一致する雀頭を単騎とみなす
  return jantouMatches ? { haiIndex: 1 } : undefined;
}

/**
 * 手牌から「4面子1雀頭」の分解表示に使える情報を解決する
 * 面子分解解決
 *
 * 同一手牌でも面子分解は一意ではなく（例: 111222333 は暗刻3つとも
 * 順子3つとも割れる）、解釈により符が変わる。独自に分解すると符内訳
 * （convertScoreDetailToFuDetails）と食い違う分割を表示しかねないため、
 * ライブラリが点数計算で採用した {@link MentsuHouraStructure} を土台にする。
 *
 * 面子の牌だけでは「その面子が手牌でどう見えていたか」が落ちるため、
 * 副露・明暗・和了牌の位置をここで併せて解決する。符内訳が「明刻子」と
 * 書いている面子を分解表示が単に「刻子」と出すと、同じ手牌の説明が
 * 2箇所で食い違って見える。
 *
 * ドラは全ての構造解釈で同数となり構造の選択に影響しないため、
 * 入力に取らない。
 *
 * 面子手でない場合（七対子・国士無双）と、手牌が14枚でない・点数計算が
 * 成立しない場合は undefined を返す。呼び出し側は分解表示自体を諦める。
 */
export function resolveMentsuBreakdown(
  tehai: Readonly<Tehai>,
  context: AgariContext,
): MentsuBreakdown | undefined {
  const tehai14 = validateTehai14(tehai);
  if (tehai14.isErr()) return undefined;

  try {
    const { detail } = calculateScoreForTehai(tehai14.value, {
      agariHai: context.agariHai,
      isTsumo: context.isTsumo,
      jikaze: context.jikaze,
      bakaze: context.bakaze,
      doraMarkers: [],
    });
    if (detail?.structure.type !== "Mentsu") return undefined;

    const { structure } = detail;
    const agari = locateAgariHai(structure, detail.machiType, context.agariHai);

    const toRow = (
      mentsu: CompletedMentsu,
      index: number,
    ): MentsuBreakdownRow => ({
      mentsu,
      isOpen: isOpenMentsuForFu(mentsu, context),
      isExposed: isExposedMentsu(mentsu),
      agariHaiIndex: agari?.mentsuIndex === index ? agari.haiIndex : undefined,
    });

    const [first, second, third, fourth] = structure.fourMentsu;

    return {
      fourMentsu: [
        toRow(first, 0),
        toRow(second, 1),
        toRow(third, 2),
        toRow(fourth, 3),
      ],
      jantou: {
        hais: structure.jantou.hais,
        agariHaiIndex:
          agari !== undefined && agari.mentsuIndex === undefined
            ? agari.haiIndex
            : undefined,
      },
    };
  } catch {
    // 役なし等で点数計算が成立しない手牌。分解表示だけを諦める
    return undefined;
  }
}
