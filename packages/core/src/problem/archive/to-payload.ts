import type { HaiKindId, Tehai } from "@pai-forge/riichi-mahjong";
import type { ScoreQuestion } from "../score/types";
import type { TenpaiScoreQuestion } from "../tenpai-score/types";
import { toArchivedMeld } from "./melds";
import type {
  AgariProblemPayload,
  ArchivedHand,
  ArchivedRiichi,
  TenpaiProblemPayload,
} from "./types";

/**
 * 手牌を保存用の形にする
 * 手牌保存変換
 *
 * 純手牌は理牌済みの並びのまま、副露は鳴いた順のまま写す。
 */
function toArchivedHand(tehai: Tehai): ArchivedHand {
  return {
    closed: [...tehai.closed],
    exposed: tehai.exposed.map(toArchivedMeld),
  };
}

/**
 * リーチを保存用の形にする
 * リーチ保存変換
 *
 * 裏ドラ表示牌を持つリーチだけをリーチとして写す。問題は「リーチしているなら
 * 裏ドラ表示牌を持つ」（生成器・`buildScoreQuestion` の約束）ので、片方だけの
 * 状態は起きない。
 */
function toArchivedRiichi(
  isRiichi: boolean,
  uraDoraMarkers: readonly HaiKindId[] | undefined,
): ArchivedRiichi {
  return isRiichi && uraDoraMarkers
    ? { uraDoraMarkers: [...uraDoraMarkers] }
    : null;
}

/**
 * 和了形の点数計算の問題を保存用の盤面にする
 * 和了形問題保存変換
 *
 * 盤面だけを写す。ルール設定・正解・役と符の内訳は写さない（読み戻すときに
 * 閲覧者のルールで採点し直す）。
 */
export function toAgariProblemPayload(
  question: ScoreQuestion,
): AgariProblemPayload {
  return {
    hand: toArchivedHand(question.tehai),
    agariHai: question.agariHai,
    isTsumo: question.isTsumo,
    jikaze: question.jikaze,
    bakaze: question.bakaze,
    doraMarkers: [...question.doraMarkers],
    riichi: toArchivedRiichi(question.isRiichi, question.uraDoraMarkers),
  };
}

/**
 * 聴牌形の点数計算の問題を保存用の盤面にする
 * 聴牌形問題保存変換
 *
 * 問題のトップレベル（聴牌形と局面）だけを写す。待ちと待ちごとの出題は
 * 聴牌形から列挙し直せるので写さない。
 */
export function toTenpaiProblemPayload(
  question: TenpaiScoreQuestion,
): TenpaiProblemPayload {
  return {
    hand: toArchivedHand(question.tehai),
    jikaze: question.jikaze,
    bakaze: question.bakaze,
    doraMarkers: [...question.doraMarkers],
    riichi: toArchivedRiichi(question.isRiichi, question.uraDoraMarkers),
  };
}
