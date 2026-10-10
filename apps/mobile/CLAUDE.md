# apps/mobile

web と同じ画面をネイティブで出す Expo アプリ。リポジトリ全体の規約（用語・i18n・
`packages/features`・コミット）はルートの `CLAUDE.md`。ここにはアプリだけの規約を置く。
開発環境の作り方・EAS の環境変数・TestFlight・Apple でログインの設定は `README.md`。

## 方針

web と同じ画面をネイティブで出す Expo アプリ。技術スタック（Expo + expo-router）は
参考プロジェクト（blindfold-chess の apps/mobile）に揃えている（バージョンは揃えない）。ロジックは
packages/features / core を共有し、アプリ側は画面と RN の部品だけを持つ。

**仕様は web を踏襲するが、外観まで web を写さない。** スマホアプリとして見慣れない
形（地の斜線の帯・太枠のヘッダーとタブバー・グレー + 下線のリンク・中央の太枠の
ダイアログ）はネイティブの定石に置き換える。残すのは面の記号（太枠・ハードシャドウ・
押し込み・緑の塗り = 押して始める）と色の値。

- 画面の枠（`components/screen.tsx`）はネイティブ標準: 白地のヘッダー（左に戻る / ×、
  中央に見出し、右に「?」等）とヘアラインの区切り。解答中の画面（チャレンジ・
  トレーニング・訓練）は `backIcon="close"` で「閉じる」を出し、チャレンジだけ中止の
  確認を挟む。履歴が無いときの戻るは練習一覧へ
- リンクは下線を引かない（`lib/link-styles.ts`）。押せる行は濃い題名 + 右端の矢印 +
  押したときの地の色、単独の文字の操作はアクセント色の太字、本文中の語だけ下線
- 説明・選択肢の一覧・選択欄は `BottomSheet`（下からのシート）。確認だけ中央の
  ダイアログ（`ConfirmationModal`）
- 「?」のヘルプは `HelpTourSheet`（1 枚ずつ送るシート）。web の 2 種類（設定画面の
  `HelpTourModal` と画面の要素を照らす `SpotlightTour`）を、どちらもこの形で出す
  （要素を照らす仕組みはネイティブに無い。進め方の方だけ実物の見本を添える）
- 一覧の絞り込みは `FilterChips`（端まで流す独立したチップ）、2〜3 択の表示切り替えは
  `ToggleGroup`（セグメントコントロール）
- 答え合わせは色に加えて触覚（`lib/haptics.ts`、expo-haptics）でも知らせる
- 本文の文字は 15〜16pt（web の 14px を写さない）。辞書の改行は設定の説明では取り除く

- **画面の構成は web をなぞる。** ルートは expo-router で web と同じパス（`/practice/<slug>`,
  `/practice/<slug>/play` …）に置き、パスは `@mahjong-scoring/features/routes` で組み立てる。
  練習ごとに違うのは盤面と結果の一覧だけで、`src/practice/boards/<slug>/index.tsx` が
  `PracticeScreens`（Play / Training / Demo / ProblemList）を返し、`src/practice/registry.ts` に
  1 行足すと一覧・説明・チャレンジ・トレーニング・結果のすべてに載る
- **ログインは web と同じ Supabase Auth（`src/auth/`）。** 入口は設定のアカウントの節で、
  ログイン・登録・ユーザー名の設定・退会の画面は web と同じパスに置く。セッションは
  SecureStore、サーバーへの書き込みは web のアプリ向け API（`/api/mobile/v1/*`、
  `Authorization: Bearer`。web の `lib/mobile-api/`）を通す。DB を直接読み書きしない。
  ログインはメールと Apple（iOS のネイティブだけ。`auth/apple-sign-in.ts`）。Apple の認可コードは
  サーバーが交換して保存し、退会の最後の工程で Apple 側の連携を取り消す（`apple_refresh_tokens`）。
  外部の設定と実機での確かめ方は `apps/mobile/README.md`。
  ログインは任意で、ゲストのまま全機能を使える。結果はメモリのストアで結果画面へ運ぶ
  （web の sessionStorage の代わり）。設定は常に端末ローカル（AsyncStorage）
