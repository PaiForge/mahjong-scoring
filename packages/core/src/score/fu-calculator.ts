import {
  MentsuType,
  isYaochu,
  type Kazehai,
  type ScoreDetail,
} from "@pai-forge/riichi-mahjong";
import { calculateMentsuFu, isOpenMentsuAt } from "../core/score-table-math";
import {
  jantouFuReasons,
  type JantouFuReason,
} from "../problem/shared/jantou-fu";
import { FU_STEP, FUTEI_FU } from "./mentsu-tehai-fu";
import { openLabel, yaochuLabel } from "../problem/shared/mentsu-labels";

/**
 * 雀頭が役牌である理由の、言語に依らない名前の一覧
 * 雀頭役牌理由キー一覧
 *
 * {@link FuReasonSpec} の `jantou` が持つ。辞書の
 * `challenge.fuBreakdown.reasons.jantouReasons.<key>` のキーと同じ文字列。
 * 型（{@link JantouFuReasonKey}）と、記録を読み直すスキーマの列挙の両方が
 * ここから導くので、キーを足すときはここだけを直す。
 */
export const JANTOU_FU_REASON_KEYS = ["bakaze", "jikaze", "sangenpai"] as const;

/**
 * 雀頭が役牌である理由の、言語に依らない名前（{@link JANTOU_FU_REASON_KEYS} の要素）
 * 雀頭役牌理由キー
 */
export type JantouFuReasonKey = (typeof JANTOU_FU_REASON_KEYS)[number];

/**
 * 符が付く待ちの、言語に依らない名前の一覧
 * 待ち符キー一覧
 *
 * {@link FuReasonSpec} の `machi` が持つ。`other` はライブラリが待ちの種類を
 * 返さなかった（または符の付く 3 種に当たらない）ときで、日本語は「待ち」。
 * 辞書の `challenge.fuBreakdown.reasons.machi` の `select` の選択肢と同じ文字列。
 * 型（{@link FuMachiKey}）と、記録を読み直すスキーマの列挙の両方が
 * ここから導くので、キーを足すときはここだけを直す。
 */
export const FU_MACHI_KEYS = ["tanki", "kanchan", "penchan", "other"] as const;

/**
 * 符が付く待ちの、言語に依らない名前（{@link FU_MACHI_KEYS} の要素）
 * 待ち符キー
 */
export type FuMachiKey = (typeof FU_MACHI_KEYS)[number];

/**
 * 符の理由の構造
 * 符理由
 *
 * 内訳の 1 行が「なぜその符か」を、言語に依らない形で持つ。描く側が言語ごとの
 * 文言にする（web・モバイルは辞書の `challenge.fuBreakdown.reasons.*` を
 * features の `fuReasonLabel` で引く）。{@link FuDetail.reason}（日本語の文言）は
 * これから {@link formatFuReasonJa} で組む。
 *
 * core の文字列を直接英語にしないのは、モバイル（日本語固定）と保存済みの内訳
 * （`reason` は日本語のまま sessionStorage・DB に残る）が `reason` を読むため。
 * 構造を足すだけなら、それらは何も変わらない。
 *
 * - `futei` — 副底（国士無双の便宜上の 1 行も同じ）
 * - `chiitoitsu` — 七対子 25 符
 * - `pinfuTsumo` — 平和ツモ 20 符
 * - `tsumo` — ツモ符
 * - `menzenRon` — 門前加符
 * - `mentsu` — 刻子・槓子の符（么九牌か・明か・槓子か）
 * - `jantou` — 役牌の雀頭（理由は場風・自風・三元牌の順。連風牌は場風と自風の 2 つ）
 * - `machi` — 待ち符
 * - `kuiPinfu` — 特例等の加符（喰い平和の合計 20 符を 30 符に切り上げる 10 符）
 */
export type FuReasonSpec =
  | { readonly kind: "futei" }
  | { readonly kind: "chiitoitsu" }
  | { readonly kind: "pinfuTsumo" }
  | { readonly kind: "tsumo" }
  | { readonly kind: "menzenRon" }
  | {
      readonly kind: "mentsu";
      readonly yaochu: boolean;
      readonly open: boolean;
      readonly kantsu: boolean;
    }
  | {
      readonly kind: "jantou";
      readonly reasons: readonly JantouFuReasonKey[];
    }
  | { readonly kind: "machi"; readonly machi: FuMachiKey }
  | { readonly kind: "kuiPinfu" };

/**
 * 雀頭の理由（`jantouFuReasons` の日本語の語彙）から {@link JantouFuReasonKey} への対応
 *
 * `jantouFuReasons` の戻り値の型（日本語の union）は符の計算が読むので変えず、
 * 構造へはこの表で写す。
 */
