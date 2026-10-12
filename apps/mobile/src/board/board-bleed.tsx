import { createContext, useContext, type ReactNode } from "react";

interface BoardBleed {
  readonly bleed: boolean;
  readonly flushTop: boolean;
}

const BoardBleedContext = createContext<BoardBleed>({
  bleed: false,
  flushTop: false,
});

/**
 * 配下の出題盤面を画面端まで広げる
 * 盤面フルブリード
 *
 * チャレンジとトレーニングは牌に幅を回すため、手牌の盤面を左右の画面端まで
 * 広げる（web の `mobileFrame="fullBleed"`）。説明画面の見本や結果の一覧に
 * 置く盤面は地の文と幅を揃えて内側に収める。盤面はどちらの画面にも置かれる
 * ので、置き場所（シェル）がこれで包んで伝える。
 *
 * `flushTop` は「盤面が本文の先頭にある」ことを伝える（トレーニング・和了形 /
 * 聴牌形の点数計算。チャレンジは上に時計の行がある）。手牌の帯はそのとき
 * 本文の上の余白を打ち消してヘッダーの直下に付く — 左右だけ端まで届き、
 * 上にだけ白い帯が残ると、詰め損ねた隙間に見えるため。盤面の先頭が問題文や
 * 枠の練習（雀頭の符・待ちの符等）は手牌の帯を持たないので、余白はそのまま残る。
 * 手牌の帯を持つ盤面は、それを先頭に置くこと（2 番目以降に置くと、上の要素に
 * 食い込む）。
 */
export function BoardBleedProvider({
  flushTop = false,
  children,
}: {
  readonly flushTop?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <BoardBleedContext.Provider value={{ bleed: true, flushTop }}>
      {children}
    </BoardBleedContext.Provider>
  );
}

/** 盤面を画面端まで広げる場所か */
export function useBoardBleed(): boolean {
  return useContext(BoardBleedContext).bleed;
}

/** 盤面が本文の先頭にあり、手牌の帯をヘッダーの直下に付ける場所か */
export function useBoardFlushTop(): boolean {
  return useContext(BoardBleedContext).flushTop;
}
