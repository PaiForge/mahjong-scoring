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

// === Problem: Total Fu ===
export { generateTotalFuQuestion } from "./problem/total-fu/generator";
export type { TotalFuQuestion } from "./problem/total-fu/types";
export type { FuDetail } from "./score/fu-calculator";

// === Problem: Yaku ===
export { generateYakuQuestion } from "./problem/yaku/generator";
export { judgeYakuAnswer } from "./problem/yaku/judgement";
export {
  SELECTABLE_YAKU,
  SELECTABLE_YAKU_GROUPS,
} from "./problem/yaku/constants";
export type { YakuQuestion } from "./problem/yaku/types";

// === Problem: Yaku Han ===
export { generateYakuHanQuestion } from "./problem/yaku-han/generator";
export {
  YAKU_HAN_ENTRIES,
  YAKUMAN_HAN,
  groupYakuHanEntriesByMenzenHan,
  DEFAULT_YAKU_HAN_RANGE,
  getYakuHanEntries,
  normalizeYakuHanRange,
} from "./problem/yaku-han/constants";
export type { YakuHanRange } from "./problem/yaku-han/constants";
export type { YakuHanQuestion, YakuHanEntry } from "./problem/yaku-han/types";

// === Problem: Shared ===
export { retryGenerate } from "./problem/retry-generate";
export type { KazeContext, AgariContext } from "./problem/shared/agari-context";
export { defaultIdGenerator } from "./core/id";
export type { IdGenerator } from "./core/id";

// === Problem: Score ===
export { generateValidScoreQuestion } from "./problem/score/generator";
export { judgeAnswer } from "./problem/score/judgement";
export {
  isMangan,
  getScoreLevelName,
  scoreTierForHan,
  hanRangeOf,
  DISPLAY_TIERS,
  MANGAN_MIN_HAN,
  MANGAN_PLUS_TIERS,
} from "./score/tiers";
export type { HanTier, HanRange } from "./score/tiers";
export type {
  ScoreQuestion,
  UserAnswer,
  JudgementResult,
  QuestionGeneratorOptions,
  ScoreRange,
  YakuDetail,
} from "./problem/score/types";
export {
  parseTehai,
  parseHais,
  parseKazehai,
  haiIdToMspz,
  kazeIdToMspz,
  tehaiToMspz,
} from "./problem/score/mspz-serializer";

// === Score ===
export {
  FU_VALUES,
  RON_SCORES_KO,
  RON_SCORES_OYA,
  TSUMO_SCORES_OYA_PART,
  TSUMO_SCORES_KO_PART,
} from "./score/constants";

// === Core ===
export { YAKU_OPTIONS } from "./core/yaku-names";
export { getKazeName, isOya } from "./core/kaze";
export { getDoraFromIndicator } from "./core/dora";
export {
  calculateKoScore,
  calculateOyaScore,
  koScoreFromBasePoints,
  oyaScoreFromBasePoints,
  MANGAN_BASE_POINTS,
  isInvalidCell,
  HIGH_SCORES,
} from "./core/score-calculation";
export type { TsumoPayment } from "./core/score-calculation";

// === Problem: Score Table Practice ===
export { generateScoreTableQuestion } from "./problem/score-table/generator";
export { judgeScoreTableAnswer } from "./problem/score-table/judgement";
export type {
  ScoreTableQuestion,
  ScoreTableAnswer,
  ScoreTableUserAnswer,
  ScoreTableGeneratorOptions,
} from "./problem/score-table/types";

// === Core: 立場・和了方法 ===
export { isRole, isWinType } from "./core/roles";
export type { Role, WinType } from "./core/roles";

// === Challenge ===
export { CHALLENGE_TIME_LIMIT, MISTAKE_LIMIT } from "./challenge/constants";

// === EXP ===
export { calculateExp, getLevel, getLevelProgress } from "./exp";
export type { ExpInfo } from "./exp";

// === Rules ===
export { DEFAULT_RULE_SETTINGS } from "./rules/settings";
export type { RuleSettings } from "./rules/settings";

// === Re-exports from @pai-forge/riichi-mahjong ===
export { HaiKind, MentsuType } from "@pai-forge/riichi-mahjong";
export { validateTehai14 } from "@pai-forge/riichi-mahjong";
export type {
  Fu,
  HaiKindId,
  Kazehai,
  Tehai,
  Tehai14,
  CompletedMentsu,
  Payment,
} from "@pai-forge/riichi-mahjong";
