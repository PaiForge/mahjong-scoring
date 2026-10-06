import { createContext, useContext, type ReactNode } from "react";

const BoardBleedContext = createContext(false);

/**
 * 配下の出題盤面を画面端まで広げる
 * 盤面フルブリード
 *
 * チャレンジとトレーニングは牌に幅を回すため、手牌の盤面を左右の画面端まで
 * 広げる（web の `mobileFrame="fullBleed"`）。説明画面の見本や結果の一覧に
 * 置く盤面は地の文と幅を揃えて内側に収める。盤面はどちらの画面にも置かれる
 * ので、置き場所（シェル）がこれで包んで伝える。
 */
export function BoardBleedProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <BoardBleedContext.Provider value={true}>
      {children}
    </BoardBleedContext.Provider>
  );
}

/** 盤面を画面端まで広げる場所か */
export function useBoardBleed(): boolean {
  return useContext(BoardBleedContext);
}
