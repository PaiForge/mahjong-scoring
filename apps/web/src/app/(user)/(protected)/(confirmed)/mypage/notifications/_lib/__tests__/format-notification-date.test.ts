import { describe, expect, it } from "vitest";

import { formatNotificationDate } from "../format-notification-date";

describe("formatNotificationDate", () => {
  it("JST の「年/月/日 時:分」にする", () => {
    // UTC 23:30 は JST の翌日 08:30
    expect(formatNotificationDate(new Date("2026-10-01T23:30:00Z"))).toBe(
      "2026/10/02 08:30",
    );
  });
});
