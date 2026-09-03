/**
 * 全テスト共通の jsdom 補完
 *
 * jsdom はレイアウトを持たないため、スクロール系 API と matchMedia を実装しない。
 * 呼ぶだけで TypeError になり、実装側で存在チェックを書く羽目になるので、
 * テスト環境側で最小限の実装を用意して埋める
 * （挙動自体はブラウザでしか検証できない）。
 *
 * setupFiles は環境を問わず読まれるため、`@vitest-environment node` を宣言した
 * テスト（Route Handler など、ブラウザではなくサーバで動くもの）でも実行される。
 * そちらに DOM は無いので、補完そのものを丸ごと飛ばす。
 */
if (typeof window !== "undefined") {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }

  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }
}
