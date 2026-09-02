import type { ReactNode } from "react";

import { SkeletonBar } from "@/app/_components/skeleton-bar";
import type { PlayBoardHeight } from "../_lib/board-area-height";
import { START_BUTTON_HEIGHT_CLASS } from "./practice-start-cta-skeleton";

/**
 * 手牌の盤面のプレースホルダ
 *
 * 実物（`TehaiDisplay` の `fullBleed`）は <sm で白カードの左右パディングを
 * 打ち消して画面端まで広がり、端に接する角も落ちる。同じだけ外へ出す。
 * 高さは牌が列の幅に合わせて縮むぶん幅で変わるので 2 点で測った値を持つ。
 */
function BoardRect({ heightClass }: { readonly heightClass: string }) {
  return (
    <SkeletonBar
      radius="fullBleed"
      className={`${heightClass} -mx-4 w-auto sm:mx-0 sm:w-full`}
      tone={100}
    />
  );
}

/** 設問文（「この和了の点数を回答してください」など）の 1 行。実測 20px */
function Prompt() {
  return (
    <p className="text-center text-sm">
      <SkeletonBar
        as="span"
        className="inline-block w-56 max-w-full"
        tone={100}
      >
        &nbsp;
      </SkeletonBar>
    </p>
  );
}

/** 枠を持つパネル（役一覧・条件の提示・役名の見出しなど）1 枚 */
function Panel({ heightClass }: { readonly heightClass: string }) {
  return (
    <SkeletonBar radius="xl" className={`${heightClass} w-full`} tone={100} />
  );
}

/** 選択肢のグリッド。列数と個数と 1 個の高さは盤面ごとに違う */
function Choices({
  columns,
  count,
  itemClass,
}: {
  readonly columns: "grid-cols-2" | "grid-cols-3";
  readonly count: number;
  readonly itemClass: string;
}) {
  return (
    <div className={`grid ${columns} gap-3`}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBar key={index} radius="lg" className={itemClass} tone={100} />
      ))}
    </div>
  );
}

/** 縦に積む行のリスト（符目ごとの内訳・翻数の選択肢など） */
function Rows({
  count,
  itemClass,
  gapClass = "space-y-2",
}: {
  readonly count: number;
  readonly itemClass: string;
  readonly gapClass?: string;
}) {
  return (
    <div className={gapClass}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBar key={index} radius="lg" className={itemClass} tone={100} />
      ))}
    </div>
  );
}

/** 送信ボタン（`LinkButton size="lg"` と同じ 50px） */
function SubmitButton() {
  return (
    <SkeletonBar
      radius="lg"
      className={`${START_BUTTON_HEIGHT_CLASS} w-full`}
    />
  );
}

/**
 * 点数を select で答える回答フォーム（`space-y-5` にラベル + select と送信
 * ボタン）。実測 144px で、幅によらない
 */
function ScoreAnswerForm() {
  return (
    <div className="space-y-5">
      <div>
        <SkeletonBar className="mb-2 h-4 w-24" tone={100} />
        <SkeletonBar radius="lg" className="h-[50px] w-full" tone={100} />
      </div>
      <SubmitButton />
    </div>
  );
}

/**
 * 盤面ごとのスケルトンの形
 * 盤面形状
 *
 * 実物の部品の並びをそのまま置く。寸法はすべて実測値（2026-09、幅 390px と
 * 1280px の 2 点。牌も選択肢も列の幅で畳まれるため片方では足りない）。
 * 盤面を作り替えたら測り直すこと。
 *
 * 外側の余白（`mt-*`）と部品の間隔（`space-y-*`）も実物に合わせる。ここが
 * 違うと部品の高さが合っていても位置がずれる。
 */
