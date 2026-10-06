// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { YAKU_DEFAULT_ORDER } from "@mahjong-scoring/core";

import {
  useYakuOrderEditor,
  type YakuOrderEditorOptions,
} from "./use-yaku-order-editor";

const CUSTOM_ORDER: readonly string[] = [...YAKU_DEFAULT_ORDER].reverse();

/** 先頭の 2 つを入れ替える（並び替えの操作の代わり） */
function swapFirstTwo(order: readonly string[]): readonly string[] {
  const [first, second, ...rest] = order;
  if (first === undefined || second === undefined) return order;
  return [second, first, ...rest];
}

const setOrder = vi.fn<(order: readonly string[]) => void>();
const resetOrder = vi.fn<() => void>();
const onUnlock = vi.fn<() => void>();
const onSave = vi.fn<() => void>();
const onReset = vi.fn<() => void>();

function renderEditor(savedOrder: readonly string[]) {
  return renderHook(
    (props: Pick<YakuOrderEditorOptions, "savedOrder">) =>
      useYakuOrderEditor({
        savedOrder: props.savedOrder,
        setOrder,
        resetOrder,
        onUnlock,
        onSave,
        onReset,
      }),
    { initialProps: { savedOrder } },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useYakuOrderEditor", () => {
  it("施錠中は保存済みの並びを映し、並び替えを受け付けない", () => {
    const { result } = renderEditor(CUSTOM_ORDER);

    act(() => result.current.updateDraft(swapFirstTwo));

    expect(result.current.isEditing).toBe(false);
    expect(result.current.order).toEqual(CUSTOM_ORDER);
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it("解錠すると保存済みの並びから下書きを始め、アプリの後始末を呼ぶ", () => {
    const { result } = renderEditor(CUSTOM_ORDER);

    act(() => result.current.toggleLock());

    expect(result.current.isEditing).toBe(true);
    expect(result.current.order).toEqual(CUSTOM_ORDER);
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it("並び替えは下書きだけを変え、保存するまで永続化しない", () => {
    const { result } = renderEditor(CUSTOM_ORDER);

    act(() => result.current.unlock());
    act(() => result.current.updateDraft(swapFirstTwo));

    expect(result.current.order).toEqual(swapFirstTwo(CUSTOM_ORDER));
    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(setOrder).not.toHaveBeenCalled();
    expect(resetOrder).not.toHaveBeenCalled();
  });

  it("並び替えていなければ確認を挟まずに施錠へ戻す", () => {
    const { result } = renderEditor(CUSTOM_ORDER);

    act(() => result.current.unlock());
    act(() => result.current.requestDiscard());

    expect(result.current.isDiscardConfirmOpen).toBe(false);
    expect(result.current.isEditing).toBe(false);
  });

  it("並び替えたあとの鍵の操作は取り消しと同じく確認を開く", () => {
    const { result } = renderEditor(CUSTOM_ORDER);

    act(() => result.current.unlock());
    act(() => result.current.updateDraft(swapFirstTwo));
    act(() => result.current.toggleLock());

    expect(result.current.isDiscardConfirmOpen).toBe(true);
    expect(result.current.isEditing).toBe(true);
  });

  it("破棄を確認すると下書きを捨てて施錠し、何も保存しない", () => {
    const { result } = renderEditor(CUSTOM_ORDER);

    act(() => result.current.unlock());
    act(() => result.current.updateDraft(swapFirstTwo));
    act(() => result.current.requestDiscard());
    act(() => result.current.confirmDiscard());

    expect(result.current.isDiscardConfirmOpen).toBe(false);
    expect(result.current.isEditing).toBe(false);
    expect(result.current.order).toEqual(CUSTOM_ORDER);
    expect(setOrder).not.toHaveBeenCalled();
    expect(resetOrder).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("破棄の確認を閉じれば下書きを持ったまま編集を続けられる", () => {
    const { result } = renderEditor(CUSTOM_ORDER);

    act(() => result.current.unlock());
    act(() => result.current.updateDraft(swapFirstTwo));
    act(() => result.current.requestDiscard());
    act(() => result.current.cancelDiscard());

    expect(result.current.isDiscardConfirmOpen).toBe(false);
    expect(result.current.isEditing).toBe(true);
    expect(result.current.order).toEqual(swapFirstTwo(CUSTOM_ORDER));
  });

  it("保存すると下書きを永続化して施錠し、保存の後始末を呼ぶ", () => {
    const { result } = renderEditor(CUSTOM_ORDER);

    act(() => result.current.unlock());
    act(() => result.current.updateDraft(swapFirstTwo));
    act(() => result.current.save());

    expect(setOrder).toHaveBeenCalledWith(swapFirstTwo(CUSTOM_ORDER));
    expect(resetOrder).not.toHaveBeenCalled();
    expect(result.current.isEditing).toBe(false);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("下書きが既定順なら既定順そのものは保存せずに未設定へ戻す", () => {
    const { result } = renderEditor(swapFirstTwo(YAKU_DEFAULT_ORDER));

    act(() => result.current.unlock());
    act(() => result.current.updateDraft(swapFirstTwo));
    act(() => result.current.save());

    // 既定順を保存すると、既定順を変えたときにその変更が届かなくなる
    expect(setOrder).not.toHaveBeenCalled();
    expect(resetOrder).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("施錠中の保存は何もしない", () => {
    const { result } = renderEditor(CUSTOM_ORDER);

    act(() => result.current.save());

    expect(setOrder).not.toHaveBeenCalled();
    expect(resetOrder).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("既定の順に戻すは確認するまで何もせず、閉じれば元のまま", () => {
    const { result } = renderEditor(CUSTOM_ORDER);

    act(() => result.current.requestReset());

    expect(result.current.isResetConfirmOpen).toBe(true);
    expect(resetOrder).not.toHaveBeenCalled();
    // 戻すのは確定操作なので、並び替え中には入らない
    expect(result.current.isEditing).toBe(false);

    act(() => result.current.cancelReset());

    expect(result.current.isResetConfirmOpen).toBe(false);
    expect(resetOrder).not.toHaveBeenCalled();
  });

  it("既定の順に戻すを確認すると未設定へ戻し、下書きも捨てて施錠する", () => {
    const { result } = renderEditor(CUSTOM_ORDER);

    act(() => result.current.unlock());
    act(() => result.current.updateDraft(swapFirstTwo));
    act(() => result.current.requestReset());
    act(() => result.current.confirmReset());

    expect(resetOrder).toHaveBeenCalledTimes(1);
    expect(setOrder).not.toHaveBeenCalled();
    expect(result.current.isResetConfirmOpen).toBe(false);
    expect(result.current.isEditing).toBe(false);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  describe("既定の順に戻すを押せるか", () => {
    it("保存済みが既定順で下書きにも変更が無ければ押せない", () => {
      const { result } = renderEditor(YAKU_DEFAULT_ORDER);

      expect(result.current.canResetToDefault).toBe(false);
      act(() => result.current.unlock());
      expect(result.current.canResetToDefault).toBe(false);
    });

    it("保存済みが既定順でなければ押せる", () => {
      const { result } = renderEditor(CUSTOM_ORDER);

      expect(result.current.canResetToDefault).toBe(true);
    });

    it("保存済みが既定順でも、保存していない並び替えがあれば押せる", () => {
      const { result } = renderEditor(YAKU_DEFAULT_ORDER);

      act(() => result.current.unlock());
      act(() => result.current.updateDraft(swapFirstTwo));

      expect(result.current.canResetToDefault).toBe(true);
    });
  });

  it("解錠中に保存済みの並びが変われば、下書きとの食い違いとして扱う", () => {
    const { result, rerender } = renderEditor(CUSTOM_ORDER);

    act(() => result.current.unlock());
    rerender({ savedOrder: YAKU_DEFAULT_ORDER });

    expect(result.current.order).toEqual(CUSTOM_ORDER);
    expect(result.current.hasUnsavedChanges).toBe(true);
  });
});