const JANTOU_REASON_KEYS: Readonly<Record<JantouFuReason, JantouFuReasonKey>> =
  {
    場風: "bakaze",
    自風: "jikaze",
    三元牌: "sangenpai",
  };

/** {@link JantouFuReasonKey} の日本語（`jantouFuReasons` の語彙と同じ文字列） */
const JANTOU_REASON_LABELS: Readonly<Record<JantouFuReasonKey, string>> = {
  bakaze: "場風",
  jikaze: "自風",
  sangenpai: "三元牌",
};

/** ライブラリの待ちの種類から {@link FuMachiKey} への対応（符が付く待ちだけ） */
const MACHI_KEYS: Readonly<Record<string, FuMachiKey>> = {
  Tanki: "tanki",
  Kanchan: "kanchan",
  Penchan: "penchan",
};

/** 符が付く待ち形の日本語ラベル */
const MACHI_LABELS: Readonly<Record<FuMachiKey, string>> = {
  tanki: "単騎待ち",
  kanchan: "嵌張待ち",
  penchan: "辺張待ち",
  other: "待ち",
};

/**
 * 符の理由の日本語の文言
 * 符理由日本語表記
 *
 * {@link FuDetail.reason} はすべてここから組む（「副底」「么九牌暗刻子」
 * 「雀頭(場風・自風)」「嵌張待ち」…）。この文字列はモバイルの表示と保存済みの
 * 内訳がそのまま読む契約なので変えない（`fu-calculator.test.ts` が固定する）。
 * 辞書の ja の `challenge.fuBreakdown.reasons.*` も同じ文字列を返すように
 * 書いてあり、features の `fu-reason-label.test.ts` が一致を固定する。
 *
 * @param spec - 符の理由の構造
 */
export function formatFuReasonJa(spec: FuReasonSpec): string {
  switch (spec.kind) {
    case "futei":
      return "副底";
    case "chiitoitsu":
      return "七対子";
    case "pinfuTsumo":
      return "平和ツモ";
    case "tsumo":
      return "ツモ";
    case "menzenRon":
      return "門前加符";
    case "kuiPinfu":
      return "特例等の加符";
    case "mentsu":
      return `${yaochuLabel(spec.yaochu)}${openLabel(spec.open)}${spec.kantsu ? "槓子" : "刻子"}`;
    case "jantou":
      return `雀頭(${spec.reasons.map((key) => JANTOU_REASON_LABELS[key]).join("・")})`;
    case "machi":
      return MACHI_LABELS[spec.machi];
  }
}

/**
 * 符計算の内訳詳細
 * 符内訳
 */
export interface FuDetail {
  /**
   * 理由の日本語の文言（例: 副底, 中張牌暗刻子 等）
   *
   * `spec` を持つ行では {@link formatFuReasonJa}(spec) と一致する。
   */
  readonly reason: string;
  /** 符数 */
  readonly fu: number;
  /**
   * 理由の構造。描く側が言語ごとの文言にする
   *
   * core が組む内訳（{@link convertScoreDetailToFuDetails}）は必ず持つ。
   * 省略可能なのは、この項目を足す前に保存された内訳（sessionStorage・DB に
   * 残る `reason` と `fu` だけの行）も同じ型で読むため。持たない行は
   * `reason`（日本語）をそのまま描く（features の `fuReasonLabel`）。
   */
  readonly spec?: FuReasonSpec;
}

/** 構造から内訳の 1 行を組む（`reason` は構造から組んだ日本語の文言） */
function fuDetailOf(spec: FuReasonSpec, fu: number): FuDetail {
  return { reason: formatFuReasonJa(spec), fu, spec };
}

/** 面子手の構造（面子符・雀頭符の内訳はここからしか復元できない） */
type MentsuHandStructure = Extract<
  ScoreDetail["structure"],
  { readonly type: "Mentsu" }
>;

/**
 * 内訳が定型で決まる手（七対子・国士無双・平和ツモ）の内訳。該当しなければ undefined
 * 特例の符内訳
 */
function specialFuDetails(
  detail: Readonly<ScoreDetail>,
  isTsumo: boolean,
): FuDetail[] | undefined {
  const { fuResult, structure } = detail;
  if (structure.type === "Chiitoitsu") {
    return [fuDetailOf({ kind: "chiitoitsu" }, 25)];
  }
  // 国士無双（便宜上）
  if (structure.type === "Kokushi") {
    return [fuDetailOf({ kind: "futei" }, FUTEI_FU)];
  }
  // 平和ツモの特例（符合計が20符の場合）
  if (fuResult.total === FUTEI_FU && isTsumo) {
    return [fuDetailOf({ kind: "pinfuTsumo" }, FUTEI_FU)];
  }
  return undefined;
}

