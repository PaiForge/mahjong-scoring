/**
 * スタックの画面（ルート名と params）が表すパス
 * ルートのパス
 *
 * expo-router のルート名はファイルの位置（`practice/[slug]/index`）で、
 * 動的な部分は params に入る。`[x]` を params の値で埋め、末尾の `index` と
 * route group（`(tabs)`）を落としてパスにする。クエリは含めない。
 *
 * @param name - スタックの画面のルート名
 * @param params - その画面の params
 */
export function routePathname(
  name: string,
  params: object | undefined,
): string {
  const segments = name
    .split("/")
    .filter((segment) => segment !== "index" && !/^\(.*\)$/u.test(segment))
    .map((segment) => {
      const dynamic = /^\[(.+)\]$/u.exec(segment);
      if (dynamic === null) return segment;
      const key = dynamic[1];
      const value: unknown = Object.entries(params ?? {}).find(
        ([k]) => k === key,
      )?.[1];
      return typeof value === "string" ? encodeURIComponent(value) : segment;
    });
  return `/${segments.join("/")}`;
}

/**
 * スタックの中で、行き先と同じパスの画面のうち今の画面に最も近いもの
 * 戻り先の位置
 *
 * 見つからなければ `undefined`。今の画面（`index`）自身は数えない。
 *
 * @param routes - スタックの画面（下から順）
 * @param index - 今の画面の位置
 * @param href - 行き先（クエリ・ハッシュは見ない）
 */
export function findRouteIndexByHref(
  routes: readonly {
    readonly name: string;
    readonly params?: object;
  }[],
  index: number,
  href: string,
): number | undefined {
  const pathname = href.split(/[?#]/u, 1)[0] ?? href;
  for (let i = index - 1; i >= 0; i--) {
    const route = routes[i];
    if (
      route !== undefined &&
      routePathname(route.name, route.params) === pathname
    ) {
      return i;
    }
  }
  return undefined;
}

/**
 * 履歴の画面へ戻るときに、その画面へ渡し直す params
 * 戻り先の params
 *
 * `router.dismissTo(href)` と同じく、戻り先の params を href の内容で置き換える
 * （パスの動的な部分はその画面の値のまま、クエリは href のもの）。閉じて戻る
 * だけだと、href で指定したクエリ（`?variant=` 等）が捨てられ、前の値が残る。
 *
 * @param name - 戻り先の画面のルート名
 * @param params - 戻り先の画面の今の params
 * @param href - 行き先（クエリ付き）
 */
export function paramsForHref(
  name: string,
  params: object | undefined,
  href: string,
): Record<string, string> {
  const dynamicKeys = new Set(
    name
      .split("/")
      .map((segment) => /^\[(.+)\]$/u.exec(segment)?.[1])
      .filter((key) => key !== undefined),
  );
  const pathParams = Object.fromEntries(
    Object.entries(params ?? {}).filter(
      (entry): entry is [string, string] =>
        dynamicKeys.has(entry[0]) && typeof entry[1] === "string",
    ),
  );
  const query = href.split("#", 1)[0]?.split("?")[1] ?? "";
  const queryParams = Object.fromEntries(
    query
      .split("&")
      .filter((pair) => pair !== "")
      .map((pair) => {
        const [key = "", value = ""] = pair.split("=");
        return [
          decodeURIComponent(key.replaceAll("+", " ")),
          decodeURIComponent(value.replaceAll("+", " ")),
        ];
      }),
  );
  return { ...pathParams, ...queryParams };
}
