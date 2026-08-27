/**
 * YakuOrderSection の施錠・保存・既定復帰の挙動テスト
 *
 * @description
 * - 施錠中: つまみを出さない（行のどこを触ってもページがスクロールできる）
 * - 解錠中: つまみだけが touch-action を止め、行は止めない
 * - 保存するまで永続化しない / 取り消しは並び替え済みのときだけ確認を挟む
 * - 既定の順に戻すは確認してから即座に戻す（並び替え中には入らない）
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { YAKU_DEFAULT_ORDER } from "@mahjong-scoring/core";

const { mockToastSuccess } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
}));

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

vi.mock("react-hot-toast", () => ({
  default: { success: mockToastSuccess },
}));

import { useYakuOrderStore } from "@/app/_hooks/use-yaku-order-store";
import { YakuOrderSection } from "./yaku-order-section";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** 鍵ボタン。辞書はスタブなのでラベルはキー（unlockAria / lockAria）そのもの */
function lockButton() {
  return screen.getByRole("button", { name: /^(unlock|lock)Aria$/ });
}

function isUnlocked(): boolean {
  return lockButton().getAttribute("aria-pressed") === "true";
}

/** 行のつまみ。ラベルは「役名 — dragHandleAria」 */
function handles() {
  return screen.queryAllByRole("button", { name: /dragHandleAria$/ });
}

/** 役の行。つまみが role="button" を持つため要素名で引く */
function rows(container: HTMLElement): readonly HTMLLIElement[] {
  return [...container.querySelectorAll("li")];
}

function clickText(text: string) {
  fireEvent.click(screen.getByText(text));
}

function savedOrder(): readonly string[] {
  return useYakuOrderStore.getState().order;
}

const CUSTOM_ORDER = [...YAKU_DEFAULT_ORDER].reverse();

/**
 * 下書きと保存済みがずれた状態を作る
 *
 * ドラッグはレイアウトの実測値に依存して jsdom では再現できない。解錠して
 * 下書きを持たせたうえで保存済みの側を動かし、「保存していない並びを
 * 抱えている」状態と同じ形にする。
 */
function unlockWithUnsavedChanges() {
  fireEvent.click(lockButton());
  act(() => {
    useYakuOrderStore.getState().setOrder(YAKU_DEFAULT_ORDER);
  });
}

beforeEach(() => {
  mockToastSuccess.mockClear();
  useYakuOrderStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("YakuOrderSection", () => {
  it("施錠中はつまみを出さず、行のどこにも touch-action を張らない", () => {
    const { container } = render(<YakuOrderSection />);

    expect(isUnlocked()).toBe(false);
    expect(screen.queryByText("save")).toBeNull();
    expect(screen.queryByText("cancel")).toBeNull();
    expect(handles()).toHaveLength(0);
    for (const row of rows(container)) {
      expect(row.className).not.toContain("touch-none");
    }
  });

  it("解錠するとつまみだけが touch-action を止め、行は止めない", () => {
    const { container } = render(<YakuOrderSection />);

    fireEvent.click(lockButton());

    expect(isUnlocked()).toBe(true);
    expect(screen.getByText("save")).not.toBeNull();
    expect(screen.getByText("dragHint")).not.toBeNull();
    expect(handles()).toHaveLength(YAKU_DEFAULT_ORDER.length);
    for (const handle of handles()) {
      expect(handle.className).toContain("touch-none");
    }
    // 行にも張ると一覧の上でページがスクロールできなくなる
    for (const row of rows(container)) {
      expect(row.className).not.toContain("touch-none");
    }
  });

  it("既定の順に戻すは確認するまで何もしない", () => {
    useYakuOrderStore.getState().setOrder(CUSTOM_ORDER);
    render(<YakuOrderSection />);

    clickText("reset");

    expect(screen.queryByRole("dialog")).not.toBeNull();
    expect(savedOrder()).toEqual(CUSTOM_ORDER);
    // 戻すのは確定操作なので、並び替え中には入らない
    expect(isUnlocked()).toBe(false);
  });

  it("既定の順に戻すを確認すると、既定順そのものは保存せずに戻す", () => {
    useYakuOrderStore.getState().setOrder(CUSTOM_ORDER);
    render(<YakuOrderSection />);

    clickText("reset");
    clickText("resetConfirm");

    // 既定順を保存すると、既定順を変えたときにその変更が届かなくなる
    expect(savedOrder()).toEqual([]);
    expect(isUnlocked()).toBe(false);
    expect(mockToastSuccess).toHaveBeenCalledTimes(1);
  });

  it("並び替えていなければ確認を挟まずに施錠へ戻す", () => {
    useYakuOrderStore.getState().setOrder(CUSTOM_ORDER);
    render(<YakuOrderSection />);

    fireEvent.click(lockButton());
    clickText("cancel");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(isUnlocked()).toBe(false);
  });

  it("並び替えたあとの取り消しは確認してから下書きを捨てる", () => {
    useYakuOrderStore.getState().setOrder(CUSTOM_ORDER);
    render(<YakuOrderSection />);

    unlockWithUnsavedChanges();
    clickText("cancel");

    // 誤タップで並び替えを失わないよう、破棄の前に一度止める
    expect(screen.queryByRole("dialog")).not.toBeNull();
    expect(isUnlocked()).toBe(true);

    clickText("discardConfirm");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(isUnlocked()).toBe(false);
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it("確認を閉じれば編集を続けられる", () => {
    useYakuOrderStore.getState().setOrder(CUSTOM_ORDER);
    render(<YakuOrderSection />);

    unlockWithUnsavedChanges();
    clickText("cancel");
    clickText("discardCancel");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(isUnlocked()).toBe(true);
  });

  it("保存すると施錠に戻り、保存したことを知らせる", () => {
    useYakuOrderStore.getState().setOrder(CUSTOM_ORDER);
    render(<YakuOrderSection />);

    fireEvent.click(lockButton());
    clickText("save");

    expect(isUnlocked()).toBe(false);
    expect(savedOrder()).toEqual(CUSTOM_ORDER);
    expect(mockToastSuccess).toHaveBeenCalledTimes(1);
  });

  it("既定順のままなら既定の順に戻すボタンを押せない", () => {
    render(<YakuOrderSection />);

    expect(screen.getByText("reset").closest("button")?.disabled).toBe(true);
  });
});
