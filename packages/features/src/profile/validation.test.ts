import { messages } from "@mahjong-scoring/messages/ja";
import { describe, expect, it } from "vitest";

import {
  normalizeAndValidateProfile,
  PROFILE_LIMITS,
  PROFILE_VALIDATION_ERRORS,
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

describe("PROFILE_VALIDATION_ERRORS", () => {
  // 画面はエラーを profileEdit の名前空間で翻訳する
  it.each(PROFILE_VALIDATION_ERRORS)(
    "%s は profileEdit の辞書にある",
    (key) => {
      expect(messages.profileEdit[key]).toEqual(expect.any(String));
    },
  );
});

describe("validateDisplayName の長さ", () => {
  it("上限ちょうどの表示名は通り、1 文字超えると長すぎる", () => {
    expect(
      validateDisplayName("あ".repeat(PROFILE_LIMITS.displayName)),
    ).toBeUndefined();
    expect(
      validateDisplayName("あ".repeat(PROFILE_LIMITS.displayName + 1)),
    ).toBe("displayNameTooLong");
  });
});

describe("normalizeAndValidateProfile の正規化", () => {
  it("前後の空白を除き、SNS は先頭の @ をすべて外して保存の形にする", () => {
    expect(
      normalizeAndValidateProfile({
        displayName: "  麻雀太郎 ",
        bio: "\n清一色が好き  ",
        xUsername: " @mahjong_x ",
        instagramUsername: "@@mahjong.ig",
        youtubeHandle: "  @mahjong-yt",
      }),
    ).toEqual({
      ok: true,
      value: {
        displayName: "麻雀太郎",
        bio: "清一色が好き",
        xUsername: "mahjong_x",
        instagramUsername: "mahjong.ig",
        youtubeHandle: "mahjong-yt",
      },
    });
  });

  it("空欄と空白だけの欄は null にする", () => {
    expect(
      normalizeAndValidateProfile({ ...EMPTY, bio: "   ", xUsername: " @ " }),
    ).toEqual({
      ok: true,
      value: {
        displayName: null,
        bio: null,
        xUsername: null,
        instagramUsername: null,
        youtubeHandle: null,
      },
    });
  });
});

describe("normalizeAndValidateProfile の長さ", () => {
  it("表示名は前後の空白を除いた長さで上限を見る", () => {
    const displayName = "あ".repeat(PROFILE_LIMITS.displayName);
    expect(
      normalizeAndValidateProfile({
        ...EMPTY,
        displayName: ` ${displayName} `,
      }),
    ).toMatchObject({ ok: true, value: { displayName } });
    expect(
      normalizeAndValidateProfile({
        ...EMPTY,
        displayName: `${displayName}あ`,
      }),
    ).toEqual({ ok: false, error: "displayNameTooLong" });
  });

  it("自己紹介は前後の空白を除いた長さで上限を見る", () => {
    const bio = "あ".repeat(PROFILE_LIMITS.bio);
    expect(
      normalizeAndValidateProfile({ ...EMPTY, bio: ` ${bio} ` }),
    ).toMatchObject({ ok: true, value: { bio } });
    expect(normalizeAndValidateProfile({ ...EMPTY, bio: `${bio}あ` })).toEqual({
      ok: false,
      error: "bioTooLong",
    });
  });

  it.each([
    ["xUsername", "xUsernameInvalid"],
    ["instagramUsername", "instagramUsernameInvalid"],
    ["youtubeHandle", "youtubeHandleInvalid"],
  ] as const)(
    "%s は上限ちょうどまで通り、形式を満たしていても超えれば %s",
    (field, error) => {
      const handle = "a".repeat(PROFILE_LIMITS[field]);
      expect(
        normalizeAndValidateProfile({ ...EMPTY, [field]: handle }),
      ).toMatchObject({ ok: true, value: { [field]: handle } });
      expect(
        normalizeAndValidateProfile({ ...EMPTY, [field]: `${handle}a` }),
      ).toEqual({ ok: false, error });
    },
  );
});

describe("normalizeAndValidateProfile の SNS の形式", () => {
  it.each([
    // 先頭・末尾・途中の 1 文字だけが使えない文字でも弾く
    ["xUsername", "-mahjong", "xUsernameInvalid"],
    ["xUsername", "mahjong-", "xUsernameInvalid"],
    ["xUsername", "mah@jong", "xUsernameInvalid"],
    ["xUsername", "mah.jong", "xUsernameInvalid"],
    ["instagramUsername", "-mahjong", "instagramUsernameInvalid"],
    ["instagramUsername", "mahjong-", "instagramUsernameInvalid"],
    ["youtubeHandle", "!mahjong", "youtubeHandleInvalid"],
    ["youtubeHandle", "mahjong!", "youtubeHandleInvalid"],
  ] as const)("%s の %s は %s", (field, handle, error) => {
    expect(normalizeAndValidateProfile({ ...EMPTY, [field]: handle })).toEqual({
      ok: false,
      error,
    });
  });

  it.each([
    ["xUsername", "Mahjong_123"],
    ["instagramUsername", "mah.jong_123"],
    ["youtubeHandle", "mah.jong-_123"],
  ] as const)("%s は使える文字だけの %s を通す", (field, handle) => {
    expect(
      normalizeAndValidateProfile({ ...EMPTY, [field]: handle }),
    ).toMatchObject({ ok: true, value: { [field]: handle } });
  });
});
