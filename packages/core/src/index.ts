// === Problem: Jantou Fu ===
export { generateJantouFuQuestion } from "./problem/jantou-fu/generator";
export type {
  JantouFuQuestion,
  JantouFuChoice,
} from "./problem/jantou-fu/types";

// === Problem: Machi Fu ===
export { generateMachiFuQuestion } from "./problem/machi-fu/generator";
export type { MachiFuQuestion } from "./problem/machi-fu/types";

// === Problem: Mentsu Fu ===
export { generateMentsuFuQuestion } from "./problem/mentsu-fu/generator";
export type { MentsuFuQuestion } from "./problem/mentsu-fu/types";

// === Problem: Tehai Fu ===
export { generateTehaiFuQuestion } from "./problem/tehai-fu/generator";
export type { TehaiFuQuestion, TehaiFuItem } from "./problem/tehai-fu/types";

// === Problem: Yaku ===
export { generateYakuQuestion } from "./problem/yaku/generator";
export { judgeYakuAnswer } from "./problem/yaku/judgement";
export { SELECTABLE_YAKU } from "./problem/yaku/constants";
export type { YakuQuestion } from "./problem/yaku/types";

// === Problem: Score ===
export { ScoreQuestionGenerator, generateScoreQuestion, generateValidScoreQuestion } from "./problem/score/generator";
export { judgeAnswer, isMangan, getScoreLevelName } from "./problem/score/judgement";
export {
  generateQuestionFromQuery,
  generatePathAndQueryFromQuestion,
  buildDrillQueryParams,
} from "./problem/score/query-generator";
export type {
  ScoreQuestion,
  UserAnswer,
  JudgementResult,
  QuestionGeneratorOptions,
  YakuDetail,
} from "./problem/score/types";
export type { QueryResult } from "./problem/score/query-generator";

// === Score ===
export { recalculateScore } from "./score/calculator";
export { convertScoreDetailToFuDetails } from "./score/fu-calculator";
export type { FuDetail } from "./score/fu-calculator";
export {
  RON_SCORES_KO,
  RON_SCORES_OYA,
  TSUMO_SCORES_OYA_PART,
  TSUMO_SCORES_KO_PART,
} from "./score/constants";

// === Core ===
export {
  KAZEHAI,
  SANGENHAI,
  SUIT_BASES,
  ScoreLevel,
  SCORE_YAKU_NAME_MAP,
  getYakuNameJa,
  IGNORE_YAKU_FOR_JUDGEMENT,
  YAKU_OPTIONS,
} from "./core/constants";
export {
  getKazeName,
  getHaiName,
  getDoraFromIndicator,
  countDoraInTehai,
  getKeyForKazehai,
} from "./core/hai-names";
export { randomChoice, shuffle, randomInt } from "./core/random";
export {
  calculateBasePoints,
  calculateKoScore,
  calculateOyaScore,
  isInvalidCell,
  HIGH_SCORES,
} from "./core/score-calculation";
export { isHaiKindId, validateHaiKindId } from "./core/type-guards";
export { HaiUsageTracker } from "./core/hai-tracker";

// === Problem: Score Table Drill ===
export { generateScoreTableQuestion } from "./problem/score-table/generator";
export { judgeScoreTableAnswer } from "./problem/score-table/judgement";
export type {
  ScoreTableQuestion,
  ScoreTableAnswer,
  ScoreTableUserAnswer,
  ScoreTableGeneratorOptions,
  RonAnswer,
  OyaTsumoAnswer,
  KoTsumoAnswer,
} from "./problem/score-table/types";

// === EXP ===
export { calculateExp, getExpForLevel, getLevel, getLevelProgress } from "./exp";
export {
  EXP_CURVE,
  MIN_COMPLETION_EXP,
  MISS_BONUS,
  MODULE_WEIGHT,
} from "./exp";
export type { ExpInfo, ExpInput, ExpResult, LevelProgress } from "./exp";

// === Re-exports from @pai-forge/riichi-mahjong ===
export { HaiKind, MentsuType } from "@pai-forge/riichi-mahjong";
export type {
  HaiKindId,
  Kazehai,
  CompletedMentsu,
  Tehai14,
  ScoreResult,
  Payment,
} from "@pai-forge/riichi-mahjong";
