# apps/mobile

web と同じ画面をネイティブで出す Expo アプリ。リポジトリ全体の規約（用語・i18n・
`packages/features`・コミット）はルートの `CLAUDE.md`。ここにはアプリだけの規約を置く。
開発環境の作り方・EAS の環境変数・TestFlight・Apple でログインの設定は `README.md`。

## 方針

web と同じ画面をネイティブで出す Expo アプリ。技術スタック（Expo + expo-router）は
参考プロジェクト（blindfold-chess の apps/mobile）に揃えている（バージョンは揃えない）。ロジックは
packages/features / core を共有し、アプリ側は画面と RN の部品だけを持つ。

**仕様は web を踏襲するが、外観まで web を写さない。** スマホアプリとして見慣れない
形（ヘッダーとタブバーの帯・グレー + 下線のリンク・中央のモーダル）はネイティブの
定石に置き換える。web から写すのは色の値と、線と影の規則（フラット。ルートの
`apps/web/src/app/CLAUDE.md`「線と影（フラット）」）と、緑の塗り = 押して始める面の記号。

- 画面の枠（`components/screen.tsx`）はネイティブ標準: 白地のヘッダー（左に戻る / ×、
  中央に見出し、右に「?」等）とヘアラインの区切り。解答中の画面（チャレンジ・
  トレーニング・訓練）は `backIcon="close"` で「閉じる」を出し、チャレンジだけ中止の
  確認を挟む。履歴が無いときの戻るは練習一覧へ
- リンクは下線を引かない（`lib/link-styles.ts`）。押せる行は濃い題名 + 右端の矢印 +
  押したときの地の色、単独の文字の操作はアクセント色の太字、本文中の語だけ下線。
  凡例や表の中で押せない語と同じ大きさで並ぶ語（「不正解: N」・内訳の役名）は
  色だけでは見分けられないが、`Text` の下線は太さも位置も選べず web の下線に
  見えないので、`InlineLink` で末尾の記号（矢印・ⓘ）を添える
- 説明・選択肢の一覧・選択欄は `BottomSheet`（下からのシート）。確認だけ中央の
  ダイアログ（`ConfirmationModal`）。`BottomSheet` の中身は OS 標準のシート
  （`@expo/ui`。iOS は SwiftUI の sheet、Android は Material 3）で、引き下げ・
  スクロールとの受け渡し・閉じる動き・幕・取っ手は各 OS のものが出る。シートの
  ジェスチャーや動きを自前で書き足さない。高さは `size`（`content` / `tall`）で
  選び、画面の割合を渡さない（Android は半分と全画面しか持たない。理由は
  `bottom-sheet.tsx` の TSDoc）
- 「?」のヘルプは `HelpTourSheet`（1 枚ずつ送るシート）。web の 2 種類（設定画面の
  `HelpTourModal` と画面の要素を照らす `SpotlightTour`）を、どちらもこの形で出す
  （要素を照らす仕組みはネイティブに無い。進め方の方だけ実物の見本を添える）
- 一覧の絞り込みは `FilterChips`（端まで流す独立したチップ）、2〜3 択の表示切り替えは
  `ToggleGroup`（セグメントコントロール）
- 答え合わせは色に加えて触覚（`lib/haptics.ts`、expo-haptics）でも知らせる
- 短い知らせは画面下の帯（`components/toast.tsx` の `showToast`。react-native-toast-message に
  自前の見た目を渡す。Android の Snackbar と同じ位置で、タブバーがあればその上）。web が
  トーストを出す操作はこちらでも出す。出すのは「読み流してよい完了」だけで、次の行動が要る
  知らせ（確認メールの送信・退会の受付）は画面かパネルに残し、失敗の理由はフォームの下
  （`FormMessage`）に置き、取り返しのつかない操作の確認は `ConfirmationModal` にする。
  OS の Toast（Android）や iOS の中央の HUD は使わない（両 OS で見た目が割れ、配色も選べない）。
  `Modal` を含む木の祖先では、平坦化を左右する props（`pointerEvents`・`transform`・`opacity`）を
  動的に切り替えない。切り替えるなら `collapsable={false}` で常にネイティブの view を持たせる —
  平坦化が外れると子の view が付け替えられ、同じ commit で開いた `Modal` が iOS で表示に失敗して
  押せない画面が残る（`recorded-challenge.tsx`。疑ったらシミュレーターのログで
  "Attempt to present" を grep する）
