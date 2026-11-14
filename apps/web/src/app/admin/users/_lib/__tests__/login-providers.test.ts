import { describe, expect, it } from "vitest";

import { readLoginProviders } from "../login-providers";

describe("readLoginProviders", () => {
  it("providers を既知のプロバイダの順に並べ替える", () => {
    expect(
      readLoginProviders({
        provider: "google",
        providers: ["apple", "email", "google"],
      }),
    ).toEqual(["email", "google", "apple"]);
  });

  it("辞書に無いプロバイダは既知のものの後ろに元の順で置く", () => {
    expect(
      readLoginProviders({ providers: ["github", "google", "discord"] }),
    ).toEqual(["google", "github", "discord"]);
  });

  it("重複は 1 つにまとめる", () => {
    expect(readLoginProviders({ providers: ["email", "email"] })).toEqual([
      "email",
    ]);
  });

  it("providers が無い・空・文字列を含まないときは provider に落とす", () => {
    expect(readLoginProviders({ provider: "email" })).toEqual(["email"]);
    expect(readLoginProviders({ provider: "email", providers: [] })).toEqual([
      "email",
    ]);
    expect(
      readLoginProviders({ provider: "google", providers: [1, null] }),
    ).toEqual(["google"]);
  });

  it("どちらも無ければ空", () => {
    expect(readLoginProviders({})).toEqual([]);
  });
});
