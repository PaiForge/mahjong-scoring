import {
  MentsuType,
  calculateScore,
  getPaymentTotal,
  type CompletedMentsu,
  type Fu,
  type HaiKindId,
  type Payment,
} from "@pai-forge/riichi-mahjong";
import type { WinType } from "./roles";
import { ScoreLevel } from "./constants";
import {
  DISPLAY_TIERS,
  hanRangeOf,
  YAKUMAN_HAN,
  type HanTier,
} from "../score/tiers";

/**
 * 点数導出のルールオプション
 * 点数導出オプション
 */
export interface ScoreCalculationOptions {
  /** 30符4翻・60符3翻を満貫に切り上げるか（切り上げ満貫、既定 false） */
  readonly kiriageMangan?: boolean;
}

/**
 * ツモ和了の支払い
 * ツモ支払い
 *
 * 子ツモは「子から / 親から」の2口、親ツモは全員から同額（オール）。
 * 点数の表現はこの構造体が唯一の形式で、"2000/4000" や "4000∀" のような
 * 文字列化は表示コンポーネントの責務（オール表記は i18n に依存するため、
 * core では文字列を組み立てない）。
 *
 * ライブラリの `Payment` は子ツモを `amount: [子, 親]` のタプルで持つ。
 * 表・図の表示側が「どちらの口か」を名前で読めるよう、ここで名前付きの
 * フィールドに詰め替える（{@link calculateKoScore} / {@link calculateOyaScore}）。
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
 *
 * 点数の導出自体はライブラリ（`calculateScore`）に委ねており、これは
 * 教本が「100点単位に切り上げる前の値」を見せるためだけに持つ
 * （ライブラリは基本符を公開していない）。
 */
export function calculateBasePoints(han: number, fu: number): number {
  return fu * Math.pow(2, 2 + han);
}

/**
 * 点数を100点単位に切り上げる
 * 100点単位切り上げ
 *
 * {@link calculateBasePoints} と同じく教本の説明用。点数の導出には使わない。
 */
export function ceilTo100(n: number): number {
  return Math.ceil(n / 100) * 100;
}

/**
 * ある立場（親 / 子）の点数
 * 立場別点数
 *
 * 点数表・教本の表は 1 セルにロンとツモの両方を持つため、翻数と符から
 * 両方をまとめて引く形にしている。ツモの支払いの形は立場で決まる
 * （子は2口・親はオール）ので、型引数で絞る。
 */
export interface RoleScore<T extends TsumoPayment = TsumoPayment> {
  /** 満貫以上か（切り上げ満貫を含む）。表は点数の代わりに「満貫」と出す */
  readonly isMangan: boolean;
  readonly ron: number;
  readonly tsumo: T;
}

/** 点数の導出に渡す設定。役満単位は区分の点数（{@link calculateTierScore}）だけが使う */
interface RoleScoreConfig extends ScoreCalculationOptions {
  readonly yakumanMultiplier?: number;
}

/**
 * 翻数と符からある立場のロン・ツモの支払いを引く
 * 立場別支払い計算
 *
 * 点数の導出（基本符・満貫以上の頭打ち・切り上げ満貫・役満単位）は
 * ライブラリの `calculateScore` に委ねる。
 */
function calculatePayments(
  han: number,
  fu: Fu,
  isOya: boolean,
  config: RoleScoreConfig,
): {
  readonly isMangan: boolean;
  readonly ron: number;
  readonly tsumo: Payment;
} {
  const shared = {
    isOya,
    ruleConfig: { kiriageMangan: config.kiriageMangan === true },
    yakumanMultiplier: config.yakumanMultiplier ?? 0,
  };
  const ron = calculateScore(han, fu, { ...shared, isTsumo: false });
  const tsumo = calculateScore(han, fu, { ...shared, isTsumo: true });
  return {
    isMangan: ron.scoreLevel !== ScoreLevel.Normal,
    // ロンの支払いは1口なので受け取り総額がそのまま支払い額
    ron: getPaymentTotal(ron.payment),
    tsumo: tsumo.payment,
  };
}

/**
 * 子の点数を計算する
 * 子点数計算
 */
export function calculateKoScore(
  han: number,
  fu: Fu,
  options: ScoreCalculationOptions = {},
): RoleScore<KoTsumoPayment> {
  return calculateKoScoreWith(han, fu, options);
}

/**
 * 親の点数を計算する
 * 親点数計算
 */
