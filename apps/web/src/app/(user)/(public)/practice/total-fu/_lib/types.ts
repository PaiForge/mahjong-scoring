import { resultStorageKeyFor } from "@/lib/db/practice-menu-types";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor("total-fu");

export type { FuQuestionResult as TotalFuQuestionResult } from "../../_lib/fu-question-result";
export {
  toFuQuestionResult,
  parseFuQuestionResults,
} from "../../_lib/fu-question-result";
