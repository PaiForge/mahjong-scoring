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
export { generateMentsuJantouFuQuestion } from "./problem/mentsu-jantou-fu/generator";
export type {
  MentsuJantouFuQuestion,
  MentsuJantouFuItem,
} from "./problem/mentsu-jantou-fu/types";

// === Problem: Total Fu ===
export { generateTotalFuQuestion } from "./problem/total-fu/generator";
export type { TotalFuQuestion } from "./problem/total-fu/types";
export type { FuDetail } from "./score/fu-calculator";

// === Problem: Yaku ===
export { generateYakuQuestion } from "./problem/yaku/generator";
export { judgeYakuAnswer } from "./problem/yaku/judgement";
export {
  SELECTABLE_YAKU,
  YAKU_DEFAULT_ORDER,
  normalizeYakuOrder,
} from "./problem/yaku/constants";
export type { YakuQuestion } from "./problem/yaku/types";

// === Problem: Yaku Han ===
export { generateYakuHanQuestion } from "./problem/yaku-han/generator";
export {
  YAKU_HAN_ENTRIES,
  YAKUMAN_HAN,
  YAKUHAI_ENTRY_NAME,
  groupYakuHanEntriesByMenzenHan,
  DEFAULT_YAKU_HAN_RANGE,
  getYakuHanEntries,
  isKuisagariEntry,
  normalizeYakuHanRange,
} from "./problem/yaku-han/constants";
export type { YakuHanRange } from "./problem/yaku-han/constants";
export type { YakuHanQuestion, YakuHanEntry } from "./problem/yaku-han/types";

// === Problem: Shared ===
export { retryGenerate } from "./problem/retry-generate";
export type { KazeContext, AgariContext } from "./problem/shared/agari-context";
export { defaultIdGenerator } from "./core/id";
export type { IdGenerator } from "./core/id";
export { defaultRandomSource, mulberry32 } from "./core/random";
export type { RandomSource } from "./core/random";

// === Problem: Score ===
export { generateValidScoreQuestion } from "./problem/score/generator";
export { SCORE_FILTERABLE_YAKU } from "./problem/score/filterable-yaku";
export {
  judgeAnswer,
  judgeYakuName,
  judgeYakuSelection,
} from "./problem/score/judgement";
export {
  clampHanToYakuman,
  isMangan,
  getScoreLevelName,
  scoreTierForHan,
  hanRangeOf,
  DISPLAY_TIERS,
  MANGAN_MIN_HAN,
  MANGAN_PLUS_TIERS,
} from "./score/tiers";
export type { HanTier, HanRange } from "./score/tiers";
export {
  mentsuTehaiFu,
  FUTEI_FU,
  TSUMO_AGARI_FU,
  MENZEN_RON_AGARI_FU,
} from "./score/mentsu-tehai-fu";
export { resolveMentsuBreakdown } from "./score/mentsu-structure";
export type {
  MentsuBreakdown,
  MentsuBreakdownRow,
  JantouBreakdownRow,
} from "./score/mentsu-structure";
export type {
  ScoreQuestion,
  UserAnswer,
  JudgementResult,
  QuestionGeneratorOptions,
  ScoreRange,
  YakuDetail,
  YakuSelectionState,
  YakuSelectionJudgement,
} from "./problem/score/types";
export {
  parseTehai,
  parseHais,
  parseKazehai,
  haiIdToMspz,
  haisToMspz,
  kazeIdToMspz,
  tehaiToMspz,
} from "./problem/score/mspz-serializer";

// === Score ===
export {
  FU_VALUES,
  isFu,
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
  calculateBasePoints,
  ceilTo100,
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
export { isRole, isWinType, paymentKindOf } from "./core/roles";
export type { PaymentKind, Role, WinType } from "./core/roles";

// === Challenge ===
export { CHALLENGE_TIME_LIMIT, MISTAKE_LIMIT } from "./challenge/constants";

// === EXP ===
export { calculateExp, getLevel, getLevelProgress } from "./exp";
export type { ExpInfo } from "./exp";

// === Rules ===
export {
  DEFAULT_RULE_SETTINGS,
  ALL_YAKUMAN_RULES_ENABLED,
  toYakumanRuleConfig,
  allowsDoubleYakuman,
} from "./rules/settings";
export type { RuleSettings, YakumanRuleSettings } from "./rules/settings";

// === Re-exports from @pai-forge/riichi-mahjong ===
export {
  HaiKind,
  MentsuType,
  FuroType,
  Tacha,
} from "@pai-forge/riichi-mahjong";
export { validateTehai14 } from "@pai-forge/riichi-mahjong";
export type {
  Fu,
  Furo,
  HaiKindId,
  Kazehai,
  Tehai,
  Tehai14,
  CompletedMentsu,
  Payment,
  YakumanRuleConfig,
} from "@pai-forge/riichi-mahjong";