- **記録はログイン中（ユーザー名を決めた人）だけサーバーに残す。** チャレンジは web と
  同じくサーバーで採点・記録し（`practice/recorded-challenge.tsx`）、通信できなければ記録付きでは
  始めない。サーバーへ送り切るまでの記録（進行中のチャレンジ・確定待ち・未送信のレッスン完了）は
  userId ごとに端末へ預け（`records/account-records.ts`）、預けたユーザーの名義でだけ送る
  （`callMobileApi` の `asUser`）。ゲストのレッスン完了・「チャレンジを終えた練習」は端末の
  ゲストの記録で、ログイン中の記録をそこへ書かない。ゲストのレッスン完了は端末で 1 度だけ
  最初にログインしたアカウントへ取り込み、「チャレンジを終えた練習」はサーバーへ送らず
  案内（行程）にだけ合わせる。本番の昇級試験の画面はまだ無い
- **アプリでは Pro（有料プラン）を扱わない。** 全員に同じ無料の機能を出し、購入の導線も出さない。
  web で Pro を買ったアカウントでもアプリでは差を付けない（アプリの外で買った特典をアプリで開けるなら、
  同じものをアプリ内課金でも売る必要がある — 審査ガイドライン 3.1）。web の練習の回数制限
  （practice-quota）はアプリの練習には掛からない。要求の本文の申告（「iOS から」等）で web の
  制限を外す経路も作らない。アプリ内課金を入れるときに購入の権利を web と共通にする
- **色・角丸の値は web から写す。** `src/lib/theme.ts`（web の `globals.css` と同じ値）。
  太枠・ハードシャドウ・押し込みは `PressableSurface`（影は面の後ろに敷いた View で描く。
  Android の elevation は硬い影を描けない）。影を持つのは押せる面だけ（web と同じ規則）
- **表示だけのカード・表・設定のカード・一覧の枠は細枠。** `lib/panel-styles.ts` の `panelFrame`
  （1px の `colors.panel` + `radius.panel`。web の `rounded-panel border border-panel`）を使い、太枠
  （`borderWidth.regular` + `colors.ink`）は押せる面・回答欄・ダイアログに残す。段級位のカードは
  `beltCardFrame()`（細枠 + 上端の帯色の帯）、小さな印は `Chip`、区切りは `Divider`（破線は使わない）
- **牌は `Hai` / `FuroTiles` を使う。** `@pai-forge/mahjong-react-ui` の `Furo` /
  `HaiBack` / `Tehai` は `div` と Tailwind のクラスで描く web 専用の実装で、ネイティブでは描けない。
  `Hai` は 0.5.0 から `onClick` が無ければ `View` で包まれ、ボタンの中に置いてもタップを奪わない
  （0.4.0 までは常に `Pressable` で包まれ、ネイティブでは画像も描かれなかった）
- **Expo SDK の推奨と違う版を 3 つ意図して使う**（`package.json` の `expo.install.exclude`）。
  `npx expo install --fix` で戻さないこと
  - `react` / `react-dom` — ワークスペース全体と同じ版にそろえる。packages/features も devDependency で
    React を持ち、版が違うと pnpm が別の実体を置き、Metro が共有コードの React を別に解決して
    React が 2 つバンドルに入る（フックが落ちる）。RN のレンダラーは React の版を厳密には検査しない
  - `typescript` — 他のパッケージと同じ TS7。SDK 54 では Expo の CLI が TS7 で Metro まで届かず
    5.9 に固定していたが、SDK 57 では `expo start` から iOS / Android / web のバンドルまで通る
- **ネイティブ広告は web と同じ画面の同じ位置に出す。** 広告は web の広告配信 API
  （`/api/ads/<スロット>`）から読み（`src/ads/use-native-ads.ts`）、スロットは
  `MOBILE_AD_SLOTS`（features の `ads/native-ad.ts`）で web とは別に持つ（成果をトラッキング ID で
  分けるため）。web に広告の置き場所を足したら、アプリに同じ画面があればこちらにも足す。
  ランキング・お知らせ・本番の昇級試験の結果は画面が無いので持たない。開発中は Metro を動かす
  Mac の web（`:3000`）を読む（`src/lib/site-url.ts`）
