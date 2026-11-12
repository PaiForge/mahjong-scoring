import { describe, expect, it } from "vitest";

import { planAuthScreenSwitch } from "./auth-screen-switch";

describe("planAuthScreenSwitch", () => {
  it("登録の上の確認メールの画面からログインへは、登録ごと置き換える", () => {
    expect(planAuthScreenSwitch("sign-up/index", "signIn")).toBe(
      "replaceBelow",
    );
  });

  it("登録の上の確認メールの画面から登録へは、入力の残るフォームへ戻る", () => {
    expect(planAuthScreenSwitch("sign-up/index", "signUp")).toBe("back");
  });

  it("ログインの上の確認メールの画面からログインへは戻る", () => {
    expect(planAuthScreenSwitch("sign-in", "signIn")).toBe("back");
  });

  it("ログインの上の確認メールの画面から登録へは、ログインごと置き換える", () => {
    expect(planAuthScreenSwitch("sign-in", "signUp")).toBe("replaceBelow");
  });

  it("下が流れの外の画面なら、その画面には触れず確認メールの画面を置き換える", () => {
    expect(planAuthScreenSwitch("(tabs)", "signIn")).toBe("replace");
    expect(planAuthScreenSwitch(undefined, "signUp")).toBe("replace");
  });

  it("確認メールの画面がアカウントのモーダルの先頭なら、モーダルの下に触れず置き換える", () => {
    // モーダルの中のスタックでは下が無い（undefined）。モーダルの下の画面の名前は見えない
    expect(planAuthScreenSwitch(undefined, "signIn")).toBe("replace");
  });

  it("アカウントのモーダルの中のマイページの上では、流れの外として置き換える", () => {
    expect(planAuthScreenSwitch("mypage/index", "signIn")).toBe("replace");
  });
});
