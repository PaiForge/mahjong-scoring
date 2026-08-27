"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { YAKU_DEFAULT_ORDER } from "@mahjong-scoring/core";

import { Button } from "@/app/(user)/_components/button";
import { ConfirmationModal } from "@/app/(user)/_components/confirmation-modal";
import { LockClosedIcon } from "@/app/(user)/_components/icons/lock-closed-icon";
import { LockOpenIcon } from "@/app/(user)/_components/icons/lock-open-icon";
import { useYakuLabel } from "@/app/_hooks/use-yaku-options";
import {
  useYakuOrder,
  useYakuOrderStore,
} from "@/app/_hooks/use-yaku-order-store";

interface SortableYakuRowProps {
  readonly name: string;
  readonly label: string;
  readonly position: number;
  /** つまめるか。施錠中はつまみ自体を出さない */
  readonly sortable: boolean;
  /** つまみの読み上げ名 */
  readonly handleLabel: string;
}

/**
 * 並び替えできる 1 行
 *
 * つまめるのは右端のつまみだけにする。行全体をつまめるようにすると、行に
 * `touch-action: none` が要るぶん一覧の上でページがスクロールできなくなり、
 * スクロールのつもりの指の動きがすべて並び替えになる（実機で確認）。
 * つまみは行の余白へはみ出させて 44px の指の的を確保しつつ、
 * 負のマージンで行の高さは変えない。
 */
