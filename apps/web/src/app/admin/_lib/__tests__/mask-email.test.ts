import { describe, expect, it } from "vitest";

import { maskEmail } from "../mask-email";

describe("maskEmail", () => {
  it("ローカル部の先頭 1 文字とドメイン全体を残す", () => {
    expect(maskEmail("k_okishima@fuji.enterprises")).toBe(
      "k***@fuji.enterprises",
    );
  });

  it("ローカル部の長さを漏らさない", () => {
    expect(maskEmail("a@example.com")).toBe("a***@example.com");
    expect(maskEmail("averylonglocalpart@example.com")).toBe(
      "a***@example.com",
    );
  });

  it("最後の @ で区切り、引用符付きのローカル部からドメインを持ち出させない", () => {
    expect(maskEmail('"weird@local"@example.com')).toBe('"***@example.com');
  });

  it("ローカル部として読めないものは丸ごと隠す", () => {
    expect(maskEmail("not-an-email")).toBe("***");
    expect(maskEmail("@example.com")).toBe("***");
    expect(maskEmail("")).toBe("***");
  });
});
