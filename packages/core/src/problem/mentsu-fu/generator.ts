import type { MentsuFuQuestion } from "./types";
import { defaultIdGenerator, type IdGenerator } from "../../core/id";
import { createRandomMentsu, type MentsuWeights } from "./mentsu-factory";

/** 面子符練習の出題重み（20% 順子, 50% 刻子, 残り30% 槓子） */
const MENTSU_FU_WEIGHTS: MentsuWeights = { shuntsu: 0.2, koutsu: 0.5 };

/**
 * 面子の符計算問題を生成する
 * 面子符問題ジェネレータ
 */
export function generateMentsuFuQuestion(
  idGen: IdGenerator = defaultIdGenerator,
): MentsuFuQuestion {
  const result = createRandomMentsu(MENTSU_FU_WEIGHTS);
  return {
    id: idGen(),
    mentsu: result.mentsu,
    answer: result.fu,
    explanation: result.explanation,
  };
}
