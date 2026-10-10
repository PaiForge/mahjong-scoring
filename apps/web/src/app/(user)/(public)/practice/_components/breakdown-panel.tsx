"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import { ToggleGroup } from "@/app/(user)/_components/toggle-group";
import type { BreakdownKind } from "@mahjong-scoring/features/results/breakdown-tabs";

/** 切り替えの 1 枠（翻数の内訳 / 符の内訳） */
export interface BreakdownPanelSection {
  readonly kind: BreakdownKind;
  /** 切り替えの文言。何の内訳かと、その合計（例: 「翻数 3翻」） */
  readonly tabLabel: ReactNode;
  /** 選んだときに出す内訳の表 */
  readonly content: ReactNode;
}

interface BreakdownPanelProps {
  /** 開閉の入口の文言（「内訳を確認」） */
  readonly title: string;
  /** 並べる内訳。並びはこの配列の順（`resolveBreakdownTabs` の `kinds`） */
  readonly sections: readonly BreakdownPanelSection[];
  /** 開いたときに選ぶ内訳。省略時は先頭 */
  readonly initialKind?: BreakdownKind;
}

/**
 * 翻数・符の内訳をまとめた展開エリア
 * 内訳パネル
 *
 * 答え合わせの表の下に 1 行の入口だけを置き、開いたときだけ
 * 「翻数 / 符」の切り替え（面子分解のモーダルと同じ {@link ToggleGroup}）と
 * 選んだ内訳を出す。以前は翻数・符の行の直後にそれぞれ開閉の器を挟んで
 * いたが、開くと翻・符・点数の比較が縦に引き離され、両方開くと表が内訳に
 * 埋もれた。入口を 1 つにすれば閉じている間の丈は 1 行で済み、開いても
 * 答え合わせの表は分断されない。
 *
 * 切り替えを最初から出す案は採らなかった。内訳は数え直したい人が開くもので、
 * 閉じている間に切り替えの段まで領域を取ると「次の問題へ」が押し出される。
 * 内訳をモーダルで出す案も、手牌・回答と見比べられなくなるため採らなかった。
 *
 * - 既定で閉じる。不正解でも勝手に開かない（理由は {@link import("./collapsible-detail").CollapsibleDetail}）
 * - 開いたときの選択は呼び出し側が `initialKind` で渡す（間違えたほうの内訳）。
 *   ユーザーが選び直したらそれを保つ
 * - 内訳が 1 種類なら切り替えを出さず、その内訳をそのまま出す
 * - 問題が変わったら閉じた状態に戻す。置く側が問題ごとに作り直す（`key`）
 *
 * 入口は行全体を押せる 1 行（`min-h-11`）にする。直下に全幅の
 * 「次の問題へ」が続くため、文字の高さだけを当たり判定にすると外れた指が
 * ボタンに吸われる。▶ が開くと回るのは {@link import("@/app/(user)/_components/accordion-card").AccordionCard}
 * と同じ約束。閉じている間は中身を描画しない。
 */
export function BreakdownPanel({
  title,
  sections,
  initialKind,
}: BreakdownPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chosenKind, setChosenKind] = useState<BreakdownKind | undefined>(
    undefined,
  );
  const panelId = useId();

  const selected =
    sections.find((section) => section.kind === chosenKind) ??
    sections.find((section) => section.kind === initialKind) ??
    sections[0];
  if (selected === undefined) return undefined;

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex min-h-11 w-full cursor-pointer items-center gap-2 text-left text-sm text-surface-600 transition-colors hover:text-foreground"
      >
        <svg
          className={`size-3 shrink-0 text-surface-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
        {title}
      </button>
      {isOpen && (
        <div id={panelId} className="space-y-3 pb-1">
          {sections.length > 1 && (
            <div className="flex justify-center">
              <ToggleGroup
                options={sections.map((section) => ({
                  value: section.kind,
                  label: section.tabLabel,
                }))}
                selected={selected.kind}
                onChange={setChosenKind}
              />
            </div>
          )}
          {/* 内訳の表は合計の線を持つので、答え合わせの表の罫線と紛れない
              よう白い面に沈める（以前の DetailsPanelRow と同じ理由） */}
          <div className="rounded-panel border border-panel bg-white p-3">
            {selected.content}
          </div>
        </div>
      )}
    </div>
  );
}