- 本文の文字は 15〜16pt（web の 14px を写さない）。辞書の改行は設定の説明では取り除く

- **画面の構成は web をなぞる。** ルートは expo-router で web と同じパス（`/practice/<slug>`,
  `/practice/<slug>/play` …）に置き、パスは `@mahjong-scoring/features/routes` で組み立てる。
  練習ごとに違うのは盤面と結果の一覧だけで、`src/practice/boards/<slug>/index.tsx` が
  `PracticeScreens`（Play / Training / Demo / ProblemList）を返し、`src/practice/registry.ts` に
  1 行足すと一覧・説明・チャレンジ・トレーニング・結果のすべてに載る
- **タブの入口（`/`・`/dojo`・`/practice`・`/lessons`・`/score-table`）へは `useGoToTab` で移る。**
  詳細の画面はルートのスタックに積んでいて、そこから `push` / `navigate` でタブへ送ると
  タブ一式がもう 1 組積まれる。履歴にある画面へ戻るリンクは `dismissTo`（slug ごとに使い回す
  `practice/[slug]` 等は `useDismissToHref`。`dismissTo` はルート名だけで照合する）。
  Android の戻るボタンは `useHardwareBack`（フォーカス中だけ購読する）
- **ログインは web と同じ Supabase Auth（`src/auth/`）。** ゲストの入口はホーム・
  マイページ・チャレンジの結果画面・レッスンの完了の記録の案内（`RecordCtaCard`）、ログアウト・退会はマイページの下のアカウントの
  画面（web の `/mypage/account`。web はログアウトをヘッダーのメニューに置くが、アプリには無い）で、
  ログイン・登録・ユーザー名の設定・退会の画面は web と同じパスに置く。セッションは
  SecureStore、サーバーへの書き込みは web のアプリ向け API（`/api/mobile/v1/*`、
  `Authorization: Bearer`。web の `lib/mobile-api/`）を通す。DB を直接読み書きしない。
  ログインはメールと Apple（iOS のネイティブだけ。`auth/apple-sign-in.ts`）。Apple の認可コードは
  サーバーが交換して保存し、退会の最後の工程で Apple 側の連携を取り消す（`apple_refresh_tokens`）。
  外部の設定と実機での確かめ方は `apps/mobile/README.md`。
  ログインは任意で、ゲストのまま設定以外の全機能を使える。結果はメモリのストアで結果画面へ運ぶ
  （web の sessionStorage の代わり）。設定は端末ローカル（AsyncStorage）。例外はランキングへの
  掲載の設定（設定のプライバシー）で、web と同じくサーバーに保存する（`profiles` に持つ値で、
  web のランキングの母集団を決めるため）
- **設定は web と同じくログイン中だけ使う。** 入口はマイページの「設定」の行（web の
  アカウントのメニューに当たる）で、ログイン中にだけ出す。ホームのヘッダーに歯車を
  常設しない（web もヘッダーに設定を常設しない）。ゲストが項目へのリンクから開くと
  会員限定ゲート（`preferences/members-only-gate.tsx`）が中身の代わりに登録の案内を出す。
  設定に置くのはアプリの振る舞いを変える項目だけ。アカウント（ログアウト・退会）と
  利用規約・プライバシーポリシー等（審査ガイドライン 5.1.1）はマイページに置く（web と同じ
  画面の構成。規約等は web のフッターに当たり、ゲストにもログイン中の人にも出す）
- **記録はログイン中（ユーザー名を決めた人）だけサーバーに残す。** チャレンジは web と
  同じくサーバーで採点・記録し（`practice/recorded-challenge.tsx`）、通信できなければ記録付きでは
  始めない。サーバーへ送り切るまでの記録（進行中のチャレンジ・確定待ち・未送信のレッスン完了）は
  userId ごとに端末へ預け（`records/account-records.ts`）、預けたユーザーの名義でだけ送る
  （`callMobileApi` の `asUser`）。ゲストのレッスン完了・「チャレンジを終えた練習」は端末の
  ゲストの記録で、ログイン中の記録をそこへ書かない。ゲストのレッスン完了は端末で 1 度だけ
  最初にログインしたアカウントへ取り込み、「チャレンジを終えた練習」はサーバーへ送らず
  案内（行程）にだけ合わせる。昇級試験の本番は記録付きでしか始めず（ゲスト等は説明画面へ戻す）、
  確定の応答の `grantedRanks` で結果画面に昇級を出す。受験資格はサーバーが開始時に検査する
