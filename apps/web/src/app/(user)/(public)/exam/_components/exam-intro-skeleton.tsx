import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { CurriculumTocSkeleton } from "../../learn/_components/curriculum-toc-skeleton";
import { PRACTICE_START_CTA_BLOCK_CLASS } from "../../practice/_components/practice-start-cta";
import { START_BUTTON_HEIGHT_CLASS } from "../../practice/_components/practice-start-cta-skeleton";

/**
 * 問題方式のプレビュー（デモ盤面）の高さ
 * プレビュー高さ
 *
 * このページで唯一、実物を描いて高さを取れない箇所。中身は牌の画像を
 * 並べた盤面で、行数や文字数から導ける値ではないため実測値を名前で持つ
 * （2026-08 に幅 656px の本文で計測）。デモを差し替えたら測り直すこと。
 *
 * - `standard`: 手牌 1 列 + 和了方法（七対子・平和・満貫以上・30〜50符）
 * - `tall`: 合計符の試験。手牌の下に符の内訳が付くぶん高い
 */
export const EXAM_DEMO_HEIGHT = {
  standard: "h-[250px]",
  tall: "h-[559px]",
} as const;

/** 問題方式のプレビューの高さの種類 */
export type ExamDemoHeight = keyof typeof EXAM_DEMO_HEIGHT;

interface ExamIntroSkeletonProps {
  /** 問題方式のプレビューの高さ（既定 standard） */
  readonly demoHeight?: ExamDemoHeight;
  /** 前提となる教本の章の数。段級位レジストリから渡す */
  readonly chapterCount: number;
}

/**
 * 昇級試験の説明ページの読み込み中スケルトン
 * 試験説明スケルトン
 *
 * @description
 * 汎用の `PageSkeleton`（見出し + 3 行 + カード 4 枚）は読み物のページの形で、
 * 試験の説明ページとは別物だった。実物は問題方式のプレビューだけで 250px
 * （合計符の試験は 559px）あり、本文全体で 913〜1404px になる。汎用の
 * 428px と並べると、中身が届いた瞬間にページの高さが 2〜3 倍に伸びる。
 *
 * 並びは `PracticeIntroContent` の実物と同じ順で、高さは実物の部品と定数から
 * 取る — 見出しは `SectionTitleSkeleton`、章の目次は `CurriculumTocSkeleton`
 * （実物の `CurriculumToc` と座標・行の骨格を共有する）、開始ボタンは
 * `START_BUTTON_HEIGHT_CLASS`。固定の `h-*` で近似すると、文字サイズや
 * ブレークポイントの変更に付いていけず静かにずれる。実測値を書き写して
 * いるのは {@link EXAM_DEMO_HEIGHT} だけ。
 *
 * ページ見出しの帯（`PageTitle`）は文字を入れずに描く。実物の見出しは
 * 試験名だが、帯の高さは文字の有無で変わらないため、この 1 行のために
 * クライアント側で辞書を読む必要はない。
 *
 * @design 実物の色を写さない
 *
 * 実物のプレビュー枠と開始ボタンは苔緑の太枠（`border-ink`）、合格条件は
 * 琥珀の枠と面（`HighlightPanel`）だが、スケルトンはどれも灰色の矩形に
 * する。読み込み中の画面が実物より賑やかに見えてしまうため
 * （`ProblemListSkeleton` と同じ理由）。高さは border-box なので、枠を
 * 外しても・枠の色だけ替えても実物と一致したまま。
 */
export function ExamIntroSkeleton({
  demoHeight = "standard",
  chapterCount,
}: ExamIntroSkeletonProps) {
  return (
    <ContentContainer>
      <PageTitle>
        <SkeletonBar as="span" className="inline-block w-64 max-w-full">
          &nbsp;
        </SkeletonBar>
      </PageTitle>

      <div className="space-y-8">
        {/* 問題方式（見出し + リード文 + プレビュー） */}
        <div className="space-y-4">
          <SectionTitleSkeleton width="w-20" />
          <p className="text-sm">
            <SkeletonBar as="span" className="inline-block w-11/12" tone={100}>
              &nbsp;
            </SkeletonBar>
          </p>
          <SkeletonBar
            radius="xl"
            className={`${EXAM_DEMO_HEIGHT[demoHeight]} w-full`}
            tone={100}
          />
        </div>

        {/* 合格条件（見出し + パネル） */}
        <div className="space-y-3">
          <SectionTitleSkeleton width="w-28" />
          {/* 実物は琥珀の枠と面（`HighlightPanel`）。スケルトンは灰色に
              置き換える。枠の太さだけ残して高さを合わせる */}
          <div className="rounded-xl border-3 border-surface-100 bg-surface-50 p-5">
            <p className="text-sm">
              <SkeletonBar as="span" className="inline-block w-4/5" tone={100}>
                &nbsp;
              </SkeletonBar>
            </p>
          </div>
        </div>

        {/* 開始導線（ボタン + 補足文）。受験資格が確定するまで ExamStartGate も
            同じ寸法の矩形を出すため、境界が外れてもボタンの位置は動かない */}
        <div className={PRACTICE_START_CTA_BLOCK_CLASS}>
          <SkeletonBar
            radius="lg"
            className={`${START_BUTTON_HEIGHT_CLASS} w-full`}
          />
          <p className="text-xs">
            <SkeletonBar as="span" className="inline-block w-56" tone={100}>
              &nbsp;
            </SkeletonBar>
          </p>
        </div>

        {/* 前提となる教本の章。行の骨格は実物の目次と共有する。
            章がセクションをまたぐ試験（満貫以上 + 役）では見出しが 2 つに
            割れるが、ここは 1 セクションぶんで描く — どのセクションに
            属するかまで再現するとカリキュラム全体をクライアントへ
            持ち込むことになり、遅くする側の代償が大きい。
            前提章を持たない試験では実物が節ごと出ないため、ここも出さない */}
        {chapterCount > 0 && (
          <div className="space-y-3">
            <SectionTitleSkeleton width="w-40" />
            <div className="space-y-6">
              <CurriculumTocSkeleton
                chapterCount={chapterCount}
                labelWidthClassName="w-24"
              />
            </div>
            <div className="text-right text-sm">
              <SkeletonBar as="span" className="inline-block w-16" tone={100}>
                &nbsp;
              </SkeletonBar>
            </div>
          </div>
        )}

        {/* その級の練習メニューへの行リンク（タイトル + 説明の 2 段） */}
        <div className="flex flex-col">
          <div className="flex items-start gap-3 px-2 py-3">
            <span className="flex min-h-5 shrink-0 items-center">
              <SkeletonBar className="size-4" tone={100} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">
                <SkeletonBar as="span" className="inline-block w-40" tone={100}>
                  &nbsp;
                </SkeletonBar>
              </span>
              <span className="mt-0.5 block text-xs">
                <SkeletonBar as="span" className="inline-block w-56" tone={100}>
                  &nbsp;
                </SkeletonBar>
              </span>
            </span>
          </div>
        </div>
      </div>
    </ContentContainer>
  );
}
