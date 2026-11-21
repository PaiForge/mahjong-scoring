import { describe, expect, it } from "vitest";

import { isDailyAnswerSaveProblem } from "./save-status";

describe("isDailyAnswerSaveProblem", () => {
  it.each(["failed", "staleDay", "anonymous", "blocked"] as const)(
    "記録できなかった状態（%s）は知らせる",
    (status) => {
      expect(isDailyAnswerSaveProblem(status)).toBe(true);
    },
  );

  it.each(["idle", "saving", "saved"] as const)(
    "うまくいっている状態（%s）は知らせない",
    (status) => {
      expect(isDailyAnswerSaveProblem(status)).toBe(false);
    },
  );
});
