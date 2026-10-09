import {
  render as renderWithoutTileImages,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import type { ReactElement } from "react";

import { AppTileImageProvider } from "@/app/_contexts/tile-image-context";

/**
 * 牌を描くコンポーネントのテスト用 `render`
 * 牌画像付きレンダー
 *
 * `@pai-forge/mahjong-react-ui` の `Hai` は `TileImageProvider` の配下でだけ描ける
 * （無ければ例外）。本番ではルートレイアウトの `AppTileImageProvider` が
 * 全ページを包んでいるので、盤面・結果・広告など牌を描くコンポーネントのテストは
 * これで包んで描く。`@testing-library/react` の `render` と同じ引数で、
 * `import { render } from "@/test/tile-image-render"` に差し替えるだけでよい。
 *
 * 牌の `src` は本番と同じ `/tiles/<名前>.webp` になる。
 *
 * このモジュールはテスト専用。
 */
export function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): RenderResult {
  return renderWithoutTileImages(ui, {
    ...options,
    wrapper: AppTileImageProvider,
  });
}
