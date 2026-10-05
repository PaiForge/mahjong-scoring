import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";
import {
  LinkRowList,
  ROW_INNER_CLASSES,
  ROW_ITEM_CLASSES,
} from "@/app/(user)/_components/link-row";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

/**
 * `/mypage/notifications` の読み込み中
 *
 * 本文と同じ箱（未読数の行 + 通知の行）を灰色で描く。行は実物
 * （`NotificationItem`）と同じ枠と余白（`ROW_ITEM_CLASSES` / `ROW_INNER_CLASSES`）
 * で、先頭に 32px の丸、本文 2 行（文面 + 日時）を置く。
 */
export default function Loading() {
  return (
    <ContentContainer>
      <PageTitlePlaceholder width="w-16" />

      <div className="space-y-4">
        <div className="flex min-h-9 items-center">
          <SkeletonBar className="h-4 w-24" />
        </div>

        <LinkRowList>
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className={ROW_ITEM_CLASSES}>
              <div className={`items-start ${ROW_INNER_CLASSES}`}>
                <SkeletonBar radius="full" className="size-8 shrink-0" />
                <span className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonBar className="h-5 w-3/4" tone={100} />
                  <SkeletonBar className="h-4 w-28" tone={100} />
                </span>
              </div>
            </li>
          ))}
        </LinkRowList>
      </div>
    </ContentContainer>
  );
}
