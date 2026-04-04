import type { MentsuFuQuestion } from "./types";
import {
  createRandomShuntsu,
  createRandomKoutsu,
  createRandomKantsu,
  type MentsuResult,
} from "./mentsu-factory";

function toQuestion(result: MentsuResult): MentsuFuQuestion {
  return { id: crypto.randomUUID(), mentsu: result.mentsu, answer: result.fu, explanation: result.explanation };
}

/**
 * 面子の符計算問題を生成する
 * 面子符問題ジェネレータ
 */
export function generateMentsuFuQuestion(): MentsuFuQuestion {
  const r = Math.random();

  // 20% 順子, 50% 刻子, 30% 槓子
  if (r < 0.2) {
    const result = createRandomShuntsu();
    if (result) {
      return toQuestion(result);
    }
    return toQuestion(createRandomKoutsu());
  }

  if (r < 0.7) {
    return toQuestion(createRandomKoutsu());
  }

  return toQuestion(createRandomKantsu());
}
