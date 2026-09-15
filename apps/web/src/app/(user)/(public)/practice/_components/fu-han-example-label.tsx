"use client";

import { useFuHanOrder } from "@/app/_hooks/use-display-settings-store";
import { orderFuHan } from "@/app/_lib/fu-han-order";

interface FuHanExampleLabelProps {
  /** 「30符」 */
  readonly fu: string;
  /** 「4翻」 */
  readonly han: string;
}

/**
 * 練習カードの例示に出す「30符 4翻」
 * 符翻の例示
 *
 * カードはサーバーコンポーネントだが、符と翻の並び順は端末ローカルの
 * 表示設定で決まるため、この文言だけクライアントで並べる。出題文
 * （ScoreTablePrompt）と同じ順になり、一覧で見た形のまま出題される。
 */
export function FuHanExampleLabel({ fu, han }: FuHanExampleLabelProps) {
  const fuHanOrder = useFuHanOrder();

  return (
    <span className="text-sm font-bold text-white">
      {orderFuHan(fuHanOrder, { fu, han }).join(" ")}
    </span>
  );
}
