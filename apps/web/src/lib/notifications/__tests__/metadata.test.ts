import { describe, expect, it } from "vitest";

import { parseNotificationMetadata } from "../metadata";

describe("parseNotificationMetadata", () => {
  it("形が合う値はそのまま返す", () => {
    expect(
      parseNotificationMetadata({
        plan: "pro",
        kind: "pass",
        expiresAt: "2026-11-01T03:00:00.000Z",
      }),
    ).toEqual({
      plan: "pro",
      kind: "pass",
      expiresAt: "2026-11-01T03:00:00.000Z",
    });
  });

  it("空のオブジェクト（既定値）は空のまま", () => {
    expect(parseNotificationMetadata({})).toEqual({});
  });

  it.each([
    ["null", null],
    ["文字列", "pro"],
    ["kind が未知", { kind: "weekly" }],
    ["expiresAt が日時でない", { expiresAt: "明日" }],
  ])("壊れた値（%s）は空に落とす（一覧を落とさない）", (_label, value) => {
    expect(parseNotificationMetadata(value)).toEqual({});
  });
});
