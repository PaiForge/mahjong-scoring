import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

interface PracticeLinkButtonProps {
  readonly href: string;
  /** ボタンに表示する CTA ラベル */
  readonly label: string;
}

/**
 * 練習への導線ボタン
 * 練習リンクボタン
 *
 * 押せることが一目で分かるよう塗りのプライマリボタンで示し、右端のチェブロンで
 * 画面遷移を伴うことを明示する。遷移待ち中はチェブロンがスピナーへ変わる。
 *
 * 行き先は練習の説明ページで、`?variant=` を付ければ出題設定を選んだ状態で
 * 開く。教本の章末（`practiceHrefs`）とマイレコードの「この土俵をもう一度」が
 * これを共有するため `(user)/_components/` に置いている。
 */
export function PracticeLinkButton({ href, label }: PracticeLinkButtonProps) {
  return (
    <LinkButton
      href={href}
      size="lg"
      fullWidth
      className="gap-3"
      trailingIcon={<ChevronRightIcon className="size-5" />}
    >
      {/* ラベルに残り幅を持たせ、チェブロンをボタンの右端へ寄せる
          （justify-* を className で足しても基底の justify-center には勝てない）。 */}
      <span className="min-w-0 flex-1 text-center">{label}</span>
    </LinkButton>
  );
}

/**
 * {@link PracticeLinkButton} の読み込み中スケルトン
 * 練習リンクボタンスケルトン
 *
 * 50px は実物の内訳（枠 3px × 2 + py-3 の 12px × 2 + 文字の行ボックス 20px）。
 * ボタンと同じファイルに置いてあるので、寸法が変わったときに直す場所が
 * 1 つで済む。
 *
 * 実物の苔緑の太枠（`border-ink`）は写さず灰色の矩形にする
 * （`PracticeStartCtaSkeleton` と同じ理由 — 読み込み中の画面が実物より
 * 賑やかに見えるため）。高さは border-box なので枠を外しても一致する。
 */
export function PracticeLinkButtonSkeleton() {
  return <SkeletonBar radius="lg" tone={100} className="h-[50px] w-full" />;
}
