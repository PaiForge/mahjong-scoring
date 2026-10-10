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
`CLAUDE.md`「線と影（フラット）」）と、緑の塗り = 押して始める面の記号。

- 画面の枠（`components/screen.tsx`）はネイティブ標準: 白地のヘッダー（左に戻る / ×、
  中央に見出し、右に「?」等）とヘアラインの区切り。解答中の画面（チャレンジ・
  トレーニング・訓練）は `backIcon="close"` で「閉じる」を出し、チャレンジだけ中止の
  確認を挟む。履歴が無いときの戻るは練習一覧へ
- リンクは下線を引かない（`lib/link-styles.ts`）。押せる行は濃い題名 + 右端の矢印 +
  押したときの地の色、単独の文字の操作はアクセント色の太字、本文中の語だけ下線
- 説明・選択肢の一覧・選択欄は `BottomSheet`（下からのシート）。確認だけ中央の
  ダイアログ（`ConfirmationModal`）。`BottomSheet` は自前の実装（幕のフェード・
  シートのスライド・引き下げて閉じる）で、スクロールとの受け渡し・段階の高さ・
  キーボードの回避が要る中身を載せるときは中を `@gorhom/bottom-sheet` に替える
  （理由は `bottom-sheet.tsx` の TSDoc）
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
  OS の Toast（Android）や iOS の中央の HUD は使わない（両 OS で見た目が割れ、配色も選べない）
- 本文の文字は 15〜16pt（web の 14px を写さない）。辞書の改行は設定の説明では取り除く

- **画面の構成は web をなぞる。** ルートは expo-router で web と同じパス（`/practice/<slug>`,
  `/practice/<slug>/play` …）に置き、パスは `@mahjong-scoring/features/routes` で組み立てる。
  練習ごとに違うのは盤面と結果の一覧だけで、`src/practice/boards/<slug>/index.tsx` が
  `PracticeScreens`（Play / Training / Demo / ProblemList）を返し、`src/practice/registry.ts` に
  1 行足すと一覧・説明・チャレンジ・トレーニング・結果のすべてに載る
- **ファイルを送るときは expo-file-system の `File` を FormData に入れる。** global の
  `fetch` は Expo の実装（expo/fetch）に置き換わっていて、RN の `{ uri, name, type }` の部品は
  送る前に例外になる（通信の失敗に見える。`mypage/mypage-api.ts` の `uploadAvatar`）
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
  案内（行程）にだけ合わせる。昇級試験の本番は記録付きでしか始めず（ゲスト等は説明画面へ戻す）、
  確定の応答の `grantedRanks` で結果画面に昇級を出す。受験資格はサーバーが開始時に検査する
- **アプリでは Pro（有料プラン）を扱わない。** 全員に同じ無料の機能を出し、購入の導線も出さない。
  web で Pro を買ったアカウントでもアプリでは差を付けない（アプリの外で買った特典をアプリで開けるなら、
  同じものをアプリ内課金でも売る必要がある — 審査ガイドライン 3.1）。web の練習の回数制限
  （practice-quota）はアプリの練習には掛からない。要求の本文の申告（「iOS から」等）で web の
  制限を外す経路も作らない。アプリ内課金を入れるときに購入の権利を web と共通にする
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
    React が 2 つバンドルに入る（フックが落ちる）。RN のレンダラーは React の版を厳密には検査しない
  - `typescript` — 他のパッケージと同じ TS7。SDK 54 では Expo の CLI が TS7 で Metro まで届かず
    5.9 に固定していたが、SDK 57 では `expo start` から iOS / Android / web のバンドルまで通る
