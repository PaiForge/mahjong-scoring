import {
  MentsuType,
  isYaochu,
  type Kazehai,
  type ScoreDetail,
} from "@pai-forge/riichi-mahjong";
import { calculateMentsuFu, isOpenMentsuAt } from "../core/score-calculation";
import { jantouFuReasons } from "../problem/shared/jantou-fu";
import { FU_STEP, FUTEI_FU } from "./mentsu-tehai-fu";
import { openLabel, yaochuLabel } from "../problem/shared/mentsu-labels";

/** 符が付く待ち形の日本語ラベル */
const MACHI_LABELS: Readonly<Record<string, string>> = {
  Tanki: "単騎待ち",
  Kanchan: "嵌張待ち",
  Penchan: "辺張待ち",
};

/**
 * 符計算の内訳詳細
 * 符内訳
 */
export interface FuDetail {
  /** 理由（例: 副底, 中張牌 暗刻 等） */
  readonly reason: string;
  /** 符数 */
  readonly fu: number;
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
  if (structure.type === "Chiitoitsu") return [{ reason: "七対子", fu: 25 }];
  // 国士無双（便宜上）
  if (structure.type === "Kokushi") return [{ reason: "副底", fu: FUTEI_FU }];
  // 平和ツモの特例（符合計が20符の場合）
  if (fuResult.total === FUTEI_FU && isTsumo) {
    return [{ reason: "平和ツモ", fu: FUTEI_FU }];
  }
  return undefined;
}

/** 和了符（ツモ / 門前加符）。付かなければ undefined */
function agariFuDetail(agari: number, isTsumo: boolean): FuDetail | undefined {
  if (agari <= 0) return undefined;
  return isTsumo
    ? { reason: "ツモ", fu: agari }
    : { reason: "門前加符", fu: agari };
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
    const fu = calculateMentsuFu({
      isKantsu: mentsu.type === MentsuType.Kantsu,
      isOpen,
      isYaochu: isYao,
    });
    const typeLabel = mentsu.type === MentsuType.Kantsu ? "槓子" : "刻子";
    details.push({
      reason: `${yaochuLabel(isYao)}${openLabel(isOpen)}${typeLabel}`,
      fu,
    });
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
  return { reason: `雀頭(${reasons.join("・")})`, fu };
}

/** 待ち符。付かなければ undefined */
function machiFuDetail(
  machi: number,
  machiType: ScoreDetail["machiType"],
): FuDetail | undefined {
  if (machi <= 0) return undefined;
  const machiLabel =
    machiType !== undefined ? MACHI_LABELS[machiType] : undefined;
  return { reason: machiLabel ?? "待ち", fu: machi };
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
    { reason: "副底", fu: details.base },
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
    result.push({ reason: "特例等の加符", fu: FU_STEP });
  }

  return result;
}

/** 付かない内訳（undefined）を配列の展開で落とすための包み */
function optional(detail: FuDetail | undefined): readonly FuDetail[] {
  return detail === undefined ? [] : [detail];
}