- **iOS は Pro を App Store のアプリ内課金で売る。** 30 日パスは消耗型（購入シートのボタンを
  「購入」にするため。理由は web の `record.ts` の `APPLE_PRODUCT_TYPES`）、買い切りは非消耗型。
  購入の権利は web と共通（同じ `purchases`、同じ `hasBenefit`）で、web で買った Pro はアプリで、
  アプリで買った Pro は web で有効。iOS 限定の分岐は `src/billing/iap-availability.ts` の
  `IAP_AVAILABLE` に集め、画面で `Platform.OS` を見ない。Android は Pro を扱わない（購入・表示・
  回数制限のどれも出さない）。通知（`/mypage/notifications`）も種別がすべて Pro の出来事なので
  iOS だけに出す。購入・復元・プラン画面は `src/billing/`。購入の同期
  （`usePurchaseSync`）がルートで動き、取引はサーバーが 2xx か 4xx を返したときだけ finish する
  （理由は `purchase-sync.ts`）。アプリの中で web の価格・`/plan`・特商法・Stripe に触れず、購入履歴に
  金額を出さない（審査ガイドライン 3.1.1）。回数制限は web と同じ表と規則で iOS だけに掛かり
  （`src/practice/quota/`）、ゲストは端末ローカルで練習ごとに 1 日 1 問。対象は和了形・聴牌形の
  点数計算と 1級・初段の模試（`isQuotaMenu`。模試は `createTrainingView` が出題ホストで通す）。
  販売していない（サーバーに Product ID が無い）間は制限しない。ストアの設定・環境変数・Sandbox の許可リストは `README.md`「アプリ内課金」
- **アプリの中で他の利用者を見せない。受け付ける自由入力はユーザー名だけ。** ランキングの詳細・
  練習の画面の上位・公開プロフィール・通報・ブロック・プロフィールの編集（表示名・自己紹介・SNS・
  アバター）は web だけに置き、アプリは自分の順位（`app/leaderboard/index.tsx`）とランキングへの
  掲載の切り替え（設定のプライバシー）だけを持つ。他の利用者が入力したものをアプリに出すと、
  App Store の審査ガイドライン 1.2（利用者の投稿を載せるアプリは通報・ブロック・フィルタ・迅速な
  対応を備えること）の対象になりうる。ユーザー名だけの一覧が免除されるとは本文に無いので、名前付き・
  匿名を問わず他の人の行を足さない（匿名の順位表も、web の同じ順位と突き合わせれば誰か分かる）。
  web のページを WebView で開いて同じものを見せることもしない（外部ブラウザで開く）。web は通報・
  ブロック・禁止語フィルタ・管理画面でこれまでどおり運用する。アプリで記録したユーザー名と成績も
  web のランキングに載るので、そのことはユーザー名の設定画面で伝えている
- **色・角丸の値は web から写す。** `src/lib/theme.ts`（web の `globals.css` と同じ値）
- **線と影はフラット（web と同じ）。** 線は 1px（`borderWidth.panel`）で、太枠・右下へずらした
  ハードシャドウ・押し込み（押すと面が動く・縮む）・文字の影は使わない（2026-10 に web に揃えた）。
  情報の優先順位は線の太さではなく、塗り（ボタンの緑・段級位の帯色・状態色）と文字の大きさで示す
  - 押せる面（ボタン・選択肢・待ち牌・マス）は `PressableSurface`。押している間は `pressedStyle`
    （一段濃い塗り・枠の色）だけを重ね、位置も大きさも変えない。ボタンは `Button` / `BeltButton`
    （塗り + 1px の枠。塗りのボタンは枠を透明に）で、色・枠の一式を画面側で書かない
  - 影（`floatingShadow`）は画面の上に浮く層（中央のダイアログ）だけ。下からのシートは影も枠も
    持たず、幕の暗さで浮かせる。地に置いた面（カード・ボタン・表・選択肢）は影を持たない
  - 表示だけのカード・表・設定のカード・一覧の枠は `lib/panel-styles.ts` の `panelFrame`
    （1px の `colors.panel` + `radius.panel`。web の `rounded-panel border border-panel`）
  - フォーム部品（選択欄・入力欄・選択肢・待ち牌・練習の設定のタイル）の枠は一段濃い灰
    （`surface300` / `surface400`）。選択中は `InsetRing`（枠の内側の 1px の線。web の
    `ring-1 ring-inset`）を足し、塗りだけに頼らない
  - 段級位のカードは `beltCardFrame()`（細枠 + 上端だけ帯色の 2px。1px では淡い級が細線に紛れる）。
    小さな印は `Chip`、区切りは `Divider`（破線は使わない）
  - 2px が残るのは状態の印だけ（表の注目のセル・答え合わせの牌の印・小さなチェックボックス・
    目次の丸）。面の枠には使わない