- **ネイティブ広告は web と同じ画面の同じ位置に出す。** 広告は web の広告配信 API
  （`/api/ads/<スロット>`）から読み（`src/ads/use-native-ads.ts`）、スロットは
  `MOBILE_AD_SLOTS`（features の `ads/native-ad.ts`）で web とは別に持つ（成果をトラッキング ID で
  分けるため）。web に広告の置き場所を足したら、アプリに同じ画面があればこちらにも足す。
  開発中は Metro を動かす Mac の web（`:3000`）を読む（`src/lib/site-url.ts`）
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
  - `setup-username-generate` — `ivan@` のユーザー名の設定で自動生成を押すと、
    `player_` + 16 進 10 桁が欄に入る。登録はしない（`ivan@` を未設定のまま残す）
  - `challenge-recorded` — `bob@` でログインし雀頭の符計算を 1 回走らせ、結果に記録と EXP
  - `challenge-quit-recorded` — `bob@` のチャレンジで中止の確認を開いて「続ける」で戻り、答えられること、
    もう一度開いて中止するとトーストが出ること（記録付きだけで起きた、確認が出ず押せなくなる不具合の再現）
  - `mypage-guest` / `mypage-username-missing` — ホームの人型のアイコンからマイページを
    開くと、記録の案内（登録 / ユーザー名の設定）が出る
  - `mypage-signed-in` — `bob@` のマイページ。見出しと直近 7 日のアクティビティ、今日の
    棒の内訳。棒を見るなら先に `challenge-recorded` を流す（シードに EXP は無い）
  - `my-record` — `bob@` のマイレコード。期間を今月に替え、全履歴で「さらに読み込む」。
    `challenge-recorded` は最後に結果からその土俵のマイレコードへ進む
  - `mypage-profile-edit` — `bob@` のプロフィール編集。入力の誤りで理由が出て留まり、
    表示名を書き換えて保存するとマイページの見出しに出る。最後に表示名をシードの値に戻す
  - `mypage-avatar` — `bob@` のアバター。写真ライブラリ（`addMedia` で足したアプリの
    アイコン）から選んで上げ、マイページの見出しに出る。最後に削除して頭文字に戻す。
    システムの写真の選択と切り抜きの画面は文字が端末の言語で変わるので、印で引く
    （`PXGGridLayout-Info` の先頭・`Done`）
  - `design-surfaces` — ゲストで線と影（フラット）の見た目を撮る。ホーム・道場の帯色のボタン・
    練習の設定のタイル・チャレンジの選択肢と正誤・中止の確認ダイアログ・待ち牌の選択・
    回答中のマス。押している間の色は撮れない
  - `preferences-site-links` — ゲストの設定の「その他」に規約・プライバシーポリシー・
    お問い合わせ・運営者情報が並び（特商法の表記は無い）、プライバシーポリシーが Safari で開く
  - `exam-gate` — 昇級試験の説明の受験ゲート。ゲストは登録の案内、無級の `alice@` が 4級の
    試験を開くと先に取る級と道場への導線。模試はどちらも受けられる
  - `exam-play` — `bob@`（5級）が 4級の本番を説明から始め、最初の選択肢を押し続けて終わらせる。
    結果に合否の帯が出て判定の送信が済む。合格（昇級バナー）は Maestro では作れない
  - `announcements` — ゲストのホームの末尾にお知らせ 3 件（ピン留めが先）、「すべて見る」で一覧
    （末尾に広告の行）、dev seed の「書式の見本」の詳細で本文の描き方（リンク・箇条書き・引用・
    コード・表）を撮る
  - `forgot-password` — ログイン画面の「パスワードを忘れた方」から再設定のリンクを送り、送った
    案内が出る。届いたメール（`bob@` 宛て）は Mailpit（`:54324`）で見る
  - `toast-exits` — ゲストでチャレンジの中止・トレーニングの終了・和了形の点数計算の終了の
    トーストが、戻った先の画面の下に出る
  - `leaderboard-guest` — ゲストで練習の説明の末尾の総合ランキングの上位から詳細へ。期間を
    月間に替えて「さらに読み込む」、行から公開プロフィール、最後に一覧（分野の行と広告の行）
  - `leaderboard-signed-in` — `bob@` の一覧に各土俵の順位、詳細で自分の行が塗られる。自分の
    行から本人の公開プロフィール、`seed_alice` のプロフィールも開く
  - `moderation-signed-in` — `bob@` が `seed_alice` を通報（「その他」で詳細が無いと誤り →
    宣伝・スパムで送る）、ブロックしてブロック中の案内とランキングから消えたことを撮り、
    設定の「ブロックしたユーザー」で解除して元に戻す。通報は管理画面（`/admin/reports`）で見る
    （運営者へのメールは Resend なので手元では送られない）
  - `moderation-guest` — ゲストの公開プロフィールに、通報とブロックにはログインが要る旨
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
