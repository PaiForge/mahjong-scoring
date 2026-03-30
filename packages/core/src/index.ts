export { generateJantouFuQuestion } from "./problem/jantou-fu/generator";
export type {
  JantouFuQuestion,
  JantouFuChoice,
} from "./problem/jantou-fu/types";
export { generateMachiFuQuestion } from "./problem/machi-fu/generator";
export type { MachiFuQuestion } from "./problem/machi-fu/types";
export { generateMentsuFuQuestion } from "./problem/mentsu-fu/generator";
export type { MentsuFuQuestion } from "./problem/mentsu-fu/types";
export { generateTehaiFuQuestion } from "./problem/tehai-fu/generator";
export type { TehaiFuQuestion, TehaiFuItem } from "./problem/tehai-fu/types";
export { KAZEHAI, SANGENHAI } from "./core/constants";
export { getKazeName } from "./core/hai-names";
export { randomChoice, shuffle } from "./core/random";
export { isHaiKindId } from "./core/type-guards";
export { HaiKind, MentsuType } from "@pai-forge/riichi-mahjong";
export type {
  HaiKindId,
  Kazehai,
  CompletedMentsu,
  Tehai14,
} from "@pai-forge/riichi-mahjong";