- **牌は `Hai` / `FuroTiles` を使う。** `@pai-forge/mahjong-react-ui` の `Furo` /
  `HaiBack` / `Tehai` は `div` と Tailwind のクラスで描く web 専用の実装で、ネイティブでは描けない。
  `Hai` は 0.5.0 から `onClick` が無ければ `View` で包まれ、ボタンの中に置いてもタップを奪わない
  （0.4.0 までは常に `Pressable` で包まれ、ネイティブでは画像も描かれなかった）
- **Expo SDK の推奨と違う版を 3 つ意図して使う**（`package.json` の `expo.install.exclude`）。
  `npx expo install --fix` で戻さないこと
  - `react` / `react-dom` — ワークスペース全体と同じ版にそろえる。packages/features も devDependency で
    React を持ち、版が違うと pnpm が別の実体を置き、Metro が共有コードの React を別に解決して
    React が 2 つバンドルに入る（フックが落ちる）。RN のレンダラーは React の版を厳密には検査しないが、
    React Native は peer に React の最低版を求める。SDK を上げて unmet peer が出たら、web・features の
    React も一緒に上げる
  - `typescript` — 他のパッケージと同じ TS7。`expo start` から iOS / Android / web のバンドルまで通る
    （以前の SDK では Expo の CLI が TS7 で Metro まで届かず、5 系に固定していた。SDK を上げて
    バンドルが落ちたらまずここを疑う）
- **ネイティブ広告は web と同じ画面の同じ位置に出す。** 広告は web の広告配信 API
  （`/api/ads/<スロット>`）から読み（`src/ads/use-native-ads.ts`）、スロットは
  `MOBILE_AD_SLOTS`（features の `ads/native-ad.ts`）で web とは別に持つ（成果をトラッキング ID で
  分けるため）。web に広告の置き場所を足したら、アプリに同じ画面があればこちらにも足す。
  開発中は Metro を動かす Mac の web（`:3000`）を読む（`src/lib/site-url.ts`）
- **JS は Static Hermes で動き、web にある組み込みの一部が無い。** `Array.prototype.toSorted`・
  `Object.groupBy` は無く、呼ぶと画面ごと落ちる（型も web のテストも通る）。アプリと共有コード
  （`packages/features`・`core`）ではルートの `eslint.config.mjs` が弾く。新しい組み込みを使う前に
  実機の Release ビルドで確かめ、無ければ同じ規則に足す
- **iPad は対象にしない（`app.json` の `ios.supportsTablet: false`）。** 本文に最大幅の上限が無く、
  iPad の横向き・分割表示ではボタンやカードが端まで伸び、牌（`AutoScale` は拡大しない）だけが
  小さく浮く。iPad では iPhone 版が互換モードで動く。足すなら本文の最大幅を決めて iPad で
  確かめてから — 一度ストアで iPad に対応すると、対応を外した版は App Store Connect が受け付けない
- **使わない権限の用途の文言を Info.plist に残さない。** expo-secure-store は既定で Face ID の
  用途（英語）を書き込むが、`requireAuthentication` を使わないので `faceIDPermission: false` で消している
- **収集するデータは `app.json` の `ios.privacyManifests` に書き、App Store Connect のプライバシー
  ラベルと揃える。** いまはメールアドレス・ユーザー ID（ユーザー名を含む）・購入履歴・練習の記録
  （GameplayContent）で、どれもアカウントに紐づき、トラッキングしない。サーバーに送るものを足したら
  両方を直す。API の利用理由（UserDefaults 等）は書かない — `pod install` が依存のマニフェストから
  集めて足す（prebuild 直後のファイルでは空に見える）
