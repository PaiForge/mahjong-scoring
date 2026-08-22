import { HaiKind, type HaiKindId } from "@pai-forge/riichi-mahjong";
import type { JantouFuQuestion } from "./types";
import { randomChoice, shuffle } from "../../core/random";
import { BAKAZE_OPTIONS, KAZEHAI, SANGENHAI } from "../../core/constants";
import { isHaiKindId } from "../../core/type-guards";
import { calculateJantouFu } from "../shared/jantou-fu";
import { defaultIdGenerator, type IdGenerator } from "../../core/id";

/**
 * 数牌の牌種ID一覧（雀頭不正解候補用）
 * 数牌プール
 */
const NUMBER_TILES: readonly HaiKindId[] = Array.from(
  { length: HaiKind.SouZu9 + 1 },
  (_, i) => i,
).filter(isHaiKindId);

/**
 * 雀頭の符計算問題を生成する
 * 雀頭符問題ジェネレータ
 *
 * 正解: 役牌（三元牌・場風・自風）の雀頭 → 2符
 *       （連風牌は renfonpaiAs4Fu=true のとき4符、既定2符）
 * 不正解: オタ風・数牌の雀頭 → 0符
 *
 * @param options.renfonpaiAs4Fu - 連風牌の雀頭を4符として扱うか（既定 false=2符）
 * @param options.idGen - 問題 ID の採番（既定 crypto.randomUUID）
 */
export function generateJantouFuQuestion(
  options: {
    readonly renfonpaiAs4Fu?: boolean;
    readonly idGen?: IdGenerator;
  } = {},
): JantouFuQuestion {
  const { renfonpaiAs4Fu = false, idGen = defaultIdGenerator } = options;
  const bakaze = randomChoice(BAKAZE_OPTIONS);
  const jikaze = randomChoice(KAZEHAI);

  // 符の値は calculateJantouFu（雀頭符ルールの唯一の定義）から引く。
  // このジェネレータが持つのは候補の列挙だけ。
  const fuOf = (hai: HaiKindId): number =>
    calculateJantouFu(hai, bakaze, jikaze, renfonpaiAs4Fu);

  // 正解候補（2符 or 連風牌で4符）。連風牌のときは場風＝自風なので1枚だけ。
  const correctCandidates: readonly HaiKindId[] = [
    ...SANGENHAI,
    ...(bakaze === jikaze ? [bakaze] : [bakaze, jikaze]),
  ];

  const correct = randomChoice(correctCandidates);

  // 不正解候補（0符）: オタ風と数牌
  const incorrectCandidates: HaiKindId[] = KAZEHAI.filter(
    (kaze) => kaze !== bakaze && kaze !== jikaze,
  );
  incorrectCandidates.push(...shuffle(NUMBER_TILES).slice(0, 10));

  const selectedIncorrect = shuffle(incorrectCandidates).slice(0, 3);

  const choices = shuffle([
    { hai: correct, isCorrect: true, fu: fuOf(correct) },
    ...selectedIncorrect.map((hai) => ({
      hai,
      isCorrect: false,
      fu: fuOf(hai),
    })),
  ]);

  return {
    id: idGen(),
    context: { bakaze, jikaze },
    choices,
  };
}
