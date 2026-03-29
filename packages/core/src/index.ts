export { generateJantouFuQuestion } from "./problem/jantou-fu/generator";
export type {
  JantouFuQuestion,
  JantouFuChoice,
} from "./problem/jantou-fu/types";
export { KAZEHAI, SANGENHAI } from "./core/constants";
export { getKazeName } from "./core/hai-names";
export { randomChoice, shuffle } from "./core/random";
export { isHaiKindId } from "./core/type-guards";
export { HaiKind } from "@pai-forge/riichi-mahjong";
export type { HaiKindId, Kazehai } from "@pai-forge/riichi-mahjong";
