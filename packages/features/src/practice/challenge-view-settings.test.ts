import { describe, expect, it } from "vitest";

import {
  PRACTICE_MENU_SLUGS,
  PRACTICE_SLUG,
  practiceMenuBySlug,
} from "../practice-menu-types";
import { rankRequiringMenu } from "../ranks/registry";
import { challengeViewSettings } from "./challenge-view-settings";

describe("challengeViewSettings", () => {
  it("名前空間・種別・ミス上限・制限時間はレジストリの値をそのまま返す", () => {
    for (const slug of PRACTICE_MENU_SLUGS) {
      const { namespace, menuType, mistakeLimit, timeLimit } =
        practiceMenuBySlug(slug);
      expect(challengeViewSettings(slug), slug).toMatchObject({
        namespace,
        menuType,
        mistakeLimit,
        timeLimit,
      });
    }
  });

  it("通常の練習は練習として扱い、終える正解数を持たない", () => {
    expect(challengeViewSettings(PRACTICE_SLUG.jantouFu)).toMatchObject({
      kind: "practice",
      goalCount: undefined,
    });
  });

  it("昇級試験は試験として扱い、合格点に届いたら終える", () => {
    const settings = challengeViewSettings(PRACTICE_SLUG.manganExam);
    const requirement = rankRequiringMenu(settings.menuType)?.requirement;
    expect(requirement).toBeDefined();
    expect(settings.kind).toBe("exam");
    expect(settings.goalCount).toBe(requirement?.minScore);
  });

  it("試験か練習かは /exam 配下に住むかで分かれ、合格点を持つのは試験だけ", () => {
    for (const slug of PRACTICE_MENU_SLUGS) {
      const settings = challengeViewSettings(slug);
      const isExam =
        !practiceMenuBySlug(slug).basePath.startsWith("/practice/");
      expect(settings.kind, slug).toBe(isExam ? "exam" : "practice");
      expect(settings.goalCount !== undefined, slug).toBe(isExam);
    }
  });
});
