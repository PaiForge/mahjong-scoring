import { describe, expect, it } from "vitest";

import { buildSnsLinks } from "./sns-links";

describe("buildSnsLinks", () => {
  it("設定された SNS だけを X → Instagram → YouTube の順に並べる", () => {
    expect(buildSnsLinks({ youtubeHandle: "yt", xUsername: "xx" })).toEqual([
      { label: "X", handle: "@xx", url: "https://x.com/xx" },
      {
        label: "YouTube",
        handle: "@yt",
        url: "https://www.youtube.com/@yt",
      },
    ]);
  });

  it("3 つとも設定されていれば Instagram を X と YouTube の間に置く", () => {
    expect(
      buildSnsLinks({
        youtubeHandle: "yt",
        instagramUsername: "ig.user",
        xUsername: "xx",
      }),
    ).toEqual([
      { label: "X", handle: "@xx", url: "https://x.com/xx" },
      {
        label: "Instagram",
        handle: "@ig.user",
        url: "https://www.instagram.com/ig.user",
      },
      {
        label: "YouTube",
        handle: "@yt",
        url: "https://www.youtube.com/@yt",
      },
    ]);
  });

  it("空文字のアカウントは未設定として出さない", () => {
    expect(buildSnsLinks({ xUsername: "", instagramUsername: "" })).toEqual([]);
  });

  it("何も設定されていなければ空", () => {
    expect(buildSnsLinks({})).toEqual([]);
  });
});