- **web 版（`pnpm --filter @mahjong-scoring/mobile web`）は画面確認用**
- 辞書は web と同じもの（`@mahjong-scoring/messages`）を use-intl で読む

## 確かめ方

- **見た目と動きは iOS シミュレーターの Release ビルドで確かめる。** web 版
  （react-native-web）は画面の構成を見るためのもので、ネイティブでだけ壊れるもの
  （`crypto.randomUUID` の不在・`measureLayout` の引数等）を通してしまう
- ビルドは `pnpm --filter @mahjong-scoring/mobile sim:release`（`scripts/sim-release.sh`）。
  手元の Supabase（`:54321`）と web（`:3000`）に向けるので、シードユーザーでログインから
  記録まで確かめられ、本番には触れない。手でやると落とす工程を含む: Metro の変換
  キャッシュを捨てる（`EXPO_PUBLIC_*` はキャッシュのキーに入らず、前回の接続先が
  そのまま焼き込まれる）、焼き込まれた接続先の検査、`expo run:ios` が書き換える
  `package.json` の復元
- 操作と撮影は Maestro（`.maestro/`）。`pnpm --filter @mahjong-scoring/mobile maestro <flow>`
  でシミュレーターを名前で引いて流し、撮った画面のパスを出す（`MAESTRO_OUTPUT_DIR` で
  出力先を指定する）。撮った PNG は Read で開いて見る。画面を変えたら該当のフローを
  流し、無ければ足す。既存のフロー:
  - `home-guest` — ゲストのホーム。記録の案内（登録 CTA）から登録画面へ
  - `home-username-missing` — ユーザー名未設定（`ivan@`）でログイン → ユーザー名の設定へ
    送られる → ホームにユーザー名の案内
  - `challenge-recorded` — `bob@` でログインし雀頭の符計算を 1 回走らせ、結果に記録と EXP
  - `mypage-guest` / `mypage-username-missing` — ホームの人型のアイコンからマイページを
    開くと、記録の案内（登録 / ユーザー名の設定）が出る
  - `mypage-signed-in` — `bob@` のマイページ。見出しと直近 7 日のアクティビティ、今日の
    棒の内訳。棒を見るなら先に `challenge-recorded` を流す（シードに EXP は無い）
  - `my-record` — `bob@` のマイレコード。期間を今月に替え、全履歴で「さらに読み込む」。
    `challenge-recorded` は最後に結果からその土俵のマイレコードへ進む
  - `mypage-profile-edit` — `bob@` のプロフィール編集。入力の誤りで理由が出て留まり、
    表示名を書き換えて保存するとマイページの見出しに出る。最後に表示名をシードの値に戻す
  - `_sign-in` — 部品。`EMAIL` / `PASSWORD` を受けてメールでログインする
- フローで要素を押すときは `testID` で引く（文字は辞書で変わり、座標は端末で変わる）。
  押す部品に印が無ければ `testID` を足す。見えることの確認（assert）は辞書の文言でよい
- 状態の用意は web の dev seed（ルートの `CLAUDE.md` の「管理者ロールの割り当て」）。
  ゲストは `launchApp` の `clearState`、ユーザー名未設定は `ivan@`、記録が残る人は `bob@` 等
- 本番の接続先（EAS の `production` 環境の値）でビルドしたときは、登録・ログイン・記録を
  試さない。画面の表示を見るまで。ビルドしたら `strings <app>/main.jsbundle` で接続先を
  確かめてから操作する（`sim-release.sh` がローカル向けに行うのと同じ検査）
- TestFlight は `README.md` の「TestFlight に出す」。会話の中から出すなら
  `--non-interactive --no-wait` を足す（提出先・証明書は設定済み）
