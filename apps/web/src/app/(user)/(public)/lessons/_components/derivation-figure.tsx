import type { ReactNode } from "react";

import { ArrowRightIcon } from "@/app/(user)/_components/icons/arrow-right-icon";
import { TABLE_HIGHLIGHT_CELL_CLASS } from "@/app/(user)/_components/_lib/table-highlight";

interface DerivationFigureProps {
  /** 図の上に出す見出し（どの符・翻、どの区分の話かを言う） */
  readonly caption: string;
  /** 鎖の中身。{@link DerivationStep} と {@link DerivationArrow} を交互に並べる */
  readonly children: ReactNode;
  /** 鎖の下に置く答え合わせや一言。破線で区切って出す */
  readonly footer?: ReactNode;
}

/**
 * 「ある数字から別の数字を導く」章の図の外殻
 * 導出図
 *
 * 点数表の規則性を扱う章は、どれも同じ形の絵を描く — 出発点の数字があり、
 * 矢印にその場で何をしたかが書いてあり、着いた先が強調される。教本には
 * 今のところ 3 枚あり（満貫以上の子ツモ・親ツモ、点数記憶術のロン→ツモと
 * ツモの持ち越し）、枠・見出し・矢印・段の体裁をここへ集約する。
 *
 * 鎖の項数は図によって違う（半分ずつは 2 手、3 で割るのは 1 手）ので、
 * 中身は呼び出し側が並べる。この部品が決めるのは体裁と、狭い画面で
 * 矢印が下を向いて縦に積むことだけ。
 */
export function DerivationFigure({
  caption,
  children,
  footer,
}: DerivationFigureProps) {
  return (
    <figure className="space-y-3 rounded-xl border-3 border-ink bg-white p-5">
      <figcaption className="text-xs font-semibold tracking-wider text-surface-400 uppercase">
        {caption}
      </figcaption>

      {/* 狭い画面では矢印を下向きにして縦に積む */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-5">
        {children}
      </div>

      {footer}
    </figure>
  );
}

interface DerivationStepProps {
  /** その数字が何を指す額なのか */
  readonly label: string;
  /** 数字。点数表と同じ体裁で見せたい段は `TsumoScore` を通して渡す */
  readonly children: ReactNode;
  /** 導出の結果として強調するか（出発点や途中の項は強調しない） */
  readonly highlighted?: boolean;
}

/** 鎖の1項。導出の途中で出た数字を、何を指す額なのかと一緒に置く */
export function DerivationStep({
  label,
  children,
  highlighted = false,
}: DerivationStepProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium text-surface-500">{label}</span>
      <span
        className={
          highlighted
            ? `rounded-md px-3 py-1 text-lg font-bold text-primary-700 ${TABLE_HIGHLIGHT_CELL_CLASS}`
            : "px-3 py-1 text-lg font-semibold text-surface-900"
        }
      >
        {children}
      </span>
    </div>
  );
}

/** 鎖のつなぎ目。矢印の下に、そこで何をしたのかを書く */
export function DerivationArrow({ label }: { readonly label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-surface-500">
      <ArrowRightIcon className="size-6 rotate-90 sm:rotate-0" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

/**
 * 鎖の下に置く答え合わせの段（破線で区切り、点数表の実際の値を見せる）
 * 導出図の答え合わせ
 */
export function DerivationResult({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-center gap-3 border-t-2 border-dashed border-surface-200 pt-3">
      <span className="text-xs font-medium text-surface-500">{label}</span>
      <span className="text-lg font-semibold text-surface-900">{children}</span>
    </div>
  );
}
