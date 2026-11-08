/**
 * ユーザー名の設定のページのガードの指定のテスト
 *
 * @description
 * - 日本語: 戻り先を付けない（未ログインの飛ばし先は従来どおり `/sign-in`）
 * - 英語: ログイン後にこのページ（`/en/mypage/setup-username`）へ戻す
 */
import { describe, expect, it } from "vitest";

import { setupUsernameGuardOptions } from "../guard-options";

describe("setupUsernameGuardOptions", () => {
  it("日本語では戻り先を付けない（従来の飛ばし先のまま）", () => {
    expect(setupUsernameGuardOptions("ja")).toBeUndefined();
  });

  it("英語ではログイン後に英語のこのページへ戻す", () => {
    expect(setupUsernameGuardOptions("en")).toEqual({
      returnTo: "/en/mypage/setup-username",
    });
  });
});
