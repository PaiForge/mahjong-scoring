import { describe, expect, it } from "vitest";
import { HaiKind } from "@mahjong-scoring/core";

import { kazeContextLabel } from "./kaze-context-label";

const t = (key: "round" | "wind") => (key === "round" ? "場" : "家");

describe("kazeContextLabel", () => {
  it("場風・自風の名前に「場」「家」を添え、間を空白で区切る", () => {
    expect(kazeContextLabel(HaiKind.Ton, HaiKind.Nan, t)).toBe("東場 南家");
    expect(kazeContextLabel(HaiKind.Nan, HaiKind.Pei, t)).toBe("南場 北家");
  });
});
