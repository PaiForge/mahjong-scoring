import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { ChapterProgressBadge } from "./chapter-progress-badge";

vi.mock("next-intl/server", () => ({
  getTranslations: () =>
    Promise.resolve((key: string) => key),
}));

describe("ChapterProgressBadge", () => {
  it("renders the markedAsRead label when isRead is true", async () => {
    const { container } = render(await ChapterProgressBadge({ isRead: true }));
    expect(container.textContent).toContain("markedAsRead");
    expect(container.querySelector("span")).not.toBeNull();
  });

  it("renders nothing when isRead is false", async () => {
    const { container } = render(await ChapterProgressBadge({ isRead: false }));
    expect(container.innerHTML).toBe("");
  });
});
