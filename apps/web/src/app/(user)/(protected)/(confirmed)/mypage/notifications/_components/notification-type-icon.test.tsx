import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NotificationType } from "@/lib/notifications/types";

import { NotificationTypeIcon } from "./notification-type-icon";

function toneOf(type: string): string {
  const { container } = render(<NotificationTypeIcon type={type} />);
  return container.firstElementChild?.className ?? "";
}

describe("NotificationTypeIcon", () => {
  it("良い知らせは緑、取り消しは赤、期限切れは中立", () => {
    expect(toneOf(NotificationType.PurchaseCompleted)).toContain("primary");
    expect(toneOf(NotificationType.BenefitGranted)).toContain("primary");
    expect(toneOf(NotificationType.PurchaseRevoked)).toContain("destructive");
    expect(toneOf(NotificationType.BenefitGrantRevoked)).toContain(
      "destructive",
    );
    expect(toneOf(NotificationType.PlanExpired)).toContain("surface");
  });

  it("登録に無い種別は中立の見た目にする", () => {
    expect(toneOf("unknown_type")).toContain("surface");
  });
});
