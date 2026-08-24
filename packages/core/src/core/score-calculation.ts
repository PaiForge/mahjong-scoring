import type { WinType } from "./roles";
import { DISPLAY_TIERS, hanRangeOf, MANGAN_PLUS_TIERS } from "../score/tiers";

/**
 * 満貫の基本符。基本符がこれ以上なら満貫以上として頭打ちになる。
 * 満貫基本符
 *
 * 満貫は MANGAN_PLUS_TIERS で最も基本符が小さい区分なので最小値を引く。
 */
export const MANGAN_BASE_POINTS = Math.min(
  ...MANGAN_PLUS_TIERS.map((tier) => tier.basePoints),
);

/**
 * 切り上げ満貫の対象となる基本符
 * 切り上げ満貫基本符
 *
 * 30符4翻・60符3翻はどちらも基本符1920で、満貫の2000にわずかに届かない。
 * 切り上げ満貫ルールではこの基本符以上を満貫として扱う。
 */
export const KIRIAGE_MANGAN_BASE_POINTS = calculateBasePoints(4, 30);

/**
 * 点数導出のルールオプション
 * 点数導出オプション
 */
export interface ScoreCalculationOptions {
  /** 30符4翻・60符3翻を満貫に切り上げるか（切り上げ満貫、既定 false） */
  readonly kiriageMangan?: boolean;
}

/**
 * 基本符が満貫（以上）として扱われるかを判定する
 * 満貫到達判定
 */
function reachesMangan(
  basePoints: number,
  options?: ScoreCalculationOptions,
): boolean {
  if (basePoints >= MANGAN_BASE_POINTS) return true;
  return (
    options?.kiriageMangan === true && basePoints >= KIRIAGE_MANGAN_BASE_POINTS
  );
}

/**
 * ツモ和了の支払い
 * ツモ支払い
 *
 * 子ツモは「子から / 親から」の2口、親ツモは全員から同額（オール）。
 * 点数の表現はこの構造体が唯一の形式で、"2000/4000" や "4000∀" のような
 * 文字列化は表示コンポーネントの責務（オール表記は i18n に依存するため、
 * core では文字列を組み立てない）。
 */
export interface KoTsumoPayment {
  readonly type: "koTsumo";
  /** 子1人あたりの支払い */
  readonly fromKo: number;
  /** 親の支払い */
  readonly fromOya: number;
}

export interface OyaTsumoPayment {
  readonly type: "oyaTsumo";
  /** 全員が同額を支払う（オール） */
  readonly all: number;
}

export type TsumoPayment = KoTsumoPayment | OyaTsumoPayment;

/**
 * 基本符（ベースポイント）を計算する
 * 基本符計算
 */
export function calculateBasePoints(han: number, fu: number): number {
  return fu * Math.pow(2, 2 + han);
}

/**
 * 点数を100点単位に切り上げる
 * 100点単位切り上げ
 */
export function ceilTo100(n: number): number {
  return Math.ceil(n / 100) * 100;
}

/**
 * 基本符から子の支払いを導出する
 * 子点数導出
 *
 * 子はロンで基本符の4倍、ツモで子から1倍・親から2倍。
 * 満貫以上も同じ式で、基本符に {@link MANGAN_PLUS_TIERS} の固定値を渡す。
 */
export function koScoreFromBasePoints(basePoints: number): {
  readonly ron: number;
  readonly tsumo: KoTsumoPayment;
} {
  return {
    ron: ceilTo100(basePoints * 4),
    tsumo: {
      type: "koTsumo",
      fromKo: ceilTo100(basePoints * 1),
      fromOya: ceilTo100(basePoints * 2),
    },
  };
}

/**
 * 基本符から親の支払いを導出する
 * 親点数導出
 *
 * 親はロンで基本符の6倍、ツモで全員から2倍。
 */
export function oyaScoreFromBasePoints(basePoints: number): {
  readonly ron: number;
  readonly tsumo: OyaTsumoPayment;
} {
  return {
    ron: ceilTo100(basePoints * 6),
    tsumo: { type: "oyaTsumo", all: ceilTo100(basePoints * 2) },
  };
}

/**
 * 子の点数を計算する
 * 子点数計算
 */
export function calculateKoScore(
  han: number,
  fu: number,
  options?: ScoreCalculationOptions,
): {
  readonly isMangan: boolean;
  readonly ron: number;
  readonly tsumo: TsumoPayment;
} {
  const base = calculateBasePoints(han, fu);
  const isMangan = reachesMangan(base, options);
  return {
    isMangan,
    ...koScoreFromBasePoints(isMangan ? MANGAN_BASE_POINTS : base),
  };
}

/**
 * 親の点数を計算する
 * 親点数計算
 */
export function calculateOyaScore(
  han: number,
  fu: number,
  options?: ScoreCalculationOptions,
): {
  readonly isMangan: boolean;
  readonly ron: number;
  readonly tsumo: TsumoPayment;
} {
  const base = calculateBasePoints(han, fu);
  const isMangan = reachesMangan(base, options);
  return {
    isMangan,
    ...oyaScoreFromBasePoints(isMangan ? MANGAN_BASE_POINTS : base),
  };
}

/**
 * 刻子・槓子1面子分の符を計算する
 * 面子符計算
 *
 * 基本符は刻子2符・槓子8符。暗（非副露）で2倍、么九牌でさらに2倍。
 */
export function calculateMentsuFu(config: {
  readonly isKantsu: boolean;
  readonly isOpen: boolean;
  readonly isYaochu: boolean;
}): number {
  let fu = config.isKantsu ? 8 : 2;
  if (!config.isOpen) fu *= 2;
  if (config.isYaochu) fu *= 2;
  return fu;
}

/**
 * 無効なセル（存在しない符×翻の組み合わせ）かどうかを判定する
 * 無効セル判定
 */
export function isInvalidCell(
  han: number,
  fu: number,
  winType: WinType,
): boolean {
  return (
    (han === 1 && fu === 20) ||
    (winType === "ron" && fu === 20) ||
    (han === 1 && fu === 25) ||
    (winType === "tsumo" && han === 2 && fu === 25)
  );
}

/**
 * 早見表の翻数レンジ表示を組み立てる（例: "5" / "6-7" / "13~"）
 * 翻数レンジ表示
 *
 * 早見表は「この翻数なら符に関係なくこの点数」を示すため、満貫の下限は
 * 5 翻。学習ページは「満貫になる翻数」を教える別の観点で 4 翻から示す
 * （learn/_lib/han-display.ts）。
 */
function hanRangeLabel(key: string): string {
  const range = hanRangeOf(key);
  if (range === undefined) return "";
  if (range.max === undefined) return `${range.min}~`;
  return range.min === range.max ? `${range.min}` : `${range.min}-${range.max}`;
}

/**
 * 満貫以上の点数データ
 * 高打点データ
 *
 * 翻数しきい値・基本符は MANGAN_PLUS_TIERS、点数は基本符からの導出。
 * ここに点数を直書きしないこと（満貫の 8000/12000 等が二重管理になる）。
 */
export const HIGH_SCORES = DISPLAY_TIERS.map((tier) => {
  const ko = koScoreFromBasePoints(tier.basePoints);
  const oya = oyaScoreFromBasePoints(tier.basePoints);
  return {
    nameKey: tier.key,
    han: hanRangeLabel(tier.key),
    ronKo: ko.ron,
    tsumoKo: ko.tsumo,
    ronOya: oya.ron,
    tsumoOya: oya.tsumo,
  };
});
