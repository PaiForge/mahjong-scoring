import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));

const { TextbookLinkSection } = await import("./textbook-link-section");

describe("TextbookLinkSection", () => {
  it("教本の目次への 1 行だけを置き、章を個別には勧めない", async () => {
    const { container, getByText } = render(await TextbookLinkSection());

    expect(getByText("title")).toBeTruthy();
    const hrefs = Array.from(container.querySelectorAll("a")).map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toEqual(["/learn"]);
  });
});
