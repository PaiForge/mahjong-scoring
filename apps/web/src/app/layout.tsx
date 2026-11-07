import type { ReactNode } from "react";

/**
 * ルートレイアウト（素通し）
 *
 * @description
 * `<html>`・Provider・既定の metadata はルートごとのレイアウトが持つ:
 * ユーザー向け画面は `[locale]/layout.tsx`（`lang` を URL の言語から決める）、管理画面は
 * `admin/layout.tsx`。ここは子をそのまま返すだけで、何も描かない。
 *
 * @design ファイル自体は残す
 * 消すと、どのルートレイアウトにも属さない `app/not-found.tsx`（存在しない URL の 404。
 * 自分で `<html>` を描く）を包むレイアウトが無くなり、Next の build が
 * 「doesn't have a root layout」で止まる。next-intl の文書（locale segment を root に
 * 置く構成）と同じ形で、素通しのレイアウトを置く。ここで `getLocale()` や `headers()` を
 * 読むと全ページが動的になるので、言語には触れない。
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
