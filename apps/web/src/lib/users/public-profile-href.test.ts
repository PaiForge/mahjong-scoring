import { describe, expect, it } from "vitest";

import { publicProfileHref } from "./public-profile-href";

describe("publicProfileHref", () => {
  it("builds the public profile path from a username", () => {
    expect(publicProfileHref("alice_01")).toBe("/u/alice_01");
  });

  it("encodes characters outside the username rules", () => {
    expect(publicProfileHref("a b/c")).toBe("/u/a%20b%2Fc");
  });
});