function SortableYakuRow({
  name,
  label,
  position,
  sortable,
  handleLabel,
}: SortableYakuRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: name, disabled: !sortable });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 border-b-2 border-dashed border-border/40 bg-white px-4 py-3 last:border-0 ${
        isDragging ? "relative z-10 shadow-hard" : ""
      }`}
    >
      <span className="w-6 shrink-0 text-right text-xs tabular-nums text-surface-400">
        {position}
      </span>
      <span className="flex-1 text-sm text-surface-900">{label}</span>
      {sortable && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          aria-label={`${label} — ${handleLabel}`}
          className="-my-3 flex size-11 shrink-0 touch-none cursor-grab items-center justify-center rounded-md text-surface-400 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripIcon />
        </button>
      )}
    </li>
  );
}

/** つまめることを示す点線グリップ */
function GripIcon({ className = "shrink-0" }: { readonly className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      className={className}
      fill="currentColor"
    >
      <circle cx="6" cy="4" r="1.4" />
      <circle cx="10" cy="4" r="1.4" />
      <circle cx="6" cy="8" r="1.4" />
      <circle cx="10" cy="8" r="1.4" />
      <circle cx="6" cy="12" r="1.4" />
      <circle cx="10" cy="12" r="1.4" />
    </svg>
  );
}

/** 2 つの並びが同じ役を同じ順で持つか */
function isSameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((name, index) => name === b[index]);
}

/**
 * 役の並び順設定セクション
 *
 * 役の選択練習と点数計算練習の選択肢の並びを、よく使う順に並び替える。
 * 出題内容も正解判定も変わらない。
 *
 * 施錠を挟むのは、指で触っただけで並びが変わるのを防ぐため。施錠中は
 * つまみを出さない読むだけの一覧に戻し、解錠したときだけつまめるようにする。
 * つまめる範囲を右端のつまみに限るのは {@link SortableYakuRow} の理由による。
 *
 * 解錠中の並び替えは下書きに溜め、「保存」で初めて永続化する。即時保存だと
 * 保存された瞬間が画面のどこにも出ず、かといって保存ボタンを一覧の下に置くと
 * 36 行の先で見つからない。鍵と保存を一覧の上の追従バーに同居させ、
 * 操作とその結果を同じ場所に置く。
 *
 * 追従バーは施錠中と解錠中で地の色を変える。施錠中に一覧と同じ白＋太枠で
 * 置くと表の一部に見えて鍵に気づかないため、地色だけの静かな帯にする。
 * 解錠中は琥珀（アプリで「本筋の隣に置く箱」に使っている色）の枠を出し、
 * 一時的なモードに入っていることを主張する。枠の太さは両方 3 のまま
 * 色だけを透明にして、切り替えで高さが動かないようにする。
 */
export function YakuOrderSection() {
  const t = useTranslations("settings.yakuOrder");
  const savedOrder = useYakuOrder();
  const labelOf = useYakuLabel();
  const setOrder = useYakuOrderStore((s) => s.setOrder);
  const resetOrder = useYakuOrderStore((s) => s.reset);
  const describedBy = useId();

  /** 解錠中の並び。null なら施錠中で、保存済みの並びをそのまま映す */
  const [draft, setDraft] = useState<readonly string[] | null>(null);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const isEditing = draft !== null;
  const items = useMemo(() => [...(draft ?? savedOrder)], [draft, savedOrder]);
  const hasUnsavedChanges = draft !== null && !isSameOrder(draft, savedOrder);
  // 戻す先が今の状態と同じなら押させない。保存済みが既定でも、下書きに
  // 保存していない並び替えが残っていれば戻す意味がある。
  const canResetToDefault =
    !isSameOrder(savedOrder, YAKU_DEFAULT_ORDER) || hasUnsavedChanges;

  const sensors = useSensors(
    // 指を置いただけでは動かさない。リストのスクロールと取り合いにならないようにする。
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over === null || active.id === over.id) return;

    setDraft((current) => {
      if (current === null) return current;
      const from = current.indexOf(String(active.id));
      const to = current.indexOf(String(over.id));
      if (from === -1 || to === -1) return current;
      return arrayMove([...current], from, to);
    });
  }, []);

  const handleUnlock = useCallback(() => {
    setDraft([...savedOrder]);
  }, [savedOrder]);

  const handleRequestDiscard = useCallback(() => {
    // 並び替えていないなら確認を挟まない。誤って触れただけのタップまで
    // 確認で止めると、何も失わない操作にモーダルを見せることになる。
    if (!hasUnsavedChanges) {
      setDraft(null);
      return;
    }
    setIsDiscardConfirmOpen(true);
  }, [hasUnsavedChanges]);

  const handleConfirmDiscard = useCallback(() => {
    setIsDiscardConfirmOpen(false);
    setDraft(null);
  }, []);

  // 鍵を閉じる操作は「取り消す」と同じ経路を通す。見た目が違うだけで
  // することは同じなので、確認の有無が食い違わないようにする。
  const handleToggleLock = isEditing ? handleRequestDiscard : handleUnlock;

  const handleSave = useCallback(() => {
    if (draft === null) return;
    // 既定順そのものは保存しない。保存してしまうと既定順を変えたときに
    // その変更が届かなくなる（use-yaku-order-store の order を参照）。
    if (isSameOrder(draft, YAKU_DEFAULT_ORDER)) {
      resetOrder();
    } else {
      setOrder(draft);
    }
    setDraft(null);
    setIsDiscardConfirmOpen(false);
    toast.success(t("savedToast"));
  }, [draft, resetOrder, setOrder, t]);

  const handleConfirmReset = useCallback(() => {
    // 既定順そのものは保存しない（handleSave と同じ理由）。空にすることで
    // 既定順を変えたときにその変更が届く。
    resetOrder();
    setDraft(null);
    setIsResetConfirmOpen(false);
    toast.success(t("resetToast"));
  }, [resetOrder, t]);

  return (
    <div className="space-y-3">
      <p id={describedBy} className="text-sm leading-relaxed text-surface-600">
        {t("description")}
      </p>

      {/* 一覧が 36 行あるため、鍵と保存は追従させないと画面外に出る。
          画面下に固定すると MobileTabBar と重なるので上に置く
          （このアプリの Header は sticky ではないので top-0 でよい）。 */}
      <div
        className={`sticky top-0 z-20 flex items-center gap-2 rounded-lg border-3 px-2 py-2 ${
          isEditing
            ? "border-amber-500 bg-amber-50 shadow-hard"
            : "border-transparent bg-surface-100"
        }`}
      >
        <button
          type="button"
          onClick={handleToggleLock}
          aria-pressed={isEditing}
          aria-label={isEditing ? t("lockAria") : t("unlockAria")}
          className={`flex size-11 shrink-0 items-center justify-center rounded-md ${
            isEditing ? "text-amber-700" : "text-surface-500"
          }`}
        >
          {isEditing ? <LockOpenIcon /> : <LockClosedIcon />}
        </button>

        <span
          className={`flex-1 text-sm ${
            isEditing ? "font-bold text-amber-900" : "text-surface-600"
          }`}
        >
          {isEditing ? t("editingLabel") : t("lockedLabel")}
        </span>

        {isEditing && (
          <>
            <Button variant="neutral" size="sm" onClick={handleRequestDiscard}>
              {t("cancel")}
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {t("save")}
            </Button>
          </>
        )}
      </div>

      {/* つまめるのが右端だけなのは見ただけでは分からないため、解錠したときに
          その場で言う。つまみの実物を文中に置き、一覧の同じ側（右）へ寄せて、
          説明とその対象を目で結べるようにする */}
      {isEditing && (
        <p className="px-1 text-right text-xs leading-relaxed text-surface-500">
          {t.rich("dragHint", {
            handle: () => <GripIcon className="inline-block align-middle" />,
          })}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border-3 border-ink bg-white">
        {/* id を渡さないと dnd-kit が内部カウンタで aria-describedby を振り、
            SSR とクライアントでずれてハイドレーション不一致になる */}
        <DndContext
          id="yaku-order"
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <ul aria-describedby={describedBy}>
              {items.map((name, index) => (
                <SortableYakuRow
                  key={name}
                  name={name}
                  label={labelOf(name)}
                  position={index + 1}
                  sortable={isEditing}
                  handleLabel={t("dragHandleAria")}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>

      <div className="flex justify-end">
        <Button
          variant="neutral"
          size="sm"
          onClick={() => setIsResetConfirmOpen(true)}
          disabled={!canResetToDefault}
        >
          {t("reset")}
        </Button>
      </div>

      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title={t("resetTitle")}
        confirmText={t("resetConfirm")}
        cancelText={t("resetCancel")}
        confirmVariant="danger"
      />

      <ConfirmationModal
        isOpen={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        onConfirm={handleConfirmDiscard}
        title={t("discardTitle")}
        message={t("discardMessage")}
        confirmText={t("discardConfirm")}
        cancelText={t("discardCancel")}
        confirmVariant="danger"
      />
    </div>
  );
}
