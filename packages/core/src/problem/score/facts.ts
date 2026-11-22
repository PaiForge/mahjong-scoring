import { isMenzen } from "@pai-forge/riichi-mahjong";
import type {
  HaiKindId,
  Kazehai,
  MachiType,
  Payment,
} from "@pai-forge/riichi-mahjong";

import { isOya } from "../../core/kaze";
import { scoreYakuIdOfName, type ScoreYakuId } from "../../core/yaku-names";
import { countKantsu } from "../shared/count-kantsu";
import type { ScoreQuestion } from "./types";

/** 内訳に出る表ドラ・裏ドラの名前（`build-question.ts` / `utils/reconciler.ts` が足す語彙） */
const DORA_NAME = "ドラ";
const URA_DORA_NAME = "裏ドラ";

/**
 * 和了 1 つの正解（保存・比較に使う形）
 * 正解の事実
 *
 * 役は永続化用の役 ID で持ち、ドラ・裏ドラは役に含めず翻だけを別に持つ。
 */
export interface ScoreAnswerFacts {
  readonly han: number;
  readonly fu: number;
  readonly scoreLevel: string;
  readonly yakumanMultiplier: number;
  readonly payment: Payment;
  readonly yaku: readonly { readonly id: ScoreYakuId; readonly han: number }[];
  readonly doraHan: number;
  readonly uraDoraHan: number;
}

/**
 * 和了 1 つの分類用の属性
 * 分類属性
 */
export interface ScoreFacets {
  readonly isTsumo: boolean;
  readonly isOya: boolean;
  readonly isMenzen: boolean;
  readonly isRiichi: boolean;
  readonly kanCount: number;
  readonly jikaze: Kazehai;
  readonly bakaze: Kazehai;
  readonly agariHai: HaiKindId;
  /** 採用された解釈の待ちの形。七対子・国士無双は null */
  readonly machi: MachiType | null;
}

/**
 * 和了 1 つの正解と属性
 * 和了の事実
 */
export interface ScoreFacts {
  readonly answer: ScoreAnswerFacts;
  readonly facets: ScoreFacets;
}

/**
 * 組み立てた問題から、保存・分類に使う正解と属性を取り出す
 * 正解属性取り出し
 *
 * @description
 * 選出時のスナップショット・受付時の正解との比較・属性の表が同じ値を持つよう、
 * 取り出しをこの 1 関数に置く。乱数にも IO にも触れない。取り出し方を変える
 * コミットは `SCORING_VERSION` も上げる（保存済みの値と意味がずれるため）。
 *
 * 役 ID に対応しない内訳名（ライブラリが未知の役名を返した）が 1 つでもあれば
 * undefined を返す。名前のまま保存すると、後から読めない値が永続化される。
 *
 * @param question - `buildScoreQuestion` / `rebuildAgariQuestion` が組み立てた問題
 * @returns 正解と属性。役 ID に写せない内訳があれば undefined
 */
export function extractScoreFacts(
  question: Readonly<ScoreQuestion>,
): ScoreFacts | undefined {
  const yaku: { id: ScoreYakuId; han: number }[] = [];
  let doraHan = 0;
  let uraDoraHan = 0;
  for (const { name, han } of question.yakuDetails) {
    if (name === DORA_NAME) doraHan += han;
    else if (name === URA_DORA_NAME) uraDoraHan += han;
    else {
      const id = scoreYakuIdOfName(name);
      if (id === undefined) return undefined;
      yaku.push({ id, han });
    }
  }
  const { answer, tehai } = question;
  return {
    answer: {
      han: answer.han,
      fu: answer.fu,
      scoreLevel: answer.scoreLevel,
      yakumanMultiplier: answer.yakumanMultiplier,
      payment: answer.payment,
      yaku,
      doraHan,
      uraDoraHan,
    },
    facets: {
      isTsumo: question.isTsumo,
      isOya: isOya(question.jikaze),
      isMenzen: isMenzen(tehai),
      isRiichi: question.isRiichi,
      kanCount: countKantsu(tehai),
      jikaze: question.jikaze,
      bakaze: question.bakaze,
      agariHai: question.agariHai,
      machi: question.machiType ?? null,
    },
  };
}
