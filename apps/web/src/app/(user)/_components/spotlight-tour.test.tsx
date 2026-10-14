import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

import { SpotlightTour } from "./spotlight-tour";

// driver.js は実際には起動せず、渡った設定と drive() / destroy() の呼び出しだけを見る
const { driverMock, instance } = vi.hoisted(() => {
  const mockInstance = {
    drive: vi.fn(),
    destroy: vi.fn(),
    getActiveElement: vi.fn<() => Element | undefined>(),
    onDestroyed: undefined as (() => void) | undefined,
  };
  const driver = vi.fn((config: { onDestroyed?: () => void }) => {
    mockInstance.onDestroyed = config.onDestroyed;
    return mockInstance;
  });
  return { driverMock: driver, instance: mockInstance };
});
vi.mock("driver.js", () => ({ driver: driverMock }));
vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));

const STORAGE_KEY = "spotlight-tour-test-seen";

const LABELS = {
  label: "help",
  prev: "prev",
  next: "next",
  done: "done",
  progress: "{{current}} / {{total}}",
};

const STEPS = [{ targetId: "target", description: "照らす要素" }];

beforeEach(() => {
  driverMock.mockClear();
  instance.drive.mockClear();
  // 本物と同じく、閉じたら onDestroyed を呼ぶ（ツアーが足した listener を外す）
  instance.destroy.mockReset();
  instance.destroy.mockImplementation(() => instance.onDestroyed?.());
  instance.getActiveElement.mockReset();
});

function renderTour() {
  return render(
    <SpotlightTour
      steps={STEPS}
      labels={LABELS}
      autoStartOnceKey={STORAGE_KEY}
    />,
  );
}

/** 照らす対象の要素を置く */
function mountTarget(): HTMLElement {
  const target = document.createElement("button");
  target.dataset.tourId = "target";
  document.body.append(target);
  return target;
}

describe("SpotlightTour の自動開始", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("初めて開いたときに始め、印を書く", () => {
    mountTarget();
    renderTour();

    act(() => vi.runAllTimers());

    expect(instance.drive).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("印があれば始めない", () => {
    localStorage.setItem(STORAGE_KEY, "1");
    mountTarget();
    renderTour();

    act(() => vi.runAllTimers());

    expect(instance.drive).not.toHaveBeenCalled();
  });

  it("照らす要素が無くて始まらなかったときは印を書かない", () => {
    renderTour();

    act(() => vi.runAllTimers());

    expect(instance.drive).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("待つ間にモーダルが開いていたら始めず、印も書かない", () => {
    mountTarget();
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    document.body.append(dialog);
    renderTour();

    act(() => vi.runAllTimers());

    expect(instance.drive).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("SpotlightTour の照らした要素の操作", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("照らした要素を押すとツアーを閉じ、押した要素の処理はそのまま走る", () => {
    const target = mountTarget();
    const onTargetClick = vi.fn();
    target.addEventListener("click", onTargetClick);
    instance.getActiveElement.mockReturnValue(target);
    const { getByRole } = render(
      <SpotlightTour steps={STEPS} labels={LABELS} />,
    );

    fireEvent.click(getByRole("button", { name: "help" }));
    fireEvent.click(target);

    expect(instance.destroy).toHaveBeenCalled();
    expect(onTargetClick).toHaveBeenCalledTimes(1);
  });

  it("照らした要素の外（吹き出しのボタン等）を押しても閉じない", () => {
    const target = mountTarget();
    const outside = document.createElement("button");
    document.body.append(outside);
    instance.getActiveElement.mockReturnValue(target);
    const { getByRole } = render(
      <SpotlightTour steps={STEPS} labels={LABELS} />,
    );

    fireEvent.click(getByRole("button", { name: "help" }));
    // 「?」を押したときの destroy（前のツアーの片付け）は数えない
    instance.destroy.mockClear();
    fireEvent.click(outside);

    expect(instance.destroy).not.toHaveBeenCalled();
  });

  it("ツアーを閉じた後は、要素を押しても閉じる処理を呼ばない", () => {
    const target = mountTarget();
    instance.getActiveElement.mockReturnValue(target);
    const { getByRole } = render(
      <SpotlightTour steps={STEPS} labels={LABELS} />,
    );

    fireEvent.click(getByRole("button", { name: "help" }));
    fireEvent.click(target);
    instance.destroy.mockClear();
    fireEvent.click(target);

    expect(instance.destroy).not.toHaveBeenCalled();
  });
});
