import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { BOARD_AREA_HEIGHT } from "../_lib/board-area-height";
import type { PlayBoardHeight } from "../_lib/board-area-height";
import { START_BUTTON_HEIGHT_CLASS } from "./practice-start-cta-skeleton";

/**
 * 手牌の盤面のプレースホルダ
 *
 * 実物（`TehaiDisplay` の `fullBleed`）は <sm で白カードの左右パディングを
 * 打ち消して画面端まで広がり、角も落ちる。同じだけ外へ出す。高さは牌が列の幅に
 * 合わせて縮むぶん幅で変わるので 2 点で測った値を持つ。
 */
function TehaiRect({ heightClass }: { readonly heightClass: string }) {
  return (
    <SkeletonBar
      radius="fullBleed"
      className={`${heightClass} -mx-4 w-auto sm:mx-0 sm:w-full`}
      tone={100}
    />
  );
}

/** 設問文（「この和了の点数を回答してください」）の 1 行 */
function PromptLine() {
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

/**
 * 点数を select で答える盤面のスケルトン（昇級試験 5 種）
 *
 * 実物は `space-y-6` に 盤面 / 設問文 / 回答フォーム（`space-y-5` に
 * ラベル + select、送信ボタン）。実測（幅 390px / 1280px）で
 * 盤面 124/130px・設問 20px・フォーム 144px。
 */
function ScoreSelectSkeleton() {
  return (
    <div className="mt-4 space-y-6">
      <TehaiRect heightClass="h-[124px] sm:h-[130px]" />
      <PromptLine />
      <div className="space-y-5">
        <div>
          <SkeletonBar className="mb-2 h-4 w-24" tone={100} />
          <SkeletonBar radius="lg" className="h-[50px] w-full" tone={100} />
        </div>
        <SkeletonBar
          radius="lg"
          className={`${START_BUTTON_HEIGHT_CLASS} w-full`}
        />
      </div>
    </div>
  );
}

/**
 * 選択肢グリッドで答える盤面のスケルトン（合計符の試験）
 *
 * 実物は `space-y-4` に 盤面 / 設問文 / 3 列 11 個のグリッド。実測
 * （幅 390px / 1280px）で 盤面 106/114px・選択肢 1 個 66/70px・グリッド全体
 * 300/316px。
 */
function ChoiceGridSkeleton() {
  return (
    <div className="mt-4 space-y-4">
      <TehaiRect heightClass="h-[106px] sm:h-[114px]" />
      <PromptLine />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 11 }).map((_, index) => (
          <SkeletonBar
            key={index}
            radius="lg"
            className="h-[66px] sm:h-[70px]"
            tone={100}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 解いている画面の盤面エリアのスケルトン
 * 盤面スケルトン
 *
 * 盤面・設問・回答欄をひと続きの矩形 1 枚で塗ると、実物と形が違うだけでなく
 * 「何を待っているのか」も読めない。実物と同じ部品の並びで置く。
 *
 * 形まで写すのは昇級試験の 2 種だけ。このフォールバックが実際に出るのは
 * 試験だけで（通常の練習の play は静的でプリフェッチされる）、盤面の形は
 * 練習ごとに違うため、他は高さだけを確保した矩形 1 枚で待つ。
 *
 * 実物の色（盤面の濃緑・ボタンの緑）は写さず灰色にする（`ExamIntroSkeleton`
 * と同じ理由 — 読み込み中の画面が実物より賑やかに見えるため）。高さは
 * border-box なので枠を外しても実物と一致したままになる。
 */
export function PlayBoardSkeleton({
  boardHeight,
}: {
  readonly boardHeight: PlayBoardHeight;
}) {
  if (boardHeight === "scoreExam") return <ScoreSelectSkeleton />;
  if (boardHeight === "fuExam") return <ChoiceGridSkeleton />;

  return (
    <SkeletonBar
      radius="fullBleed"
      className={`${BOARD_AREA_HEIGHT[boardHeight]} -mx-4 mt-4 w-auto sm:mx-0 sm:w-full`}
      tone={100}
    />
  );
}
