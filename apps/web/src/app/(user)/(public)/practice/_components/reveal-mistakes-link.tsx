"use client";

import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import {
  hasMistakeReveal,
  revealMistakes,
  subscribeMistakeReveal,
} from "../_lib/mistake-reveal";

/**
 * 押すと問題別一覧の間違えた問題（不正解・時間切れ）を開いてそこへ送るリンク
 * 誤答表示リンク
 *
 * 一覧は広告やボタンの下にあり、スクロールしないと届かない。「結果」節の
 * 不正解の数（試験では終わり方）をここから一覧へつなぐ。
 *
 * 一覧が開く処理を登録するまでは素の文字で描く（サーバー描画と、一覧が
 * 出ない回）。押しても何も起きないリンクを出さないため。文字の大きさは
 * 変わらないので、リンクに変わっても行は動かない。
 */
export function RevealMistakesLink({
  children,
}: {
  readonly children: ReactNode;
}) {
  const ready = useSyncExternalStore(
    subscribeMistakeReveal,
    hasMistakeReveal,
    () => false,
  );

  if (!ready) return <span>{children}</span>;

  return (
    <button
      type="button"
      onClick={revealMistakes}
      className={TEXT_LINK_CLASSES}
    >
      {children}
    </button>
  );
}
