"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import { ReferenceLinkButton } from "./reference-link-button";

interface CollapsibleDetailProps {
  /** 見出し。そのまま開閉ボタンのラベルになる */
  readonly title: string;
  /** 展開時に表示する本文 */
  readonly children: ReactNode;
}

/**
 * 見出しを押して開く詳細ブロック
 * 開閉式詳細
 *
 * 内訳表（翻数の内訳・符の内訳）を既定で閉じた状態にする器。内訳は
 * どこに出るときも、どの内訳でも、常にこれで包んで閉じた状態から始める。
 *
 * - 結果ページの問題別詳細は「手牌 → 面子の内訳 → 翻数の内訳 → 答え合わせ」と
 *   縦に伸びるため、内訳を常に開いておくと、まず見たい答え合わせが表の下へ
 *   押し出される
 * - トレーニングの答え合わせでは選択肢の下に出る。開いたままだと行数のぶん
 *   「次の問題へ」が指の届く位置から押し出され、盤面の丈が問題ごとに変わる
 * - 内訳が答えそのものの練習（翻数即答・合計符）でも同じ。答えは要約行と
 *   答え合わせが言うので、内訳は数え直したい人が開く。開き方が練習や内訳の
 *   種類によって変わらないことのほうが、1 タップ省くより効く
 *
 * 開閉ボタンは {@link ReferenceLinkButton}（小さな灰色の下線リンク）で、
 * 右端に置く。以前は {@link DetailTable} の見出しと同じ太字で左に出して
 * いたが、答え合わせの表の中では上の行のラベルより濃い「見出しにも値にも
 * 見えない文字」になり、押せることを示すのが小さな ▶ だけだった。内訳は
 * 真上の値（正解の翻数・符）に付く注釈で、点数の下の「点数表を確認」と同じ
 * 役割なので、同じ姿で同じ右端に出す。▶ を先頭に残して開いたら回すのは
 * {@link import("@/app/(user)/_components/accordion-card").AccordionCard} と
 * 同じ約束で、早見表を開くリンク（表のアイコン）と動作を言い分ける。
 * 閉じている間は本文を描画しない。
 *
 * 器なので見出しの文言は持たない。何の内訳かは中身を知る呼び出し側が渡す。
 */
export function CollapsibleDetail({ title, children }: CollapsibleDetailProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="space-y-1.5">
      <div className="flex justify-end">
        <ReferenceLinkButton
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls={panelId}
          icon={
            <svg
              className={`size-2.5 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          }
          label={title}
        />
      </div>
      {isOpen && <div id={panelId}>{children}</div>}
    </div>
  );
}
