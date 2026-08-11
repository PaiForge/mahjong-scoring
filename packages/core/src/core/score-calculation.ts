import type { WinType } from "./roles";

/**
 * ツモ和了の支払い
 * ツモ支払い
 *
 * 子ツモは「子から / 親から」の2口、親ツモは全員から同額（オール）。
 * 点数の表現はこの構造体が唯一の形式で、"2000/4000" や "4000∀" のような
 * 文字列化は表示コンポーネントの責務（オール表記は i18n に依存するため、
 * core では文字列を組み立てない）。
 */
export type TsumoPayment =
  | {
      readonly type: "koTsumo";
      readonly fromKo: number;
      readonly fromOya: number;
    }
  | { readonly type: "oyaTsumo"; readonly all: number };

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
 * 子の点数を計算する
 * 子点数計算
 */
export function calculateKoScore(
  han: number,
  fu: number,
): {
  readonly isMangan: boolean;
  readonly ron: number;
  readonly tsumo: TsumoPayment;
} {
  const base = calculateBasePoints(han, fu);
  if (base >= 2000) {
    return {
      isMangan: true,
      ron: 8000,
      tsumo: { type: "koTsumo", fromKo: 2000, fromOya: 4000 },
    };
  }
  const ron = ceilTo100(base * 4);
  return {
    isMangan: false,
    ron,
    tsumo: {
      type: "koTsumo",
      fromKo: ceilTo100(base * 1),
      fromOya: ceilTo100(base * 2),
    },
  };
}

/**
 * 親の点数を計算する
 * 親点数計算
 */
export function calculateOyaScore(
  han: number,
  fu: number,
): {
  readonly isMangan: boolean;
  readonly ron: number;
  readonly tsumo: TsumoPayment;
} {
  const base = calculateBasePoints(han, fu);
  if (base >= 2000) {
    return {
      isMangan: true,
      ron: 12000,
      tsumo: { type: "oyaTsumo", all: 4000 },
    };
  }
  const ron = ceilTo100(base * 6);
  return {
    isMangan: false,
    ron,
    tsumo: { type: "oyaTsumo", all: ceilTo100(base * 2) },
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
 * 満貫以上の点数データ
 * 高打点データ
 */
export const HIGH_SCORES = [
  {
    nameKey: "mangan",
    han: "5",
    ronKo: 8000,
    tsumoKo: { type: "koTsumo", fromKo: 2000, fromOya: 4000 },
    ronOya: 12000,
    tsumoOya: { type: "oyaTsumo", all: 4000 },
  },
  {
    nameKey: "haneman",
    han: "6-7",
    ronKo: 12000,
    tsumoKo: { type: "koTsumo", fromKo: 3000, fromOya: 6000 },
    ronOya: 18000,
    tsumoOya: { type: "oyaTsumo", all: 6000 },
  },
  {
    nameKey: "baiman",
    han: "8-10",
    ronKo: 16000,
    tsumoKo: { type: "koTsumo", fromKo: 4000, fromOya: 8000 },
    ronOya: 24000,
    tsumoOya: { type: "oyaTsumo", all: 8000 },
  },
  {
    nameKey: "sanbaiman",
    han: "11-12",
    ronKo: 24000,
    tsumoKo: { type: "koTsumo", fromKo: 6000, fromOya: 12000 },
    ronOya: 36000,
    tsumoOya: { type: "oyaTsumo", all: 12000 },
  },
  {
    nameKey: "yakuman",
    han: "13~",
    ronKo: 32000,
    tsumoKo: { type: "koTsumo", fromKo: 8000, fromOya: 16000 },
    ronOya: 48000,
    tsumoOya: { type: "oyaTsumo", all: 16000 },
  },
] as const;