export function calculateOyaScore(
  han: number,
  fu: Fu,
  options: ScoreCalculationOptions = {},
): RoleScore<OyaTsumoPayment> {
  return calculateOyaScoreWith(han, fu, options);
}

function calculateKoScoreWith(
  han: number,
  fu: Fu,
  config: RoleScoreConfig,
): RoleScore<KoTsumoPayment> {
  const { isMangan, ron, tsumo } = calculatePayments(han, fu, false, config);
  // 子（isOya: false）のツモ和了で子ツモ以外の支払いは現れない
  if (tsumo.type !== "koTsumo") {
    throw new Error("子のツモの点数計算が子ツモ以外の支払いを返した");
  }
  return {
    isMangan,
    ron,
    tsumo: {
      type: "koTsumo",
      fromKo: tsumo.amount[0],
      fromOya: tsumo.amount[1],
    },
  };
}

function calculateOyaScoreWith(
  han: number,
  fu: Fu,
  config: RoleScoreConfig,
): RoleScore<OyaTsumoPayment> {
  const { isMangan, ron, tsumo } = calculatePayments(han, fu, true, config);
  // 親（isOya: true）のツモ和了で親ツモ以外の支払いは現れない
  if (tsumo.type !== "oyaTsumo") {
    throw new Error("親のツモの点数計算が親ツモ以外の支払いを返した");
  }
  return { isMangan, ron, tsumo: { type: "oyaTsumo", all: tsumo.amount } };
}

/** 満貫以上の点数を引くときに渡す符。点数に影響しないので最小の10刻みでよい */
const TIER_FU: Fu = 30;

/**
 * 満貫以上の点数区分の点数を子・親それぞれについて引く
 * 点数区分の点数
 *
 * 満貫以上は符に関係なく翻数（区分）だけで点数が決まるため、区分の
 * 最小翻数で計算する。渡す符は点数に影響しない。役満単位は翻数から
 * 導く（役満 = 13翻 = 1 単位。ダブル役満の区分は 2 単位）。数え役満の
 * 翻数（26翻以上）はライブラリが役満止まりに丸めるため、役満単位を
 * 渡さないとダブル役満の区分の点数が引けない。
 */
export function calculateTierScore(tier: HanTier): {
  readonly ko: RoleScore<KoTsumoPayment>;
  readonly oya: RoleScore<OyaTsumoPayment>;
} {
  const config = { yakumanMultiplier: Math.floor(tier.minHan / YAKUMAN_HAN) };
  return {
    ko: calculateKoScoreWith(tier.minHan, TIER_FU, config),
    oya: calculateOyaScoreWith(tier.minHan, TIER_FU, config),
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
 * 符計算でその面子を明（副露と同じ扱い）として数えるかを判定する
 * 面子明暗判定
 *
 * 副露していれば当然明。加えてロン和了では、和了牌を含む刻子も明刻として
 * 数える。シャンポン待ちの片割れを他家から受けた形であり、手牌に2枚
 * 持っていても最後の1枚は自力で引いていないため暗刻にはならない。
 * 槓子はロンでは完成しないため、この読み替えの対象外。
 *
 * 手牌の符を面子ごとに出す箇所は、生成側・表示側を問わずこの判定を通すこと。
 * 面子を作った時点の明暗をそのまま符にすると、ロン和了だけ符が過大になる。
 */
export function isOpenMentsuForFu(
  mentsu: CompletedMentsu,
  context: {
    readonly agariHai: HaiKindId;
    readonly isTsumo: boolean;
  },
): boolean {
  if (mentsu.furo) return true;
  return (
    !context.isTsumo &&
    mentsu.type === MentsuType.Koutsu &&
    mentsu.hais.includes(context.agariHai)
  );
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
 * 翻数しきい値は MANGAN_PLUS_TIERS、点数はライブラリからの導出
 * （{@link calculateTierScore}）。ここに点数を直書きしないこと
 * （満貫の 8000/12000 等が二重管理になる）。
 */
export const HIGH_SCORES = DISPLAY_TIERS.map((tier) => {
  const { ko, oya } = calculateTierScore(tier);
  return {
    nameKey: tier.key,
    han: hanRangeLabel(tier.key),
    ronKo: ko.ron,
    tsumoKo: ko.tsumo,
    ronOya: oya.ron,
    tsumoOya: oya.tsumo,
  };
});
