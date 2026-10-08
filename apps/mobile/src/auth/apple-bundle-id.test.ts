import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";
import { APPLE_APP_BUNDLE_ID } from "@mahjong-scoring/features/account/apple";

/**
 * サーバーは Apple と認可コードを交換・取り消すときに、`APPLE_APP_BUNDLE_ID` を
 * client_id として使う。アプリの Bundle ID と食い違うと、Apple が交換を拒み、
 * 退会のときに Apple の連携を取り消せない。
 */
describe("APPLE_APP_BUNDLE_ID", () => {
  it("app.json の iOS の Bundle ID と同じ", () => {
    const appJson: unknown = JSON.parse(
      readFileSync(new URL("../../app.json", import.meta.url), "utf8"),
    );
    expect(appJson).toMatchObject({
      expo: { ios: { bundleIdentifier: APPLE_APP_BUNDLE_ID } },
    });
  });
});
