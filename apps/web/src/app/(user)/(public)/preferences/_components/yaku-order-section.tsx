"use client";

import { useCallback, useId, useMemo } from "react";
import { useTranslations } from "next-intl";
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

import { Button } from "@/app/(user)/_components/button";
import { useYakuLabel } from "@/app/_hooks/use-yaku-options";
import {
  useHasCustomYakuOrder,
  useYakuOrder,
  useYakuOrderStore,
} from "@/app/_hooks/use-yaku-order-store";
import { PREFERENCE_ANCHORS } from "../_lib/anchors";

interface SortableYakuRowProps {
  readonly name: string;
  readonly label: string;
  readonly position: number;
}

/** 並べ替えできる 1 行。行全体をつまめるようにする（小さなハンドルは指で外しやすい） */
function SortableYakuRow({ name, label, position }: SortableYakuRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: name });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex touch-none items-center gap-3 border-b-2 border-dashed border-border/40 bg-white px-4 py-3 last:border-0 ${
        isDragging ? "relative z-10 shadow-hard" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <span className="w-6 shrink-0 text-right text-xs tabular-nums text-surface-400">
        {position}
      </span>
      <span className="flex-1 text-sm text-surface-900">{label}</span>
      <GripIcon />
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

/**
 * 役の並び順設定セクション
 *
 * 役の選択練習と点数計算練習の選択肢の並びを、よく使う順に並べ替える。
 * 既定は出現率の高い順で、並べ替えは端末ローカルに保存される。
 * 出題内容も正解判定も変わらない。
 */
export function YakuOrderSection() {
  const t = useTranslations("settings.yakuOrder");
  const order = useYakuOrder();
  const labelOf = useYakuLabel();
  const setOrder = useYakuOrderStore((s) => s.setOrder);
  const reset = useYakuOrderStore((s) => s.reset);
  const hasCustomOrder = useHasCustomYakuOrder();
  const describedBy = useId();

  const sensors = useSensors(
    // 指を置いただけでは動かさない。リストのスクロールと取り合いにならないようにする。
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over === null || active.id === over.id) return;

      const from = order.indexOf(String(active.id));
      const to = order.indexOf(String(over.id));
      if (from === -1 || to === -1) return;

      setOrder(arrayMove([...order], from, to));
    },
    [order, setOrder],
  );

  const items = useMemo(() => [...order], [order]);

  return (
    <div
      id={PREFERENCE_ANCHORS.yakuOrder}
      className="scroll-mt-24 space-y-3 target:rounded-lg target:bg-primary-50"
    >
      <p id={describedBy} className="text-sm leading-relaxed text-surface-600">
        {t("description")}
      </p>

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
          onClick={reset}
          disabled={!hasCustomOrder}
        >
          {t("reset")}
        </Button>
      </div>
    </div>
  );
}
