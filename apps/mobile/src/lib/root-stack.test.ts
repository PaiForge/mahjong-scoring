import { describe, expect, it } from "vitest";

import { findRootStack } from "./root-stack";

interface FakeNavigation {
  readonly name: string;
  getState(): { readonly routeNames: readonly string[] } | undefined;
  getParent(): FakeNavigation | undefined;
}

function nav(
  name: string,
  routeNames: readonly string[] | undefined,
  parent?: FakeNavigation,
): FakeNavigation {
  return {
    name,
    getState: () => (routeNames === undefined ? undefined : { routeNames }),
    getParent: () => parent,
  };
}

describe("findRootStack", () => {
  const outer = nav("__root", ["__root"]);
  const root = nav("root", ["(tabs)", "(session)", "(account)"], outer);

  it("(tabs) を画面に持つ navigator まで親を辿る", () => {
    const account = nav("account", ["mypage/index"], root);
    const screen = nav("screen", undefined, account);

    expect(findRootStack(screen)?.name).toBe("root");
  });

  it("今の navigation がルートのスタックならそれを返す", () => {
    expect(findRootStack(root)?.name).toBe("root");
  });

  it("見つからなければ undefined（外側の __root は使わない）", () => {
    expect(findRootStack(outer)).toBeUndefined();
    expect(findRootStack(undefined)).toBeUndefined();
  });
});
