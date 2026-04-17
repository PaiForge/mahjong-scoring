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

// === Problem: Shared ===
export { retryGenerate } from "./problem/retry-generate";

// === Problem: Score ===
export { generateValidScoreQuestion } from "./problem/score/generator";
export { judgeAnswer, isMangan, getScoreLevelName } from "./problem/score/judgement";
export type {
  ScoreQuestion,
  UserAnswer,
  JudgementResult,
  QuestionGeneratorOptions,
  YakuDetail,
} from "./problem/score/types";

// === Score ===
export {
  RON_SCORES_KO,
  RON_SCORES_OYA,
  TSUMO_SCORES_OYA_PART,
  TSUMO_SCORES_KO_PART,
} from "./score/constants";

// === Core ===
export {
  YAKU_OPTIONS,
} from "./core/constants";
export {
  getKazeName,
  getDoraFromIndicator,
} from "./core/hai-names";
export {
  calculateKoScore,
  calculateOyaScore,
  isInvalidCell,
  HIGH_SCORES,
} from "./core/score-calculation";

// === Problem: Score Table Practice ===
export { generateScoreTableQuestion } from "./problem/score-table/generator";
export { judgeScoreTableAnswer } from "./problem/score-table/judgement";
export type {
  ScoreTableQuestion,
  ScoreTableAnswer,
  ScoreTableUserAnswer,
} from "./problem/score-table/types";

// === EXP ===
export { calculateExp, getLevel, getLevelProgress } from "./exp";
export type { ExpInfo } from "./exp";

// === Re-exports from @pai-forge/riichi-mahjong ===
export { HaiKind, MentsuType } from "@pai-forge/riichi-mahjong";
export type {
  HaiKindId,
  Kazehai,
  Tehai14,
  Payment,
} from "@pai-forge/riichi-mahjong";
