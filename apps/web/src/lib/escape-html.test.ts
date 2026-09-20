import { describe, expect, it } from "vitest";

import { escapeHtml } from "./escape-html";

describe("escapeHtml", () => {
  it.each([
    ["a & b", "a &amp; b"],
    ["<script>", "&lt;script&gt;"],
    ['"hello"', "&quot;hello&quot;"],
    ["it's", "it&#x27;s"],
    [
      "<img src=\"x\" onerror='alert(1)'>",
      "&lt;img src=&quot;x&quot; onerror=&#x27;alert(1)&#x27;&gt;",
    ],
  ])("%s → %s", (input, expected) => {
    expect(escapeHtml(input)).toBe(expected);
  });

  it("特殊文字を含まない文字列はそのまま返す", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
    expect(escapeHtml("")).toBe("");
  });

  it("エスケープ済みの実体参照も二重にエスケープする", () => {
    expect(escapeHtml("&amp;")).toBe("&amp;amp;");
  });

  it("空白・改行・非 ASCII 文字は変えない", () => {
    expect(escapeHtml("line1\nline2\ttab 世界 ☃")).toBe(
      "line1\nline2\ttab 世界 ☃",
    );
  });
});
