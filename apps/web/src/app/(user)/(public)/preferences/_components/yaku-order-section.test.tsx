/**
 * YakuOrderSection の施錠と保存の挙動テスト
 *
 * @description
 * - 初期状態: 施錠されていて、行に touch-action を張らない（ページをスクロールできる）
 * - 解錠中: 保存・取り消しが出て、行がつまめるようになる
 * - 保存するまで永続化しない / 取り消しで下書きを捨てる
 * - 既定順に戻して保存したときは既定順そのものを保存しない
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
  return screen.getByRole("button", { name: /Aria$/ });
}

function isUnlocked(): boolean {
  return lockButton().getAttribute("aria-pressed") === "true";
}

/** 役の行。解錠中は dnd-kit が role="button" を振るため要素名で引く */
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

beforeEach(() => {
  mockToastSuccess.mockClear();
  useYakuOrderStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("YakuOrderSection", () => {
  it("初期状態では施錠されていて、行につまむ余地を残さない", () => {
    const { container } = render(<YakuOrderSection />);

    expect(isUnlocked()).toBe(false);
    expect(screen.queryByText("save")).toBeNull();
    expect(screen.queryByText("cancel")).toBeNull();

    // touch-action: none を張ったままだと一覧の上でページがスクロールできない
    for (const row of rows(container)) {
      expect(row.className).not.toContain("touch-none");
    }
  });

  it("解錠すると保存と取り消しが出て、行がつまめるようになる", () => {
    const { container } = render(<YakuOrderSection />);

    fireEvent.click(lockButton());

    expect(isUnlocked()).toBe(true);
    expect(screen.getByText("save")).not.toBeNull();
    expect(screen.getByText("cancel")).not.toBeNull();
    for (const row of rows(container)) {
      expect(row.className).toContain("touch-none");
    }
  });

  it("解錠して並びを変えただけでは永続化しない", () => {
    useYakuOrderStore.getState().setOrder(CUSTOM_ORDER);
    render(<YakuOrderSection />);

    fireEvent.click(lockButton());
    clickText("reset");

    expect(savedOrder()).toEqual(CUSTOM_ORDER);
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it("取り消すと下書きを捨てて施錠に戻る", () => {
    useYakuOrderStore.getState().setOrder(CUSTOM_ORDER);
    render(<YakuOrderSection />);

    fireEvent.click(lockButton());
    clickText("reset");
    clickText("cancel");

    expect(isUnlocked()).toBe(false);
    expect(savedOrder()).toEqual(CUSTOM_ORDER);
    expect(mockToastSuccess).not.toHaveBeenCalled();
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

  it("既定順に戻して保存したときは既定順そのものを保存しない", () => {
    useYakuOrderStore.getState().setOrder(CUSTOM_ORDER);
    render(<YakuOrderSection />);

    fireEvent.click(lockButton());
    clickText("reset");
    clickText("save");

    // 既定順を保存してしまうと、既定順を変えたときにその変更が届かなくなる
    expect(savedOrder()).toEqual([]);
    expect(mockToastSuccess).toHaveBeenCalledTimes(1);
  });

  it("既定順のままなら既定の順に戻すボタンを押せない", () => {
    render(<YakuOrderSection />);

    const button = screen.getByText("reset").closest("button");
    expect(button?.disabled).toBe(true);
  });
});
