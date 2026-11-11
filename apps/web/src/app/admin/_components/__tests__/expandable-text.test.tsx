import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExpandableText } from "../expandable-text";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) =>
    ({ showAll: "全文", hide: "閉じる" })[key] ?? key,
}));

afterEach(cleanup);

describe("ExpandableText", () => {
  it("上限以下の値は切り詰めずにそのまま出す", async () => {
    render(await ExpandableText({ text: "短い理由", maxLength: 10 }));

    expect(screen.getByText("短い理由")).toBeTruthy();
    expect(document.querySelector("details")).toBeNull();
  });

  it("上限を超える値は先頭だけを見せ、全文を title ではなく開ける本文に持つ", async () => {
    const text = "あ".repeat(60);
    render(await ExpandableText({ text, maxLength: 50 }));

    const details = document.querySelector("details");
    expect(details).not.toBeNull();
    expect(details?.querySelector("summary")?.textContent).toContain(
      `${"あ".repeat(50)}…`,
    );
    expect(details?.querySelector("p")?.textContent).toBe(text);
    expect(document.querySelector("[title]")).toBeNull();
  });
});
