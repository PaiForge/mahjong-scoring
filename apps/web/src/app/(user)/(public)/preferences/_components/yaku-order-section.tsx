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
  /** つまめるか。施錠中は指の動きをページのスクロールに渡す */
  readonly sortable: boolean;
}

/** 並べ替えできる 1 行。行全体をつまめるようにする（小さなハンドルは指で外しやすい） */
function SortableYakuRow({
  name,
  label,
  position,
  sortable,
}: SortableYakuRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: name, disabled: !sortable });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      // touch-none は解錠中だけ付ける。付けたままだと一覧の上でブラウザの
      // 縦スクロールが起きず、スクロールのつもりの指の動きがすべて
      // 並べ替えになる（実機で少し触っただけで行が動いていた）。
      className={`flex items-center gap-3 border-b-2 border-dashed border-border/40 bg-white px-4 py-3 last:border-0 ${
        sortable ? "touch-none" : ""
      } ${isDragging ? "relative z-10 shadow-hard" : ""}`}
      {...(sortable ? attributes : {})}
      {...(sortable ? listeners : {})}
    >
      <span className="w-6 shrink-0 text-right text-xs tabular-nums text-surface-400">
        {position}
      </span>
      <span className="flex-1 text-sm text-surface-900">{label}</span>
      {sortable && <GripIcon />}
    </li>
  );
}

/** つまめることを示す点線グリップ */
function GripIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      className="shrink-0 text-surface-300"
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
 * 役の選択練習と点数計算練習の選択肢の並びを、よく使う順に並べ替える。
 * 出題内容も正解判定も変わらない。
 *
 * 施錠を挟むのは、指で触っただけで並びが変わるのを防ぐため。並べ替えを
 * 成立させるには行に `touch-action: none` が要るが、張ったままだと一覧の上で
 * ページがスクロールできない。施錠中は読むだけの一覧に戻し、解錠したときだけ
 * つまめるようにして、この二律背反を状態で分ける。
 *
 * 解錠中の並べ替えは下書きに溜め、「保存」で初めて永続化する。即時保存だと
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
  const isEditing = draft !== null;
  const items = useMemo(() => [...(draft ?? savedOrder)], [draft, savedOrder]);
  const isDefaultOrder = isSameOrder(items, YAKU_DEFAULT_ORDER);
  const hasUnsavedChanges = draft !== null && !isSameOrder(draft, savedOrder);

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
    // 並べ替えていないなら確認を挟まない。誤って触れただけのタップまで
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

  const handleResetToDefault = useCallback(() => {
    // 施錠中に押されたときは解錠も兼ねる。戻した並びは保存前に見せたいので、
    // 永続化せず下書きに置くところまでを行う。
    setDraft([...YAKU_DEFAULT_ORDER]);
  }, []);

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
          onClick={handleResetToDefault}
          disabled={isDefaultOrder}
        >
          {t("reset")}
        </Button>
      </div>

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
