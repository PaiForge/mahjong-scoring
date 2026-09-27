/**
 * 本物のリンクが入る前の広告のリンク（仮リンク）と、その判定
 * 広告の仮リンク
 *
 * 本番の広告はシード（`scripts/seed/ad-creatives.ts`）が文言・手牌ごと停止中で
 * 入れ、運用者はタイトル別の一括更新（`/admin/ads/links`）でアフィリエイト
 * リンクを貼るだけで掲載できる。リンクをシードに書かないのは、このリポジトリが
 * 公開されており、アフィリエイトリンク（トラッキング ID）は運用者個人の設定で
 * コードではないため。フォークや手元の checkout に引き継がせない。
 *
 * 仮リンクのまま掲載すると、押した人を `example.com` に送る広告が本番に出る
 * （広告が出ないより悪い）。そのため掲載は「リンクが仮リンクでない」ことを
 * 条件にする。条件を掛けるのは書き込み時だけで、読み込み時には絞らない —
 * 広告を出すかどうかを決めるのは `is_active` だけにしておく（見えない
 * 第 2 の条件で黙って消えると、なぜ出ないのかが管理画面から分からない）。
 *
 * 判定は文字列の完全一致ではなくホストで行う。パスだけ書き換えてホストを
 * 残した編集途中のリンクも、同じく行き先が無い。RFC 2606 が文書用に予約した
 * `example.com` / `.net` / `.org` と `.example` は実在のサイトにならないため、
 * 「ホストがこれらなら行き先ではない」は推測ではなく定義として成り立つ。
 */

/** シードが書く仮リンク。管理画面の欄にそのまま出るので、パスでやることを言う */
export const PLACEHOLDER_AD_HREF =
  "https://example.com/replace-with-the-affiliate-url";

/** 実在のサイトになりえないホスト（RFC 2606 §3） */
const RESERVED_HOSTS = ["example.com", "example.net", "example.org"];

/**
 * リンクが仮リンク（文書用ホスト）か。読めない URL は仮リンクではなく
 * 不正な URL で、それはリンクの検証の役目
 */
export function isPlaceholderAdHref(href: string): boolean {
  let host: string;
  try {
    host = new URL(href).hostname.toLowerCase();
  } catch {
    return false;
  }
  return (
    host === "example" ||
    host.endsWith(".example") ||
    RESERVED_HOSTS.some(
      (reserved) => host === reserved || host.endsWith(`.${reserved}`),
    )
  );
}
