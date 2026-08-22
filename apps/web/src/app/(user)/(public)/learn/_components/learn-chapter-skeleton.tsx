import { ContentContainer } from "@/app/(user)/_components/content-container";
import { Divider } from "@/app/(user)/_components/divider";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitleSkeleton } from "@/app/(user)/_components/section-title-skeleton";
import { PageTitleSkeleton } from "@/app/_components/page-title-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * 学習章ページ（`/learn/<slug>`）の読み込み中スケルトン
 * 章ページスケルトン
 *
 * `LearnPageLayout` と同じ骨格 — タイトル帯・`space-y-10` の本文・右寄せの読了
 * トグル・練習リンク・前後章ナビ — を描く。本文は章ごとに構成（表・牌画像・
 * 注記）が違うため、共通する「見出し + 段落」の並びだけを置く。
 *
 * 汎用の `PageSkeleton` はカード状のリスト行を並べるため、読み物である章ページ
 * とは形が合わない。目次との振り分けは `LearnLoading` が行う。
 */
export function LearnChapterSkeleton() {
  return (
    <ContentContainer>
      <PageTitle>
        <PageTitleSkeleton width="w-40" />
      </PageTitle>

      <div aria-hidden="true" data-testid="learn-chapter-skeleton">
        <div className="space-y-10">
          {/* 章本文（ガイド） */}
          <div className="space-y-10">
            {BODY_SECTION_LINE_COUNTS.map((lineCount, sectionIndex) => (
              <div key={sectionIndex} className="space-y-4">
                <SectionTitleSkeleton width="w-40" />
                <p className="text-sm leading-relaxed">
                  {Array.from({ length: lineCount }).map((_, lineIndex) => (
                    <SkeletonBar
                      key={lineIndex}
                      as="span"
                      tone={100}
                      className={`inline-block ${
                        lineIndex === lineCount - 1 ? "w-3/5" : "w-full"
                      }`}
                    >
                      &nbsp;
                    </SkeletonBar>
                  ))}
                </p>
              </div>
            ))}
          </div>

          {/* 読了トグル / ログイン導線（どちらも text-sm のテキストリンク） */}
          <div className="flex justify-end text-sm">
            <SkeletonBar as="span" className="inline-block w-32">
              &nbsp;
            </SkeletonBar>
          </div>

          {/* 練習リンク（見出し + 全幅の lg ボタン） */}
          <div className="space-y-4">
            <p className="text-base font-semibold">
              <SkeletonBar as="span" className="inline-block w-32">
                &nbsp;
              </SkeletonBar>
            </p>
            <SkeletonBar radius="lg" tone={100} className="h-12 w-full" />
          </div>

          {/* 前後章ナビ */}
          <div className="space-y-6">
            <Divider />
            <div className="flex items-center justify-between gap-4 text-sm">
              <SkeletonBar as="span" className="inline-block w-32">
                &nbsp;
              </SkeletonBar>
              <SkeletonBar as="span" className="inline-block w-32">
                &nbsp;
              </SkeletonBar>
            </div>
          </div>
        </div>
      </div>
    </ContentContainer>
  );
}

/**
 * 本文セクションごとの段落行数。
 * どの章にも共通する「見出し + 数行の段落」のリズムを出すための概算で、
 * 最終行だけ短くして文末に見せる。
 */
const BODY_SECTION_LINE_COUNTS = [3, 4, 3] as const;
