import { describe, expect, it } from "vitest";

import {
  normalizeAndValidateProfile,
  validateDisplayName,
  type ProfileInput,
} from "./validation";

const EMPTY: ProfileInput = {
  displayName: "",
  bio: "",
  xUsername: "",
  instagramUsername: "",
  youtubeHandle: "",
};

describe("validateDisplayName", () => {
  it("載せられない語句を弾く", () => {
    expect(validateDisplayName("死ね太郎")).toBe("displayNameProhibited");
    expect(validateDisplayName("麻雀太郎")).toBeUndefined();
  });
});

describe("normalizeAndValidateProfile の語句の検証", () => {
  it.each([
    [{ displayName: "ﾁﾝｺ" }, "displayNameProhibited"],
    [{ bio: "よろしく。死 ね" }, "bioProhibited"],
    [{ xUsername: "@fuck_you" }, "snsProhibited"],
    [{ youtubeHandle: "porn.tube" }, "snsProhibited"],
  ] as const)("%o → %s", (input, error) => {
    expect(normalizeAndValidateProfile({ ...EMPTY, ...input })).toEqual({
      ok: false,
      error,
    });
  });

  it("普通の自己紹介は通す", () => {
    expect(
      normalizeAndValidateProfile({ ...EMPTY, bio: "清一色とチョンボが話題" }),
    ).toMatchObject({ ok: true });
  });
});
