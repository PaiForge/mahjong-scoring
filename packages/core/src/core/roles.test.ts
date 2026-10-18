import { describe, expect, it } from "vitest";

import { roleOf } from "./roles";

describe("roleOf", () => {
  it("親なら oya、子なら ko", () => {
    expect(roleOf(true)).toBe("oya");
    expect(roleOf(false)).toBe("ko");
  });
});
