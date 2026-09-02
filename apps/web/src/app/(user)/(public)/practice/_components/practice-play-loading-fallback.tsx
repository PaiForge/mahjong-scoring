import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { useScrollToElement } from "../_hooks/use-scroll-to-element";
import type { PlayBoardHeight } from "../_lib/board-area-height";
import { PlayBoardSkeleton } from "./play-board-skeleton";
import { PRACTICE_SCROLL_ANCHOR_ID } from "../_lib/scroll-anchor";

/**
 * 状態バーの高さ（`ChallengeShell` の実測 48px）。円形タイマー
 * （`QuizTimer` の既定 size=48）がそのまま高さを決める。
 */
const TIMER_SIZE_CLASS = "size-12";

interface PracticePlayLoadingFallbackProps {
  /** 練習名（実物の見出しと同じ文字列） */
  readonly practiceTitle: string;
  /**
   * 残機の数（レジストリの `mistakeLimit`）。
   *
   * 通常のチャレンジは 3 だが昇級試験は 1。ハートの数がそのまま
   * 「あと何回間違えられるか」を示すため、固定値で描くと試験のスケルトンが
   * 実物より 2 個多い残機を見せてしまう。
   */
  readonly mistakeLimit: number;
  /** 盤面エリアの高さ（既定 standard。{@link BOARD_AREA_HEIGHT} 参照） */
  readonly boardHeight?: PlayBoardHeight;
}

/**
 * play / training ルートのローディングフォールバック
 * プレイ画面ローディング
 *
 * @description
 * 汎用の `PageSkeleton`（見出し + 3 行 + カード 4 枚）は読み物のページの形で、
 * 解いている画面とは別物だった。実物は狭い 1 列（`max-w-lg`）に、円形タイマーと
 * 残機の状態バー（48px）・盤面・正誤カウンタと終了操作のフッター（112px）が
 * 縦に並ぶ。
 *
 * @remarks
 * 昇級試験の play は受験ガードが cookie を読むため動的ルートで、開始を押すたび
 * このフォールバックを通る。通常の練習の play は静的でプリフェッチされるため
 * 出番は少ないが、形は同じなので分けていない。
 *
 * 列の幅は `max-w-lg`。実物は練習ごとに `max-w-lg` / `max-w-2xl` と違うが、
 * `loading.tsx` からは知りようがない（play 画面の props であって
 * レジストリの持ち物ではない）。このフォールバックが実際に出るのは
 * 昇級試験の 5 つで、いずれも `max-w-lg` なので狭い方に寄せている。
 */
export function PracticePlayLoadingFallback({
  practiceTitle,
  mistakeLimit,
  boardHeight = "scoreExam",
}: PracticePlayLoadingFallbackProps) {
  // 実物（`ChallengeShell`）と同じ位置まで送っておく。ここで送らないと、
  // 中身が届いた瞬間にグローバルヘッダとタイトル帯のぶん（実測 128px）
  // 画面が跳ね上がる。URL のハッシュ（`#practice-session`）だけでは効かない —
  // ストリーミングで後から現れる要素にブラウザはスクロールし直さない
  useScrollToElement(PRACTICE_SCROLL_ANCHOR_ID);

  return (
    <ContentContainer id={PRACTICE_SCROLL_ANCHOR_ID} fillViewport>
      <PageTitle>{practiceTitle}</PageTitle>

      <div className="mx-auto max-w-lg">
        {/* 状態バー: 左に円形タイマーと一時停止、右に残機 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <SkeletonBar radius="full" className={TIMER_SIZE_CLASS} />
            <SkeletonBar className="size-6" tone={100} />
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: mistakeLimit }).map((_, index) => (
              <SkeletonBar key={index} radius="full" className="size-5" />
            ))}
          </div>
        </div>

        <PlayBoardSkeleton boardHeight={boardHeight} />

        {/* フッター: 正誤カウンタ + 終了する */}
        <div className="mt-8 space-y-8">
          <div className="flex items-center justify-center gap-12">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <SkeletonBar radius="full" className="size-9" tone={100} />
                <span className="font-mono text-xl font-bold">
                  <SkeletonBar
                    as="span"
                    className="inline-block w-8"
                    tone={100}
                  >
                    &nbsp;
                  </SkeletonBar>
                </span>
              </div>
            ))}
          </div>
          {/* 終了する。文字の高さではなくタップ領域（min-h-11 = 44px）が
              行の高さを決めるため、実物と同じ枠で場所を取る */}
          <div className="flex flex-col items-center gap-3">
            <span className="inline-flex min-h-11 items-center justify-center px-4 text-sm">
              <SkeletonBar as="span" className="inline-block w-20" tone={100}>
                &nbsp;
              </SkeletonBar>
            </span>
          </div>
        </div>
      </div>
    </ContentContainer>
  );
}
