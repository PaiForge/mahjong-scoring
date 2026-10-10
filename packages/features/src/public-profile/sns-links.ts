/**
 * 公開プロフィールに並べる SNS のリンク
 * SNSリンク
 *
 * web の公開プロフィールとアプリのプロフィール画面が同じ並び・同じ URL で
 * 出すため、ここで組み立てる。ハンドルは保存時に `@` を除いてある
 * （`profile/validation.ts`）。
 */
export interface SnsLink {
  /** サービス名（固有名詞なので辞書を通さない） */
  readonly label: string;
  /** 画面に出すハンドル（`@` 付き） */
  readonly handle: string;
  readonly url: string;
}

/** SNS のアカウント（未設定は undefined） */
export interface SnsAccounts {
  readonly xUsername?: string;
  readonly instagramUsername?: string;
  readonly youtubeHandle?: string;
}

/**
 * 設定されている SNS のリンクを X → Instagram → YouTube の順に返す
 * SNSリンク組み立て
 */
export function buildSnsLinks(accounts: SnsAccounts): readonly SnsLink[] {
  const links: SnsLink[] = [];
  if (accounts.xUsername) {
    links.push({
      label: "X",
      handle: `@${accounts.xUsername}`,
      url: `https://x.com/${accounts.xUsername}`,
    });
  }
  if (accounts.instagramUsername) {
    links.push({
      label: "Instagram",
      handle: `@${accounts.instagramUsername}`,
      url: `https://www.instagram.com/${accounts.instagramUsername}`,
    });
  }
  if (accounts.youtubeHandle) {
    links.push({
      label: "YouTube",
      handle: `@${accounts.youtubeHandle}`,
      url: `https://www.youtube.com/@${accounts.youtubeHandle}`,
    });
  }
  return links;
}
