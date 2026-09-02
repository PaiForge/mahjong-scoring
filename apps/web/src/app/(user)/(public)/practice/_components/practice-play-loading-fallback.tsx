import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { useScrollToElement } from "../_hooks/use-scroll-to-element";
import { PRACTICE_SCROLL_ANCHOR_ID } from "../_lib/scroll-anchor";

/**
 * 盤面と選択肢のまとまりの高さ
 * 盤面エリア高さ
 *
 * `ChallengeShell` の中身（手牌の盤面 + 設問 + 選択肢）の高さ。牌の画像と
 * 選択肢の数で決まり、行数や文字数からは導けないため実測値を名前で持つ。
 *
 * 牌は列の幅に合わせて縮むため、高さは幅で変わる。狭い画面のぶんも持たないと
 * モバイルで 20〜30px ずれるので、列が 358px になる <sm と 512px になる sm 以上の
 * 2 点で測った値を持つ（2026-09 実測）。
 *
 * - `standard`: 点数を select で答える試験。<sm 326〜336px / sm 以上 347〜356px。
 *   どちらも真ん中を取っている
 * - `tall`: 合計符の試験。選択肢が 11 個並ぶため一段高い（<sm 458px / sm 以上 489px）
 *
 * この 1 箇所がずれてもページ全体の高さは動かない。play 画面の
 * `ContentContainer` は `fillViewport` で、中身に関わらず画面の高さまで
 * 伸びるため。ずれるのはフッターの縦位置だけ。
 */
const BOARD_AREA_HEIGHT = {
  standard: "h-[331px] sm:h-[351px]",
  tall: "h-[458px] sm:h-[489px]",
} as const;

/** 盤面エリアの高さの種類 */
export type PlayBoardHeight = keyof typeof BOARD_AREA_HEIGHT;

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
  boardHeight = "standard",
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

        {/* 盤面と選択肢。<sm では実物の盤面が白カードの左右パディング（p-4）を
            打ち消して画面端まで広がる（`TehaiDisplay` の fullBleed）ため、
            同じだけ外へ出して角も落とす。ここを内側に収めたままだと、
            スケルトンの矩形だけ両端が 16px ずつ内側に立つ。
            状態バーとの間隔（実測 16px）は盤面側の `mt-4` が持つ */}
        <SkeletonBar
          radius="fullBleed"
          className={`${BOARD_AREA_HEIGHT[boardHeight]} -mx-4 mt-4 w-auto sm:mx-0 sm:w-full`}
          tone={100}
        />

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
