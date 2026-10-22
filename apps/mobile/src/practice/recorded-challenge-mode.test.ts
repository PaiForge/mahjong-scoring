import { describe, expect, it } from "vitest";
import {
  resolveRecordedChallengeMode,
  type RecordedChallengeAuth,
  type RecordedChallengeMode,
} from "./recorded-challenge-mode";

const USER = { id: "user-1" } as unknown as NonNullable<
  RecordedChallengeAuth["user"]
>;
const ACCOUNT = { profile: { username: "bob" } } as unknown as NonNullable<
  RecordedChallengeAuth["account"]
>;
const NONE = { begun: undefined, frozen: undefined };

function authOf(
  partial: Partial<RecordedChallengeAuth>,
): RecordedChallengeAuth {
  return {
    status: "signedOut",
    user: undefined,
    account: undefined,
    accountError: undefined,
    ...partial,
  };
}

describe("resolveRecordedChallengeMode", () => {
  it("ゲストは端末で採点する", () => {
    expect(resolveRecordedChallengeMode(authOf({}), NONE)).toMatchObject({
      mode: { kind: "local" },
      shouldBegin: false,
      userId: undefined,
    });
  });

  it("アカウントの状態を読んでいる間は checking で、まだ頼まない", () => {
    expect(
      resolveRecordedChallengeMode(authOf({ status: "loading" }), NONE),
    ).toMatchObject({ mode: { kind: "checking" }, shouldBegin: false });
    expect(
      resolveRecordedChallengeMode(
        authOf({ status: "signedIn", user: USER }),
        NONE,
      ),
    ).toMatchObject({ mode: { kind: "checking" }, shouldBegin: false });
  });

  it("ユーザー名を決めた人は checking のままサーバーに頼む", () => {
    expect(
      resolveRecordedChallengeMode(
        authOf({ status: "signedIn", user: USER, account: ACCOUNT }),
        NONE,
      ),
    ).toEqual({
      mode: { kind: "checking" },
      shouldBegin: true,
      userId: "user-1",
      accountUnreachable: false,
    });
  });

  it("アカウントを読めなかったら offline。BAN は端末で採点する", () => {
    const base = authOf({ status: "signedIn", user: USER });
    expect(
      resolveRecordedChallengeMode({ ...base, accountError: "unknown" }, NONE),
    ).toMatchObject({ mode: { kind: "offline" }, accountUnreachable: true });
    expect(
      resolveRecordedChallengeMode({ ...base, accountError: "banned" }, NONE),
    ).toMatchObject({ mode: { kind: "local" }, accountUnreachable: false });
  });

  it("サーバーの答え（begun）と 1 度決めた始め方（frozen）が優先する", () => {
    const auth = authOf({ status: "signedIn", user: USER, account: ACCOUNT });
    const offline: RecordedChallengeMode = { kind: "offline" };
    expect(
      resolveRecordedChallengeMode(auth, { begun: offline, frozen: undefined }),
    ).toMatchObject({ mode: offline, shouldBegin: false });
    const local: RecordedChallengeMode = { kind: "local" };
    expect(
      resolveRecordedChallengeMode(
        { ...auth, accountError: "unknown", account: undefined },
        { begun: undefined, frozen: local },
      ),
    ).toMatchObject({ mode: local, shouldBegin: false });
  });
});
