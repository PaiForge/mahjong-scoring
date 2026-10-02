import { describe, expect, it } from "vitest";

import {
  NOTIFICATION_TYPES,
  NotificationType,
  isNotificationType,
} from "../types";

describe("NotificationType", () => {
  it("種別の値は保存されるデータなので、既知の文字列のまま変わらない", () => {
    expect([...NOTIFICATION_TYPES].sort()).toEqual([
      "benefit_grant_revoked",
      "benefit_granted",
      "plan_expired",
      "purchase_completed",
      "purchase_revoked",
    ]);
  });

  it("isNotificationType は登録済みの値だけを通す", () => {
    expect(isNotificationType(NotificationType.PlanExpired)).toBe(true);
    expect(isNotificationType("follow")).toBe(false);
    expect(isNotificationType(undefined)).toBe(false);
  });
});
