import { describe, expect, it } from "vitest";

import { resolveDevHostUri } from "./dev-host";

describe("resolveDevHostUri", () => {
  it("Expo の CLI が渡した hostUri があればそれを使う", () => {
    expect(
      resolveDevHostUri({
        hostUri: "192.168.4.22:8081",
        scriptUrl: "http://10.0.2.2:8081/index.bundle?platform=android",
      }),
    ).toBe("192.168.4.22:8081");
  });

  it("hostUri が無ければ、読み込んだバンドルの URL のホストを使う（開発クライアントの無い開発ビルド）", () => {
    expect(
      resolveDevHostUri({
        hostUri: undefined,
        scriptUrl:
          "http://10.0.2.2:8082/apps/mobile/index.bundle?platform=android&dev=true",
      }),
    ).toBe("10.0.2.2:8082");
  });

  it("バンドルが端末の中のファイルなら undefined（ストアのビルド）", () => {
    expect(
      resolveDevHostUri({
        hostUri: undefined,
        scriptUrl: "assets://index.android.bundle",
      }),
    ).toBeUndefined();
    expect(
      resolveDevHostUri({
        hostUri: undefined,
        scriptUrl: "file:///var/containers/Bundle/main.jsbundle",
      }),
    ).toBeUndefined();
  });

  it("どちらも無ければ undefined", () => {
    expect(
      resolveDevHostUri({ hostUri: undefined, scriptUrl: undefined }),
    ).toBeUndefined();
  });
});
