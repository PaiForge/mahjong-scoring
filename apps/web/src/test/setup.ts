/**
 * 全テスト共通の jsdom 補完
 *
 * jsdom はレイアウトを持たないため、スクロール系 API を実装しない。
 * 呼ぶだけで TypeError になり、実装側で存在チェックを書く羽目になるので、
 * テスト環境側で no-op を用意して埋める（挙動自体はブラウザでしか検証できない）。
 */
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
