import { describe, expect, it } from "vitest";

import {
  BENEFIT_GRANT_BODY_MAX_LENGTH,
  BENEFIT_GRANT_TITLE_MAX_LENGTH,
} from "@mahjong-scoring/features/notifications/message";
import { messages } from "@mahjong-scoring/messages/ja";

import { GRANT_TEMPLATES } from "../grant-templates";

describe("GRANT_TEMPLATES", () => {
  const templates: Record<
    string,
    { label?: string; title?: string; body?: string } | undefined
  > = messages.admin.benefitGrants.templates;

  it.each(Object.keys(GRANT_TEMPLATES))(
    "%s は辞書に名前・タイトル・本文を持ち、そのまま送れる長さに収まる",
    (key) => {
      const text = templates[key];
      expect(text?.label).toBeTruthy();
      expect(text?.title).toBeTruthy();
      expect(text?.body).toBeTruthy();
      expect(text?.title?.length).toBeLessThanOrEqual(
        BENEFIT_GRANT_TITLE_MAX_LENGTH,
      );
      expect(text?.body?.length).toBeLessThanOrEqual(
        BENEFIT_GRANT_BODY_MAX_LENGTH,
      );
    },
  );
});
