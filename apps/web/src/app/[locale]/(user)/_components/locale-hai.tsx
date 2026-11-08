"use client";

// このファイルだけが `Hai` を直接 import してよい（ルートの eslint.config.mjs が
// `[locale]` 配下の他のファイルからの直接 import を弾き、このファイルを `ignores` で除く）
import { Hai, type HaiProps } from "@pai-forge/mahjong-react-ui";
import { useLocale, useTranslations } from "next-intl";

import {
  DEFAULT_LOCALE,
  isSupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

import { tileNameKey } from "./_lib/tile-alt";

/**
 * ページの言語で `alt` を付ける牌画像
 * 言語別牌画像
 *
 * `@pai-forge/mahjong-react-ui` の `Hai` の `alt` は省略時に日本語の牌名
 * （`getHaiName`。一萬・東 …）になり、ライブラリに言語を渡す口が無い。英語の
 * ページではそれが最後に残る日本語で、スクリーンリーダーと画像検索が読む。
 * そこで web 側で包み、`alt` が省略されていて言語が日本語以外のときだけ
 * 辞書（`common.tileNames.<キー>`、例: `common.tileNames.m1` = `1 man`・
 * `common.tileNames.ton` = `East`）の牌名を渡す。
 *
 * - 日本語のページと `alt` を指定した呼び出し（装飾の `alt=""` を含む）は、
 *   `Hai` にそのまま渡す。日本語の `alt` は従来と同じ `getHaiName` のまま
 *   （日本語の辞書の値も同じ文字列で、`tile-alt.test.ts` が固定している）
 * - `alt=""` にして言語の問題ごと消す案は採らない。問題の手牌のような装飾でない牌の
 *   読み上げを失うため
 * - 管理画面（`/admin`）は日本語だけなので包まず、`Hai` を直接使う
 *
 * `[locale]` 配下のユーザー向け画面は `Hai` ではなくこれを使う（ESLint が強制する）。
 * `Furo` がライブラリの内部で描く牌の `alt` はこの部品を通らず日本語のまま残る。
 *
 * @param props - `Hai` と同じ props
 */
export function LocaleHai(props: HaiProps) {
  const rawLocale = useLocale();
  const locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = useTranslations("common");
  if (props.alt === undefined && locale !== DEFAULT_LOCALE) {
    // 例: common.tileNames.m1 / common.tileNames.chun
    return <Hai {...props} alt={t(`tileNames.${tileNameKey(props.hai)}`)} />;
  }
  return <Hai {...props} />;
}
