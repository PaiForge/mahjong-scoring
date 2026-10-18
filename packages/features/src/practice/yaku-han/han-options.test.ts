import { describe, expect, it } from "vitest";

import { yakuHanStateLabel } from "./han-options";

describe("yakuHanStateLabel", () => {
  const t = (key: string) => `<${key}>`;

  it("門前なら menzen、鳴きなら naki のキーを引く", () => {
    expect(yakuHanStateLabel(true, t)).toBe("<menzen>");
    expect(yakuHanStateLabel(false, t)).toBe("<naki>");
  });
});