/** 和了符（ツモ / 門前加符）。付かなければ undefined */
function agariFuDetail(agari: number, isTsumo: boolean): FuDetail | undefined {
  if (agari <= 0) return undefined;
  return fuDetailOf({ kind: isTsumo ? "tsumo" : "menzenRon" }, agari);
}

/**
 * 面子符（個別の面子の内訳を構造から復元する）
 * 面子符内訳
 *
 * 明暗の判定はライブラリの符計算ロジックと同一で、置き場所から引く
 * （{@link isOpenMentsuAt}）。
 */
function mentsuFuDetails(
  structure: MentsuHandStructure,
  isTsumo: boolean,
): FuDetail[] {
  const details: FuDetail[] = [];
  for (const [index, mentsu] of structure.fourMentsu.entries()) {
    if (mentsu.type === MentsuType.Shuntsu) continue;
    const isYao = isYaochu(mentsu.hais[0]);
    const isOpen = isOpenMentsuAt(structure, index, isTsumo);
    const isKantsu = mentsu.type === MentsuType.Kantsu;
    const fu = calculateMentsuFu({ isKantsu, isOpen, isYaochu: isYao });
    details.push(
      fuDetailOf(
        { kind: "mentsu", yaochu: isYao, open: isOpen, kantsu: isKantsu },
        fu,
      ),
    );
  }
  return details;
}

/** 雀頭符（役牌の理由を添える） */
function jantouFuDetail(
  structure: MentsuHandStructure,
  fu: number,
  bakaze: Kazehai,
  jikaze: Kazehai,
): FuDetail {
  const reasons = jantouFuReasons(structure.jantou.hais[0], bakaze, jikaze);
  return fuDetailOf(
    {
      kind: "jantou",
      reasons: reasons.map((reason) => JANTOU_REASON_KEYS[reason]),
    },
    fu,
  );
}

/** 待ち符。付かなければ undefined */
function machiFuDetail(
  machi: number,
  machiType: ScoreDetail["machiType"],
): FuDetail | undefined {
  if (machi <= 0) return undefined;
  const key = machiType !== undefined ? MACHI_KEYS[machiType] : undefined;
  return fuDetailOf({ kind: "machi", machi: key ?? "other" }, machi);
}

/**
 * ライブラリの ScoreDetail から表示用の FuDetail[] を構築する
 *
 * ライブラリが選択した最適構造の符内訳をそのまま使用するため、
 * answer.fu と fuDetails の合計が必ず一致する
 * 符内訳変換
 *
 * 和了牌の位置（どの面子を完成させたか）は `detail.structure.agari` が持つので
 * 引数には取らない。明暗はそこから引く（{@link isOpenMentsuAt}）。
 *
 * 各行は理由の構造（`spec`）と、そこから組んだ日本語の文言（`reason`）の両方を持つ。
 *
 * @param detail - ライブラリの ScoreDetail
 * @param config - 和了状況（ツモ/ロン、場風、自風）
 */
export function convertScoreDetailToFuDetails(
  detail: Readonly<ScoreDetail>,
  config: {
    readonly isTsumo: boolean;
    readonly bakaze: Kazehai;
    readonly jikaze: Kazehai;
  },
): FuDetail[] {
  const special = specialFuDetails(detail, config.isTsumo);
  if (special) return special;

  const { fuResult, structure, machiType } = detail;
  const { details } = fuResult;
  const mentsuHand = structure.type === "Mentsu" ? structure : undefined;

  const result: FuDetail[] = [
    fuDetailOf({ kind: "futei" }, details.base),
    ...optional(agariFuDetail(details.agari, config.isTsumo)),
    ...(details.mentsu > 0 && mentsuHand
      ? mentsuFuDetails(mentsuHand, config.isTsumo)
      : []),
    ...(details.jantou > 0 && mentsuHand
      ? [
          jantouFuDetail(
            mentsuHand,
            details.jantou,
            config.bakaze,
            config.jikaze,
          ),
        ]
      : []),
    ...optional(machiFuDetail(details.machi, machiType)),
  ];

  // 喰い平和の特例（合計20符を30符に切り上げ）
  const rawSum = result.reduce((acc, d) => acc + d.fu, 0);
  if (rawSum === FUTEI_FU && !config.isTsumo) {
    result.push(fuDetailOf({ kind: "kuiPinfu" }, FU_STEP));
  }

  return result;
}

/** 付かない内訳（undefined）を配列の展開で落とすための包み */
function optional(detail: FuDetail | undefined): readonly FuDetail[] {
  return detail === undefined ? [] : [detail];
}
