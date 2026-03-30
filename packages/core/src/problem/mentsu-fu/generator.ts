import type { MentsuFuQuestion } from "./types";
import {
  createRandomShuntsu,
  createRandomKoutsu,
  createRandomKantsu,
} from "./mentsu-factory";

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
      return {
        id: crypto.randomUUID(),
        mentsu: result.mentsu,
        answer: result.fu,
        explanation: result.explanation,
      };
    }
    const koutsu = createRandomKoutsu();
    return {
      id: crypto.randomUUID(),
      mentsu: koutsu.mentsu,
      answer: koutsu.fu,
      explanation: koutsu.explanation,
    };
  }

  if (r < 0.7) {
    const koutsu = createRandomKoutsu();
    return {
      id: crypto.randomUUID(),
      mentsu: koutsu.mentsu,
      answer: koutsu.fu,
      explanation: koutsu.explanation,
    };
  }

  const kantsu = createRandomKantsu();
  return {
    id: crypto.randomUUID(),
    mentsu: kantsu.mentsu,
    answer: kantsu.fu,
    explanation: kantsu.explanation,
  };
}