- **web 版（`pnpm --filter @mahjong-scoring/mobile web`）は画面確認用**
- 辞書は web と同じもの（`@mahjong-scoring/messages`）を use-intl で読む

## 確かめ方

- **見た目と動きは iOS シミュレーターの Release ビルドで確かめる。** web 版
  （react-native-web）は画面の構成を見るためのもので、ネイティブでだけ壊れるもの
  （`crypto.randomUUID` の不在・`measureLayout` の引数等）を通してしまう
- ビルドは `pnpm --filter @mahjong-scoring/mobile sim:release`（`scripts/sim-release.sh`）。
  Xcode は `xcode-select` のものでよい（起動直後に落ちたときの見方は `README.md`「使う Xcode」）。
  手元の Supabase（`:54321`）と web（`:3000`）に向けるので、シードユーザーでログインから
  記録まで確かめられ、本番には触れない。手でやると落とす工程を含む: Metro の変換
  キャッシュを捨てる（`EXPO_PUBLIC_*` はキャッシュのキーに入らず、前回の接続先が
  そのまま焼き込まれる）、焼き込まれた接続先の検査、`expo run:ios` が書き換える
  `package.json` の復元
- 操作と撮影は Maestro（`.maestro/`）。`pnpm --filter @mahjong-scoring/mobile maestro <flow>`
  でシミュレーターを名前で引いて流し、撮った画面のパスを出す（`MAESTRO_OUTPUT_DIR` で
  出力先を指定する）。撮った PNG は Read で開いて見る。画面を変えたら該当のフローを
  流し、無ければ足す。既存のフローの一覧と各フローが確かめることは `.maestro/README.md`
- フローで要素を押すときは `testID` で引く（文字は辞書で変わり、座標は端末で変わる）。
  押す部品に印が無ければ `testID` を足す。見えることの確認（assert）は辞書の文言でよい。
  その代わり文言を変えるとフローが落ちるので、辞書の文言を変えたら `.maestro/` をその文言で grep する
  （「次にやること」はほぼ全フローの起動待ちに使っている）。
  ただし `LinkRow` のように行全体が 1 つのアクセシビリティ要素にまとまる部品の中の文字
  （「固定」のチップ等）は単体では見つからないので `".*固定.*"` の正規表現で引く。広告の行は
  `accessibilityLabel` が「広告、<題名>、<説明>」なので `"広告、.*"`（画面の「PR」では引けない）。
  段落の中のリンク（入れ子の `Text`）も段落全体が 1 要素で、リンクだけを押せない
- Android はエミュレーターの Release ビルドで確かめる（`android/` は gitignore 済みで
  `npx expo run:android --variant release --no-bundler` が生成する。`expo run:*` は package.json を
  書き換えるので前後で退避・復元する）。Maestro は `maestro --device emulator-5554 test <flow>`
  （`scripts/maestro.sh` は iOS 専用）。Release は平文 HTTP を通さずローカルの Supabase に
  ログインできない（「通信できませんでした」）ので、ログインが要る確認は iOS で行い、Android は
  ゲストで同じ構造を確かめる。起動直後の `openLink` は捨てられるので `launchApp` の後に画面の文言を
  待ってから開く。`hideKeyboard` は複数行の入力欄で効かない（return が改行）ので見出し等を押して閉じる。
  iOS の反復は `sim:release` を毎回回さず、`expo export:embed --platform ios --dev false
--bundle-output "$APP/main.jsbundle" --assets-dest "$APP"`（`APP` は `simctl get_app_container`）で
  JS だけ差し替えられる（`EXPO_PUBLIC_*` と metro-cache の削除は `sim-release.sh` と同じにする）
- 状態の用意は web の dev seed（`apps/web/CLAUDE.md`「管理者ロールと開発用シード」）。
  ゲストは `launchApp` の `clearState`、ユーザー名未設定は `ivan@`、記録が残る人は `bob@` 等
- 本番の接続先（EAS の `production` 環境の値）でビルドしたときは、登録・ログイン・記録を
  試さない。画面の表示を見るまで。ビルドしたら `strings <app>/main.jsbundle` で接続先を
  確かめてから操作する（`sim-release.sh` がローカル向けに行うのと同じ検査）
- TestFlight はスキル `ship-to-testflight`（`scripts/testflight.sh` で投入し、`testflight-status.sh` で
  見届ける）。EAS 側の設定は `README.md` の「TestFlight に出す」
