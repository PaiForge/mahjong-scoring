// このファイルだけが `Hai` を直接 import してよい（ルートの eslint.config.mjs が
// apps/mobile/src 配下の他のファイルからの直接 import を弾き、このファイルを `ignores` で除く）
import { Hai, type HaiProps } from "@pai-forge/mahjong-react-ui";
import { useTranslations } from "use-intl";

import { DEFAULT_LOCALE } from "@mahjong-scoring/features/i18n/locales";
import { tileNameKey } from "@mahjong-scoring/features/tiles/tile-name-key";

import { useAppLocale } from "../lib/use-app-locale";

/**
 * 端末の言語で読み上げを付ける牌画像
 * 言語別牌画像
 *
 * `@pai-forge/mahjong-react-ui` のネイティブの `Hai` は `accessibilityLabel` を
 * `alt ?? getHaiName(hai)` にする。`getHaiName` は日本語の牌名（一萬・東 …）だけで
 * ライブラリに言語を渡す口が無く、英語の端末では VoiceOver が日本語の牌名を読む。
 * そこでアプリ側で包み、`alt` が省略されていて言語が日本語以外のときだけ辞書
 * （`common.tileNames.<キー>`、例: `common.tileNames.m1` = `1 man`・
 * `common.tileNames.ton` = `East`）の牌名を `alt` に渡す。web の
 * `[locale]/(user)/_components/locale-hai.tsx` と同じ形で、牌種 → 辞書キーの対応表は
 * 両者で `@mahjong-scoring/features/tiles/tile-name-key` の 1 つを引く。
 *
 * - 日本語の端末と `alt` を指定した呼び出し（装飾の `alt=""` を含む）は、`Hai` に
 *   そのまま渡す。日本語の読み上げは従来と同じ `getHaiName` のまま（日本語の辞書の
 *   値も同じ文字列で、web の `tile-alt.test.ts` が 34 種すべてで固定している）
 * - `alt=""` にして言語の問題ごと消す案は採らない。問題の手牌のような装飾でない牌の
 *   読み上げを失うため
 * - 言語は `useAppLocale()`（辞書の Provider の `locale`）で取る。Provider の外では
 *   使えないが、牌を描く画面はすべて Provider の内側にある
 *
 * `apps/mobile/src` の画面は `Hai` ではなくこれを使う（ESLint が強制する）。
 * アプリの鳴き牌（`board/furo-tiles.tsx`）は表の牌をこれで描くので英語で読まれる。
 * 暗槓の裏の牌は `Image` で描き、牌の名前を持たない（web はライブラリの `Furo` が
 * 内部で描く牌の `alt` が日本語のまま残る — ライブラリの実装で、この部品の範囲外）。
 *
 * @param props - `Hai` と同じ props
 */
export function LocaleHai(props: HaiProps) {
  const locale = useAppLocale();
  const t = useTranslations("common");
  if (props.alt === undefined && locale !== DEFAULT_LOCALE) {
    // 例: common.tileNames.m1 / common.tileNames.chun
    return <Hai {...props} alt={t(`tileNames.${tileNameKey(props.hai)}`)} />;
  }
  return <Hai {...props} />;
}
