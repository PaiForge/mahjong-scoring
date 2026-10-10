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

  it("何も設定されていなければ空", () => {
    expect(buildSnsLinks({})).toEqual([]);
  });
});
