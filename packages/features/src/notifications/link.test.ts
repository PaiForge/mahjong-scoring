import { describe, expect, it } from "vitest";

import { MYPAGE_PLAN_PATH } from "../routes";
import { notificationHref } from "./link";
import { NOTIFICATION_TYPES } from "./types";

describe("notificationHref", () => {
  it.each(NOTIFICATION_TYPES)("%s はプラン状況へ送る", (type) => {
    expect(notificationHref(type)).toBe(MYPAGE_PLAN_PATH);
  });

  it("登録に無い種別は遷移先を持たない", () => {
    expect(notificationHref("follow")).toBeUndefined();
  });
});
