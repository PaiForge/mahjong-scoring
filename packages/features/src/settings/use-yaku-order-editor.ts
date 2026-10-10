import { useCallback, useState } from "react";
import { YAKU_DEFAULT_ORDER } from "@mahjong-scoring/core";

/** 2 つの並びが同じ役を同じ順で持つか */
function isSameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((name, index) => name === b[index]);
}

/** {@link useYakuOrderEditor} に渡すもの */
export interface YakuOrderEditorOptions {
  /** 保存済みの役の並び（アプリのストアの `useYakuOrder`） */
  readonly savedOrder: readonly string[];
  /** 並びを永続化する（ストアの `setOrder`） */
  readonly setOrder: (order: readonly string[]) => void;
  /** 並びを未設定に戻す（ストアの `reset`） */
  readonly resetOrder: () => void;
  /** 保存した直後に呼ぶ。保存の知らせはアプリが出す */
  readonly onSave?: () => void;
  /** 既定の順に戻した直後に呼ぶ。戻した知らせはアプリが出す */
  readonly onReset?: () => void;
}

/** {@link useYakuOrderEditor} の戻り値 */
export interface YakuOrderEditor {
  /** 画面に映す並び。解錠中は下書き、施錠中は保存済み */
  readonly order: readonly string[];
  /** 解錠中（下書きを持っている）か */
  readonly isEditing: boolean;
  /** 下書きが保存済みの並びと食い違っているか */
  readonly hasUnsavedChanges: boolean;
  /** 「既定の順に戻す」を押せるか */
  readonly canResetToDefault: boolean;
  readonly isDiscardConfirmOpen: boolean;
  readonly isResetConfirmOpen: boolean;
  /** 保存済みの並びから下書きを始める */
  readonly unlock: () => void;
  /** 下書きを書き換える。施錠中は何もしない（並び替えの操作はアプリが持つ） */
  readonly updateDraft: (
    update: (draft: readonly string[]) => readonly string[],
  ) => void;
  /** 編集をやめる。並び替えていれば破棄の確認を開く */
  readonly requestDiscard: () => void;
  /** 鍵の操作。解錠中は {@link requestDiscard}、施錠中は {@link unlock} */
  readonly toggleLock: () => void;
  readonly confirmDiscard: () => void;
  /** 破棄の確認を閉じて編集を続ける */
  readonly cancelDiscard: () => void;
  /** 下書きを保存して施錠する */
  readonly save: () => void;
  readonly requestReset: () => void;
  /** 既定の順に戻して施錠する */
  readonly confirmReset: () => void;
  readonly cancelReset: () => void;
}

/**
 * 役の並び順の編集ルールを持つフック
 * 役並び順編集
 *
 * web（ドラッグ）とモバイル（▲ ▼）で並び替えの操作は違うが、施錠・下書き・
 * 保存・破棄の確認・既定の順に戻すの規則は同じなのでここに寄せる。
 * 並び替えの操作・知らせの出し方・描画はアプリが持つ。
 *
 * - 解錠中の並び替えは下書きに溜め、保存するまで永続化しない
 * - 並び替えていなければ確認を挟まずに施錠へ戻す。誤って触れただけの
 *   タップまで確認で止めると、何も失わない操作にモーダルを見せることになる
 * - 鍵を閉じる操作は「取り消す」と同じ経路を通す。見た目が違うだけで
 *   することは同じなので、確認の有無が食い違わないようにする
 * - 既定順そのものは保存しない（保存時に下書きが既定順なら `resetOrder`）。
 *   保存してしまうと既定順を変えたときにその変更が届かなくなる
 *   （`createYakuOrderStore` の `order` を参照）
 * - 「既定の順に戻す」は戻す先が今の状態と同じなら押させない。保存済みが
 *   既定でも、下書きに保存していない並び替えが残っていれば戻す意味がある
 *
 * @param options 保存済みの並びと永続化の操作、アプリ固有の後始末
 */
export function useYakuOrderEditor({
  savedOrder,
  setOrder,
  resetOrder,
  onSave,
  onReset,
}: YakuOrderEditorOptions): YakuOrderEditor {
  /** 解錠中の並び。undefined なら施錠中で、保存済みの並びをそのまま映す */
  const [draft, setDraft] = useState<readonly string[] | undefined>(undefined);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const isEditing = draft !== undefined;
  const hasUnsavedChanges =
    draft !== undefined && !isSameOrder(draft, savedOrder);
  const canResetToDefault =
    !isSameOrder(savedOrder, YAKU_DEFAULT_ORDER) || hasUnsavedChanges;

  const unlock = useCallback(() => {
    setDraft([...savedOrder]);
  }, [savedOrder]);

  const updateDraft = useCallback(
    (update: (current: readonly string[]) => readonly string[]) => {
      setDraft((current) =>
        current === undefined ? current : update(current),
      );
    },
    [],
  );

  const requestDiscard = useCallback(() => {
    if (!hasUnsavedChanges) {
      setDraft(undefined);
      return;
    }
    setIsDiscardConfirmOpen(true);
  }, [hasUnsavedChanges]);

  const confirmDiscard = useCallback(() => {
    setIsDiscardConfirmOpen(false);
    setDraft(undefined);
  }, []);

  const cancelDiscard = useCallback(() => {
    setIsDiscardConfirmOpen(false);
  }, []);

  const save = useCallback(() => {
    if (draft === undefined) return;
    if (isSameOrder(draft, YAKU_DEFAULT_ORDER)) {
      resetOrder();
    } else {
      setOrder(draft);
    }
    setDraft(undefined);
    setIsDiscardConfirmOpen(false);
    onSave?.();
  }, [draft, onSave, resetOrder, setOrder]);

  const requestReset = useCallback(() => {
    setIsResetConfirmOpen(true);
  }, []);

  const confirmReset = useCallback(() => {
    // 空にすることで、既定順を変えたときにその変更が届く（save と同じ理由）
    resetOrder();
    setDraft(undefined);
    setIsResetConfirmOpen(false);
    onReset?.();
  }, [onReset, resetOrder]);

  const cancelReset = useCallback(() => {
    setIsResetConfirmOpen(false);
  }, []);

  return {
    order: draft ?? savedOrder,
    isEditing,
    hasUnsavedChanges,
    canResetToDefault,
    isDiscardConfirmOpen,
    isResetConfirmOpen,
    unlock,
    updateDraft,
    requestDiscard,
    toggleLock: isEditing ? requestDiscard : unlock,
    confirmDiscard,
    cancelDiscard,
    save,
    requestReset,
    confirmReset,
    cancelReset,
  };
}
