import { describe, expect, it } from "vitest";

import { NOTIFICATION_TYPES } from "@/lib/notifications/types";

import { MYPAGE_PLAN_HREF, notificationHref } from "../notification-link";

describe("notificationHref", () => {
  it.each(NOTIFICATION_TYPES)("%s はプラン状況へ送る", (type) => {
    expect(notificationHref(type)).toBe(MYPAGE_PLAN_HREF);
  });

  it("登録に無い種別は遷移先を持たない", () => {
    expect(notificationHref("follow")).toBeUndefined();
  });
});
