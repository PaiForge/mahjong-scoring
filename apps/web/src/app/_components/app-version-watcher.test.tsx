import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockUsePathname } = vi.hoisted(() => ({
  mockUsePathname: vi.fn<() => string>(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mockUsePathname,
}));

vi.mock("@/app/_lib/app-version", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/app/_lib/app-version")>()),
  APP_BUILD_ID: "build-old",
}));

import {
  APP_VERSION_CHECK_INTERVAL_MS,
  AppVersionWatcher,
  type PageNavigation,
} from "./app-version-watcher";

const fetchMock = vi.fn<typeof fetch>();

function respondWith(buildId: string | undefined) {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify(buildId === undefined ? {} : { buildId })),
  );
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    configurable: true,
  });
}

/** タブへ戻ってきて、監視の fetch と判定が終わるまで */
async function returnToTab() {
  await act(async () => {
    setVisibility("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    await Promise.resolve();
  });
}

function mount(pathname: string): PageNavigation {
  mockUsePathname.mockReturnValue(pathname);
  const navigation: PageNavigation = { reload: vi.fn(), assign: vi.fn() };
  render(<AppVersionWatcher navigation={navigation} />);
  return navigation;
}

function clickLink(href: string): MouseEvent {
  const a = document.createElement("a");
  a.href = href;
  document.body.append(a);
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  a.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  setVisibility("visible");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  fetchMock.mockReset();
  document.body.innerHTML = "";
});

describe("AppVersionWatcher", () => {
  it("マウントしただけでは配信中の版を確かめない（読み込み直後は新しい）", () => {
    respondWith("build-old");
    mount("/lessons/yaku");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("配信中の版が同じなら何もしない", async () => {
    respondWith("build-old");
    const navigation = mount("/lessons/yaku");

    await returnToTab();

    expect(fetchMock).toHaveBeenCalledWith("/api/version", {
      cache: "no-store",
    });
    expect(navigation.reload).not.toHaveBeenCalled();
  });

  it("配信中の版が違い、通常のページなら、その場で再読み込みする", async () => {
    respondWith("build-new");
    const navigation = mount("/lessons/yaku");

    await returnToTab();

    expect(navigation.reload).toHaveBeenCalledTimes(1);
  });

  it("応答に版が無い（ローカル等）なら古いとみなさない", async () => {
    respondWith(undefined);
    const navigation = mount("/lessons/yaku");

    await returnToTab();

    expect(navigation.reload).not.toHaveBeenCalled();
  });

  it("取得に失敗しても何もしない", async () => {
    fetchMock.mockRejectedValue(new TypeError("offline"));
    const navigation = mount("/lessons/yaku");

    await returnToTab();

    expect(navigation.reload).not.toHaveBeenCalled();
  });

  it("一定間隔でも確かめる", async () => {
    vi.useFakeTimers();
    respondWith("build-new");
    const navigation = mount("/lessons/yaku");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(APP_VERSION_CHECK_INTERVAL_MS);
    });

    expect(navigation.reload).toHaveBeenCalledTimes(1);
  });

  it("出題セッションの最中は再読み込みせず、次のリンクをフルナビゲーションにする", async () => {
    respondWith("build-new");
    const navigation = mount("/exam/mangan/play");

    await returnToTab();
    expect(navigation.reload).not.toHaveBeenCalled();

    const event = clickLink("/exam/mangan");

    expect(event.defaultPrevented).toBe(true);
    expect(navigation.assign).toHaveBeenCalledWith(
      `${window.location.origin}/exam/mangan`,
    );
  });

  it("古いと分かった後にセッションを出てパスが変わったら、そこで再読み込みする", async () => {
    respondWith("build-new");
    mockUsePathname.mockReturnValue("/exam/mangan/play");
    const navigation: PageNavigation = { reload: vi.fn(), assign: vi.fn() };
    const view = render(<AppVersionWatcher navigation={navigation} />);

    await returnToTab();
    expect(navigation.reload).not.toHaveBeenCalled();

    mockUsePathname.mockReturnValue("/exam/mangan/result");
    view.rerender(<AppVersionWatcher navigation={navigation} />);

    expect(navigation.reload).toHaveBeenCalledTimes(1);
  });

  it("入力中は再読み込みを待ち、入力を離れて戻ってきたときに再読み込みする", async () => {
    respondWith("build-new");
    const input = document.createElement("input");
    document.body.append(input);
    input.focus();
    const navigation = mount("/sign-in");

    await returnToTab();
    expect(navigation.reload).not.toHaveBeenCalled();

    input.blur();
    await returnToTab();
    expect(navigation.reload).toHaveBeenCalledTimes(1);
  });

  it("古いと分かった後は配信中の版を確かめ直さない", async () => {
    respondWith("build-new");
    mount("/exam/mangan/play");

    await returnToTab();
    await returnToTab();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
