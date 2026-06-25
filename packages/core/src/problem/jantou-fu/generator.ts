import { HaiKind, type HaiKindId } from "@pai-forge/riichi-mahjong";
import type { JantouFuQuestion } from "./types";
import { getKazeName } from "../../core/hai-names";
import { randomChoice, shuffle } from "../../core/random";
import { KAZEHAI, SANGENHAI } from "../../core/constants";
import { isHaiKindId } from "../../core/type-guards";

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
 */
export function generateJantouFuQuestion(
  options: { readonly renfonpaiAs4Fu?: boolean } = {},
): JantouFuQuestion {
  const { renfonpaiAs4Fu = false } = options;
  const bakaze = randomChoice(KAZEHAI);
  const jikaze = randomChoice(KAZEHAI);

  // 正解候補（2符 or 連風牌で4符）
  const correctCandidates: {
    hai: HaiKindId;
    fu: number;
    explanation: string;
  }[] = SANGENHAI.map((hai) => ({
    hai,
    fu: 2,
    explanation:
      hai === HaiKind.Haku
        ? "役牌（白）"
        : hai === HaiKind.Hatsu
          ? "役牌（發）"
          : "役牌（中）",
  }));

  if (bakaze === jikaze) {
    correctCandidates.push({
      hai: bakaze,
      fu: renfonpaiAs4Fu ? 4 : 2,
      explanation: `連風牌（${getKazeName(bakaze)}）`,
    });
  } else {
    correctCandidates.push({
      hai: bakaze,
      fu: 2,
      explanation: `場風（${getKazeName(bakaze)}）`,
    });
    correctCandidates.push({
      hai: jikaze,
      fu: 2,
      explanation: `自風（${getKazeName(jikaze)}）`,
    });
  }

  const correct = randomChoice(correctCandidates);

  // 不正解候補（0符）
  const incorrectCandidates: { hai: HaiKindId; explanation: string }[] = [];

  for (const kaze of KAZEHAI) {
    if (kaze !== bakaze && kaze !== jikaze) {
      incorrectCandidates.push({
        hai: kaze,
        explanation: `オタ風（${getKazeName(kaze)}）`,
      });
    }
  }

  const shuffledNumbers = shuffle(NUMBER_TILES);
  for (let i = 0; i < 10; i++) {
    incorrectCandidates.push({ hai: shuffledNumbers[i], explanation: "数牌" });
  }

  const selectedIncorrect = shuffle(incorrectCandidates).slice(0, 3);

  const choices = shuffle([
    {
      hai: correct.hai,
      isCorrect: true,
      fu: correct.fu,
      explanation: correct.explanation,
    },
    ...selectedIncorrect.map((c) => ({
      hai: c.hai,
      isCorrect: false,
      fu: 0,
      explanation: c.explanation,
    })),
  ]);

  return {
    id: crypto.randomUUID(),
    context: { bakaze, jikaze },
    choices,
  };
}
