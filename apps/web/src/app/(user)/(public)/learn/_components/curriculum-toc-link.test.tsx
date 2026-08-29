import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import { CurriculumTocLink } from "./curriculum-toc-link";

vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));

describe("CurriculumTocLink", () => {
  it("教本の目次へリンクする", async () => {
    const { container } = render(await CurriculumTocLink());

    const anchor = container.querySelector("a");
    expect(anchor?.getAttribute("href")).toBe("/learn");
  });
});
