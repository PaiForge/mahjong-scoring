# locales

iOS のアプリの表示名など、OS が読む文字列の言語別の値。`app.json` の `locales` から参照し、
prebuild で言語ごとの `InfoPlist.strings`（`ja.lproj` / `en.lproj`）になる。いまは
`CFBundleDisplayName`（ホーム画面の名前）だけで、英語の端末でホーム画面の名前だけが日本語に
ならないよう言語で分けている。英語の名前はホーム画面で切れない長さ（iOS はおよそ 12〜13 字で
切る）にしてあり、App Store の名前とは別に持つ。対応言語そのものは `app.json` の
`expo-localization` の `supportedLocales`（`CFBundleLocalizations`）で、2 言語を載せると iOS の
「設定 > アプリ > 言語」が出て、Apple でログイン・購入シートなど OS 側の画面もその言語になる。
アプリの画面の文言はここではなく辞書（`@mahjong-scoring/messages`）に置く。
