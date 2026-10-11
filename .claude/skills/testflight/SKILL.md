---
name: testflight
description: モバイルアプリ（apps/mobile）の iOS ビルドを EAS で作り、TestFlight（App Store Connect）へ送って、ビルドと提出が終わるまで見届けて結果を報告する手順。「TestFlight に出して」「新しいビルドを配信して」「EAS でビルドして TestFlight へ」等で使う。Android・ストアの審査提出・シミュレーター向けのビルド（sim:release）は対象外。
---

# TestFlight に出す

投入と状態の確認はスクリプトが持つ。このスキルは「投入 → 見届ける → 確かめてから報告する」の
流れだけを決める。EAS の設定（環境変数・証明書・提出先）の説明は `apps/mobile/README.md` の
「TestFlight に出す」にある。

## 1. 投入する

```bash
pnpm --filter @mahjong-scoring/mobile testflight
```

`scripts/testflight.sh` は投入の前に次を確かめ、満たさなければ理由を出して止まる。止まったら
理由を直す。検査を外したり `eas build` を直接叩いて回り込まない。

- main にいて、HEAD が origin/main と一致し、アプリと共有パッケージに未コミットの変更が無い。
  main 以外から出したいとユーザーが言ったときだけ `-- --any-branch` を付ける（Preview の確認用等）。
  push・取り込みが要るなら、その操作の許可をユーザーに求める
- 依存が入っている（無ければリポジトリのルートで `pnpm install --frozen-lockfile`）
- EAS にログインしている（していなければユーザーに `! npx eas-cli login` を頼む）
- EAS の `production` 環境に Supabase の接続先がある（無ければ README の「本番の接続先」）

成功すると最後の行が `testflight: build <ビルド ID>` になる。ビルド番号は EAS が 1 つ上げる。
ビルドのページ（`https://expo.dev/accounts/k0kishima/projects/mahjong-scoring/builds/<ID>`）を
ユーザーに伝える。

## 2. 見届ける

Monitor で見張る（`timeout_ms` は上限の 1800000。iOS のビルドは 15〜25 分、提出は数分）:

```bash
cd apps/mobile && scripts/testflight-status.sh <ビルド ID> --watch
```

状態が変わるたびに `時刻 build=<状態> submission=<状態> buildNumber=<番号>` が 1 行出て、
終わると抜ける。期限で切れたら同じコマンドで掛け直す。待つ間は他の作業をしてよい。

## 3. 確かめてから報告する

**完了・失敗を伝える前に、必ずその場で状態を取り直す。**

```bash
cd apps/mobile && scripts/testflight-status.sh <ビルド ID>
```

この出力の行を根拠にして報告する。Monitor の通知の文面や、「そろそろ終わっているはず」という
見込みを根拠にしない（以前、届いていない完了を報告したことがある）。`date` で今の時刻も見ると、
通知の時刻との食い違いに気づける。

| 状態                                     | 伝えること                                                                                                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `submission=FINISHED`                    | App Store Connect が受け取った。TestFlight に並ぶのは Apple 側の処理（10〜30 分）の後で、内部テストのグループに入っていれば審査なしで入れられる。本番の Supabase・web に繋がるので、試すなら README の注意どおり |
| `build=ERRORED`                          | ビルドのログ（`npx eas-cli build:view <ID> --json` の `logFiles`）を読み、失敗した工程と原因を要約する。ログは brotli 圧縮のことがあり、node の `zlib.brotliDecompressSync` で読める                             |
| `submission=ERRORED`                     | 提出のログ（`npx eas-cli submit:list --platform ios --json` の該当の `logFiles`）を読む。ビルドは成功しているので、直したら `npx eas-cli submit --platform ios --id <ビルド ID>` で提出だけやり直せる            |
| `build=CANCELED` / `submission=CANCELED` | 誰かが取り消した。やり直すかをユーザーに聞く                                                                                                                                                                     |

## やらないこと

- 出来たビルドで本番の登録・ログイン・記録を試すこと（`apps/mobile/CLAUDE.md` の「確かめ方」）
- App Store の審査への提出。TestFlight までで止める