const SHAPES: Readonly<Record<PlayBoardHeight, () => ReactNode>> = {
  // 昇級試験 5 種。盤面 / 設問 / ラベル + select / 送信ボタン
  scoreExam: () => (
    <div className="mt-4 space-y-6">
      <BoardRect heightClass="h-[124px] sm:h-[136px]" />
      <Prompt />
      <ScoreAnswerForm />
    </div>
  ),
  // 合計符の試験。選択肢は 3 列 11 個
  fuExam: () => (
    <div className="mt-4 space-y-4">
      <BoardRect heightClass="h-[106px] sm:h-[114px]" />
      <Prompt />
      <Choices
        columns="grid-cols-3"
        count={11}
        itemClass="h-[66px] sm:h-[70px]"
      />
    </div>
  ),
  // 点数計算。試験と同じ構図で盤面だけ少し高い
  scoreCalculation: () => (
    <div className="mt-4 space-y-6">
      <BoardRect heightClass="h-[124px] sm:h-[140px]" />
      <Prompt />
      <ScoreAnswerForm />
    </div>
  ),
  // 満貫以上点数計算。盤面と設問の間に成立役の一覧が入る。役の数で高さが
  // 変わる（実測 136〜232px）ため一致させられない。低い側に置いて、実体が
  // 現れたときに縮むより伸びる方に倒す（縮む方が目立つため）
  manganScoreCalculation: () => (
    <div className="mt-4 space-y-6">
      <BoardRect heightClass="h-[124px] sm:h-[144px]" />
      <Panel heightClass="h-[136px]" />
      <Prompt />
      <ScoreAnswerForm />
    </div>
  ),
  // 雀頭符。手牌ではなく雀頭の 2 枚だけを出す
  jantouFu: () => (
    <div className="mt-6 space-y-5">
      <SkeletonBar className="mx-auto h-[48px] w-32" tone={100} />
      <Prompt />
      <Choices columns="grid-cols-2" count={4} itemClass="h-[100px]" />
    </div>
  ),
  // 待ち符。待ちの形を 2 段で見せる
  machiFu: () => (
    <div className="mt-6 space-y-5">
      <SkeletonBar className="mx-auto h-[213px] w-full" tone={100} />
      <Prompt />
      <Choices
        columns="grid-cols-2"
        count={2}
        itemClass="h-[66px] sm:h-[70px]"
      />
    </div>
  ),
  // 面子符。面子 1 つと和了方法の見出し
  mentsuFu: () => (
    <div className="mt-6 space-y-5">
      <SkeletonBar className="mx-auto h-[101px] w-full" tone={100} />
      <Prompt />
      <Choices
        columns="grid-cols-3"
        count={6}
        itemClass="h-[66px] sm:h-[70px]"
      />
    </div>
  ),
  // 手牌の符。符目ごとの行が 5 つ積み上がって最も高い
  mentsuJantouFu: () => (
    <div className="mt-4 space-y-4">
      <BoardRect heightClass="h-[95px] sm:h-[114px]" />
      <Prompt />
      <Rows count={5} itemClass="h-[125px] w-full" />
      <div className="mt-4">
        <SubmitButton />
      </div>
    </div>
  ),
  // 合計符。選択肢は 3 列 11 個
  totalFu: () => (
    <div className="mt-4 space-y-4">
      <BoardRect heightClass="h-[106px] sm:h-[117px]" />
      <Prompt />
      <Choices
        columns="grid-cols-3"
        count={11}
        itemClass="h-[66px] sm:h-[70px]"
      />
    </div>
  ),
  // 役判定。役の一覧パネルと選択中のチップ行、送信ボタン
  yaku: () => (
    <div className="mt-4 space-y-4">
      <BoardRect heightClass="h-[110px] sm:h-[144px]" />
      <Prompt />
      <Panel heightClass="h-[287px] sm:h-[414px]" />
      <SkeletonBar className="h-[46px] w-full" tone={100} />
      <div className="mt-4">
        <SubmitButton />
      </div>
    </div>
  ),
  // 翻数即答。設問文は選択肢と同じ節の中にあり、盤面の直後には無い
  hanCount: () => (
    <div className="mt-4 space-y-4">
      <BoardRect heightClass="h-[117px] sm:h-[144px]" />
      <div className="space-y-3">
        <Prompt />
        <SkeletonBar
          radius="lg"
          className="h-[256px] w-full sm:h-[190px]"
          tone={100}
        />
      </div>
    </div>
  ),
  // 点数表早引き。手牌を持たず、条件のパネルと回答フォームだけ
  scoreTable: () => (
    <div className="mt-6 space-y-6">
      <Panel heightClass="h-[170px]" />
      <SkeletonBar radius="lg" className="h-[74px] w-full" tone={100} />
    </div>
  ),
  // 役の翻数。役名のパネルと翻数の選択肢
  yakuHan: () => (
    <div className="mt-4 space-y-6">
      <Panel heightClass="h-[142px]" />
      <div className="space-y-3">
        <Prompt />
        <SkeletonBar
          radius="lg"
          className="h-[124px] w-full sm:h-[58px]"
          tone={100}
        />
      </div>
    </div>
  ),
};

/**
 * 解いている画面の盤面エリアのスケルトン
 * 盤面スケルトン
 *
 * 盤面・設問・回答欄をひと続きの矩形 1 枚で塗ると、実物と形が違うだけでなく
 * 「何を待っているのか」も読めない。実物と同じ部品の並びで置く。
 *
 * 実物の色（盤面の濃緑・ボタンの緑・役一覧の琥珀）は写さず灰色にする
 * （`ExamIntroSkeleton` と同じ理由 — 読み込み中の画面が実物より賑やかに
 * 見えるため）。高さは border-box なので枠を外しても実物と一致したままになる。
 */
export function PlayBoardSkeleton({
  boardHeight,
}: {
  readonly boardHeight: PlayBoardHeight;
}) {
  return SHAPES[boardHeight]();
}
