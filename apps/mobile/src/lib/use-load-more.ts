import { useState } from "react";

/** ページ単位で読む一覧の 1 ページ */
export interface LoadMorePage<TItem> {
  readonly items: readonly TItem[];
  /** 返したページ番号（1 始まり） */
  readonly page: number;
}

/** 2 ページ目以降の読み足し */
interface MorePages<TItem, TFailure> {
  readonly items: readonly TItem[];
  readonly page: number;
  readonly loading: boolean;
  readonly error?: TFailure;
}

/**
 * 1 ページ目の下に、「さらに読み込む」で次のページを足していく
 * 一覧の読み足し
 *
 * ページ送りの代わりに末尾のボタンで読み足す一覧（お知らせ・チャレンジの全履歴）
 * が使う。1 ページ目は呼び出し側が読み（画面に戻るたびに読み直す）、ここは
 * 2 ページ目以降だけを持つ。1 ページ目を読み直したら読み足しを捨てる — 重ねると
 * 同じ行が二重に並ぶ。読み足しの途中で 1 ページ目が替わったら、その結果も捨てる。
 *
 * フックなので、1 ページ目を読み終える前（`firstPage` が undefined）から呼ぶ。
 * その間は空の一覧を返す。
 *
 * @param firstPage - 読み終えた 1 ページ目。同じ読み込みの間は同じ参照であること
 * @param fetchPage - 指定したページを読む
 */
export function useLoadMore<TItem, TFailure>(
  firstPage:
    (LoadMorePage<TItem> & { readonly totalPages: number }) | undefined,
  fetchPage: (
    page: number,
  ) => Promise<LoadMorePage<TItem> | { readonly error: TFailure }>,
): {
  readonly items: readonly TItem[];
  readonly hasMore: boolean;
  readonly loading: boolean;
  readonly error: TFailure | undefined;
  readonly loadMore: () => void;
} {
  const [more, setMore] = useState<{
    readonly base: unknown;
    readonly pages: MorePages<TItem, TFailure>;
  }>();
  const pages =
    more !== undefined && more.base === firstPage ? more.pages : undefined;

  if (firstPage === undefined) {
    return {
      items: [],
      hasMore: false,
      loading: false,
      error: undefined,
      loadMore: () => {},
    };
  }

  const lastPage = pages?.page ?? firstPage.page;

  const loadMore = () => {
    const base = firstPage;
    setMore({
      base,
      pages: { items: pages?.items ?? [], page: lastPage, loading: true },
    });
    void fetchPage(lastPage + 1).then((result) => {
      setMore((prev) => {
        if (prev === undefined || prev.base !== base) return prev;
        if ("error" in result) {
          return {
            base,
            pages: { ...prev.pages, loading: false, error: result.error },
          };
        }
        return {
          base,
          pages: {
            items: [...prev.pages.items, ...result.items],
            page: result.page,
            loading: false,
          },
        };
      });
    });
  };

  return {
    items: [...firstPage.items, ...(pages?.items ?? [])],
    hasMore: lastPage < firstPage.totalPages,
    loading: pages?.loading === true,
    error: pages?.error,
    loadMore,
  };
}
