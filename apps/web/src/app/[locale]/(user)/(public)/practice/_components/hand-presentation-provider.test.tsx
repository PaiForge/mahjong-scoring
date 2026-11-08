import { act, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PRESENTATION_CLOSED,
  PRESENTATION_CONTEXT,
  proViewerProfile,
} from "@/test/hand-presentation-fixtures";
import { render } from "@/test/tile-image-render";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);
vi.mock("@/app/_lib/viewer-profile", () => ({
  fetchViewerProfile: vi.fn(),
}));

const { useAuth } = await import("@/test/auth-context-mock");
const { fetchViewerProfile } = await import("@/app/_lib/viewer-profile");
const { useDisplaySettingsStore } =
  await import("@/app/_hooks/use-display-settings-store");
const { HandPresentationProvider } =
  await import("./hand-presentation-provider");
const { HandPresentationNotice } = await import("./hand-presentation-notice");
const { TehaiDisplay } = await import("./tehai-display");

const mockFetchViewerProfile = vi.mocked(fetchViewerProfile);

/** 盤面に描かれた牌画像の角度（transform）の一覧 */
function tileTransforms(): string[] {
  return screen.getAllByRole("img").map((img) => img.style.transform);
}

beforeEach(() => {
  useAuth.mockReturnValue({ user: undefined, isLoading: false });
  mockFetchViewerProfile.mockReset();
  act(() => useDisplaySettingsStore.getState().setTileOrientation("upright"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("HandPresentationProvider（web）", () => {
  it("サーバー描画は fallback で、保存値が random でも upright で確定しない", () => {
    act(() => useDisplaySettingsStore.getState().setTileOrientation("random"));
    const html = renderToString(
      <HandPresentationProvider fallback={<p>skeleton</p>}>
        <p>board</p>
      </HandPresentationProvider>,
    );
    expect(html).toContain("skeleton");
    expect(html).not.toContain("board");
  });

  it("決まるまで子をマウントせず、子の effect（開始・出題）も走らない", async () => {
    act(() => useDisplaySettingsStore.getState().setTileOrientation("random"));
    useAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    let resolveProfile: (
      value: ReturnType<typeof proViewerProfile>,
    ) => void = () => undefined;
    mockFetchViewerProfile.mockReturnValue(
      new Promise((resolve) => {
        resolveProfile = resolve;
      }),
    );
    const started = vi.fn();
    function Child() {
      useEffect(() => started(), []);
      return <p>board</p>;
    }
    render(
      <HandPresentationProvider fallback={<p>skeleton</p>}>
        <Child />
      </HandPresentationProvider>,
    );
    expect(screen.getByText("skeleton")).toBeTruthy();
    expect(started).not.toHaveBeenCalled();

    await act(async () => resolveProfile(proViewerProfile()));
    expect(screen.getByText("board")).toBeTruthy();
    expect(screen.queryByText("skeleton")).toBeNull();
    expect(started).toHaveBeenCalledTimes(1);
  });

  it("upright なら特典を読まずに始める", async () => {
    render(
      <HandPresentationProvider fallback={<p>skeleton</p>}>
        <p>board</p>
      </HandPresentationProvider>,
    );
    await waitFor(() => expect(screen.getByText("board")).toBeTruthy());
    expect(mockFetchViewerProfile).not.toHaveBeenCalled();
  });

  it("random + Pro なら盤面の純手牌と和了牌の向きを変え、案内は出さない", async () => {
    act(() => useDisplaySettingsStore.getState().setTileOrientation("random"));
    useAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockFetchViewerProfile.mockResolvedValue(proViewerProfile());
    render(
      <HandPresentationProvider fallback={<p>skeleton</p>}>
        <HandPresentationNotice />
        <TehaiDisplay
          tehai={{ closed: PRESENTATION_CLOSED, exposed: [] }}
          context={PRESENTATION_CONTEXT}
        />
      </HandPresentationProvider>,
    );
    await waitFor(() => expect(screen.queryByText("skeleton")).toBeNull());
    const transforms = tileTransforms();
    // 純手牌 13 + 和了牌 1。どれも 0 度か 180 度
    expect(transforms).toHaveLength(14);
    expect(
      transforms.every((value) => value === "" || value === "rotate(180deg)"),
    ).toBe(true);
    expect(screen.queryByText("handPresentationFallbackNotice")).toBeNull();
  });

  it("random でも特典が無ければ従来の向き", async () => {
    act(() => useDisplaySettingsStore.getState().setTileOrientation("random"));
    useAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockFetchViewerProfile.mockResolvedValue({
      ...proViewerProfile(),
      benefits: [],
    });
    render(
      <HandPresentationProvider fallback={<p>skeleton</p>}>
        <TehaiDisplay
          tehai={{ closed: PRESENTATION_CLOSED, exposed: [] }}
          context={PRESENTATION_CONTEXT}
        />
      </HandPresentationProvider>,
    );
    await waitFor(() => expect(screen.queryByText("skeleton")).toBeNull());
    expect(tileTransforms().every((value) => value === "")).toBe(true);
  });

  it("プロフィールを読めなければ従来の向きで始め、案内を出す", async () => {
    act(() => useDisplaySettingsStore.getState().setTileOrientation("random"));
    useAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockFetchViewerProfile.mockResolvedValue(undefined);
    render(
      <HandPresentationProvider fallback={<p>skeleton</p>}>
        <HandPresentationNotice />
        <p>board</p>
      </HandPresentationProvider>,
    );
    await waitFor(() => expect(screen.getByText("board")).toBeTruthy());
    expect(screen.getByText("handPresentationFallbackNotice")).toBeTruthy();
  });

  it("確定後に設定・ログインが変わっても盤面の向きとマウントを保つ", async () => {
    act(() => useDisplaySettingsStore.getState().setTileOrientation("random"));
    useAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockFetchViewerProfile.mockResolvedValue(proViewerProfile());
    const mounted = vi.fn();
    function Child() {
      useEffect(() => mounted(), []);
      return (
        <TehaiDisplay
          tehai={{ closed: PRESENTATION_CLOSED, exposed: [] }}
          context={PRESENTATION_CONTEXT}
        />
      );
    }
    const view = render(
      <HandPresentationProvider fallback={<p>skeleton</p>}>
        <Child />
      </HandPresentationProvider>,
    );
    await waitFor(() => expect(screen.queryByText("skeleton")).toBeNull());
    const before = tileTransforms();

    act(() => useDisplaySettingsStore.getState().setTileOrientation("upright"));
    useAuth.mockReturnValue({ user: undefined, isLoading: false });
    view.rerender(
      <HandPresentationProvider fallback={<p>skeleton</p>}>
        <Child />
      </HandPresentationProvider>,
    );
    expect(tileTransforms()).toEqual(before);
    expect(mounted).toHaveBeenCalledTimes(1);
  });

  it("同じ手牌なら Provider を作り直しても同じ配置（同じドキュメントの種）", async () => {
    act(() => useDisplaySettingsStore.getState().setTileOrientation("random"));
    useAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockFetchViewerProfile.mockResolvedValue(proViewerProfile());
    const ui = (
      <HandPresentationProvider fallback={<p>skeleton</p>}>
        <TehaiDisplay
          tehai={{ closed: PRESENTATION_CLOSED, exposed: [] }}
          context={PRESENTATION_CONTEXT}
        />
      </HandPresentationProvider>
    );
    const first = render(ui);
    await waitFor(() => expect(screen.queryByText("skeleton")).toBeNull());
    const before = tileTransforms();
    first.unmount();

    render(ui);
    await waitFor(() => expect(screen.queryByText("skeleton")).toBeNull());
    expect(tileTransforms()).toEqual(before);
  });

  it("特典の取得が 3 秒で終わらなければ従来の向きで始める", async () => {
    vi.useFakeTimers();
    act(() => useDisplaySettingsStore.getState().setTileOrientation("random"));
    useAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockFetchViewerProfile.mockReturnValue(new Promise(() => undefined));
    render(
      <HandPresentationProvider fallback={<p>skeleton</p>}>
        <HandPresentationNotice />
        <p>board</p>
      </HandPresentationProvider>,
    );
    expect(screen.getByText("skeleton")).toBeTruthy();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText("board")).toBeTruthy();
    expect(screen.getByText("handPresentationFallbackNotice")).toBeTruthy();
  });
});
