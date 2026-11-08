import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JsonLd, serializeJsonLd } from "./json-ld";

const BREAKOUT = "</script><script>alert(1)</script>";

describe("serializeJsonLd", () => {
  it("< をエスケープし、script 要素を閉じる文字列を残さない", () => {
    const serialized = serializeJsonLd({ name: BREAKOUT });

    expect(serialized).not.toContain("<");
    // JSON としては元の値に戻る（構造化データの意味は変わらない）
    expect(JSON.parse(serialized)).toEqual({ name: BREAKOUT });
  });
});

describe("JsonLd", () => {
  it("DB 由来の文字列を渡しても script 要素は 1 つのまま", () => {
    const { container } = render(<JsonLd data={{ name: BREAKOUT }} />);

    expect(container.querySelectorAll("script")).toHaveLength(1);
    expect(container.innerHTML).not.toContain("</script><script>");
  });
});
