# Stripe セットアップ（有料プラン）

有料プラン「Pro」（30 日パス + 買い切り）を動かすための Stripe Dashboard と環境変数の設定手順です。
決済は Stripe Checkout（Stripe がホストする決済ページへのリダイレクト方式）で、一括払いのみ。
サブスクリプション（自動更新）は使いません。

> **Note:** テストモードと本番（ライブモード）は、API キー・Price ID・Webhook シークレットのすべてが別の値です。
> ローカル開発ではテストモードの値を `.env.local` に、本番では Vercel の環境変数にライブモードの値を設定します。

## Prerequisites

- [Stripe アカウント](https://dashboard.stripe.com/register)
- Stripe CLI（ローカルで Webhook を受けるために必要）: `brew install stripe/stripe-cli/stripe`

## 1. API キーの取得

### テスト環境

1. [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) > 開発者 > API キー
2. **シークレットキー**（`sk_test_...`）→ `.env.local` の `STRIPE_SECRET_KEY`

公開可能キー（`pk_...`）は使いません。Checkout はリダイレクト方式で、ブラウザ側に Stripe の SDK を載せないためです。

### 本番環境

1. [Stripe Dashboard](https://dashboard.stripe.com/apikeys) > 開発者 > API キー（ライブモード）
2. シークレットキー（`sk_live_...`）→ Vercel の環境変数 `STRIPE_SECRET_KEY`

> **Security:** `STRIPE_SECRET_KEY` に `NEXT_PUBLIC_` を付けないこと。サーバー側（`src/lib/billing/stripe.ts`）だけが読みます。

## 2. 商品と価格の作成

プラン 1 つ（Pro）に対して、売り方ごとに一括払いの Price を 1 つ作ります。アプリ側の定義は `src/lib/billing/plans.ts` にあり、
Price ID は環境変数で結び付けます（`src/lib/billing/env.ts`）。

### スクリプトで作る（推奨）

`scripts/stripe-bootstrap.ts` が定義どおりに商品と Price を作り、環境変数の行を出力します。Price の `lookup_key`
（`pro_pass` / `pro_lifetime`）で冪等になっており、何度実行しても既存のものを再利用します。

```bash
# apps/web で実行。鍵は STRIPE_SECRET_KEY（.env.local）か、Stripe CLI のログイン情報から渡す
STRIPE_SECRET_KEY="$(stripe config --list --project-name mahjong-scoring \
  | awk -F= '/test_mode_api_key/{print $2}' | tr -d ' ')" \
  pnpm stripe:bootstrap

# 金額を指定する場合（最小通貨単位。JPY は円。既定は 30 日パス 480 / 買い切り 1480）
pnpm stripe:bootstrap --pass-amount 480 --lifetime-amount 1480
```

出力された `STRIPE_PRICE_ID_PRO_PASS` / `STRIPE_PRICE_ID_PRO_LIFETIME` の行を `.env.local` に追加してください。
本番はライブモードの鍵で同じコマンドを実行し、出力を Vercel の環境変数に設定します。

> **Note:** 金額は作成時にしか使いません。Stripe の Price は金額を変更できないため、価格改定は Dashboard で
> 新しい Price を作り、`lookup_key` を付け替えます（旧 Price は無効化）。環境変数も新しい ID に差し替えてください。

### Dashboard で作る場合

1. [Stripe Dashboard](https://dashboard.stripe.com/test/products) > 商品カタログ > **+ 商品を追加**
2. 商品の **名前** を `Pro` にし、メタデータに `plan` = `pro` を付ける
3. 価格を 2 つ作る（商品の詳細画面で「別の価格を追加」）:

   | 用途      | 料金体系 | 請求 | 通貨 | lookup_key     | 環境変数                       |
   | --------- | -------- | ---- | ---- | -------------- | ------------------------------ |
   | 30 日パス | 標準     | 一括 | JPY  | `pro_pass`     | `STRIPE_PRICE_ID_PRO_PASS`     |
   | 買い切り  | 標準     | 一括 | JPY  | `pro_lifetime` | `STRIPE_PRICE_ID_PRO_LIFETIME` |

   > **Note:** どちらも「**一括**」（one-time）で作ること。「継続」（recurring）にするとサブスクリプションになり、アプリは記録しません。

### 他通貨を足すとき

Price を増やさず、既存の Price に **複数通貨の価格**（`currency_options`）を足します。Dashboard の価格の編集から
「別の通貨で価格を追加」で設定できます。環境変数も表示コードも変わりません（Checkout が通貨を選ぶだけ）。

## 3. Webhook の設定

アプリは次の 2 イベントを受けます（`src/app/api/stripe/webhook/route.ts`）:

| イベント                     | 用途                                                      |
| ---------------------------- | --------------------------------------------------------- |
| `checkout.session.completed` | 購入の記録（Checkout 完了の着地と二重に受け、冪等に処理） |
| `charge.refunded`            | 全額返金による特典の取り消し                              |

### ローカル開発（Stripe CLI）

```bash
# Stripe CLI にログイン
stripe login

# Webhook をローカルへ転送（開発サーバーと別のターミナルで起動したままにする）
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

起動時に表示される署名シークレット（`whsec_...`）→ `.env.local` の `STRIPE_WEBHOOK_SECRET`

> **Note:** `stripe listen` が動いている間だけ Webhook が届きます。CLI を止めると、Checkout 完了は着地側の処理で記録されますが、返金は反映されません。

#### テストイベントの送信

```bash
stripe trigger checkout.session.completed
stripe trigger charge.refunded
```

> **Note:** `stripe trigger` が作る Session の Price はこちらの環境変数と一致せず、顧客も `stripe_customers` に無いため、
> アプリは「知らない価格」「知らない顧客」として記録を見送ります（ログに残ります）。署名検証と疎通の確認に使い、
> 購入の記録まで試すには実際に Checkout を通してください（下のテストカード）。

### 本番環境（Stripe Dashboard）

1. [Stripe Dashboard](https://dashboard.stripe.com/webhooks) > 開発者 > Webhook > **+ エンドポイントを追加**
2. 設定:
   - **エンドポイント URL**: `https://<本番ドメイン>/api/stripe/webhook`
   - **送信するイベント**: `checkout.session.completed`, `charge.refunded`
3. 保存後、エンドポイント詳細の **署名シークレット**（`whsec_...`）→ Vercel の環境変数 `STRIPE_WEBHOOK_SECRET`

> **Important:** 本番の署名シークレットとローカル（`stripe listen`）の値は別物です。

## 4. 支払い方法と領収書

- **支払い方法**: 当面カードのみ。[設定 > 支払い方法](https://dashboard.stripe.com/settings/payment_methods) でコンビニ決済・銀行振込を
  有効にしないこと。非同期の支払い方法を足すには `checkout.session.async_payment_succeeded` の処理が必要になります
- **領収書メール**: [設定 > メール](https://dashboard.stripe.com/settings/emails) で「支払いが成功したときに顧客にメールを送信」を有効にする。
  アプリは領収書を自前で送りません
- **顧客ポータル**: 使いません（契約が無いので管理するものがない）

## 5. 環境変数まとめ

### ローカル開発（`.env.local`）

```env
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXX   # stripe listen の出力
STRIPE_PRICE_ID_PRO_PASS=price_XXXXXXXXXXXXXXXXXXXX      # テスト環境の 30 日パス
STRIPE_PRICE_ID_PRO_LIFETIME=price_XXXXXXXXXXXXXXXXXXXX  # テスト環境の買い切り
```

### 本番（Vercel の環境変数）

```
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXX   # Dashboard の Webhook エンドポイントの署名シークレット
STRIPE_PRICE_ID_PRO_PASS=price_XXXXXXXXXXXXXXXXXXXX
STRIPE_PRICE_ID_PRO_LIFETIME=price_XXXXXXXXXXXXXXXXXXXX
```

未設定の変数があると、Stripe を使う処理が初めて呼ばれた時点で変数名を含む例外になります（起動時には落ちません）。
Checkout 開始時に Price ID・特典・期間を DB に保存するため、その後環境変数を切り替えても開始済みの購入は旧条件で記録されます。

## 6. 動作確認チェックリスト

### テスト環境

- [ ] 商品 `Pro` と Price 2 つ（一括）を作成した
- [ ] `.env.local` に 4 つの変数を設定した
- [ ] `stripe listen` で Webhook を転送している
- [ ] `/plan` が表示され、価格が Stripe の値で出る
- [ ] 「購入する」で Stripe Checkout に遷移する
- [ ] テストカード（`4242 4242 4242 4242`）で決済が完了する
- [ ] `/mypage/plan` に戻り、`purchases` に行ができている
- [ ] `practice/score` と `practice/machi-score` の回数制限が外れ、拡張機能が使える
- [ ] パス有効中・買い切り保有中は追加購入できない（売り方を問わず）
- [ ] 複数タブで同時に購入を開始しても同じ Checkout に戻る
- [ ] Checkout 開始後に Price ID を切り替えても、開始済みの購入を記録できる
- [ ] Dashboard で全額返金すると、行の `revoked_at` が立ち特典が消える

### テストカード

| カード番号            | 用途                   |
| --------------------- | ---------------------- |
| `4242 4242 4242 4242` | 決済成功               |
| `4000 0000 0000 0341` | 決済失敗（カード拒否） |
| `4000 0000 0000 3220` | 3D セキュア認証        |

有効期限は未来の任意の日付、CVC は任意の 3 桁。

### 本番移行

- [ ] ライブモードで商品と Price 2 つを作成した
- [ ] 本番の Webhook エンドポイントを登録した（2 イベント）
- [ ] 領収書メールを有効にした
- [ ] Vercel に 4 つの環境変数を設定した（`sk_live_` / 本番の `whsec_` / 本番の `price_` × 2）
- [ ] 特定商取引法に基づく表記・利用規約・プライバシーポリシーを公開した
- [ ] 実カードで少額決済を 1 回通し、Dashboard の Webhook ログで配信成功を確認した

## トラブルシューティング

### `Webhook signature verification failed`

- `.env.local` の `STRIPE_WEBHOOK_SECRET` が `stripe listen` の出力と一致しているか
- 本番は Dashboard のエンドポイント詳細の署名シークレットを使う（ローカルの値と別）

### Checkout に遷移しない

- `STRIPE_PRICE_ID_PRO_*` がその環境（テスト / 本番）の値か。テストモードのキーで本番の Price を指すと失敗する
- Price が「継続」で作られていないか（アプリは一括払いの Checkout しか作らない）

### 決済したのに特典が付かない

- `purchases` に行があるか。無ければサーバーログの `[recordPurchase]` を見る
  - `unknownCheckout` — アプリで保存した購入手続きがない。Dashboard で手作業した決済や旧実装の Session は自動付与しない
  - `invalidCheckout` — 保存した手続きと価格・数量・Session ID が一致しない
  - `unknownCustomer` — 顧客対応がない（退会済みなど）
- 行があるのに特典が無いなら `revoked_at` と `expires_at` を確認する


## 購入手続きの再試行と更新

- 購入は有効なパス・買い切りがないときだけ開始できます。パスから買い切りへの移行やパスの重ね買いは提供しません。
- 手続きは1時間有効です。同じ売り方のボタンから再開すると同じ Checkout に戻ります。別の売り方へ変える場合は期限切れを待ちます。
- `billing_checkouts` は Stripe API 呼び出し前に保存します。API の応答喪失・DB 保存失敗でも同じ ID を冪等キーとして回復します。障害時に予約行を手動削除しないでください。
- 価格や特典の変更は新しい手続きだけに適用されます。開始済みの手続きは当時の価格・特典・期間を維持します。購入履歴の特典を一括更新しないでください。
- 決済済み Session は期限を過ぎても未決済とみなさず、Stripe の現在値から購入記録を回復します。
- 万一、異なる Session で重複決済が成立した場合は、後から記録する決済を全額返金し、取消済みの履歴を残します。
- 新しい手続き表を導入する際は `pnpm db:run-migrate` を実行します。旧実装で開始済みの Session は販売条件を復元できないため、未決済のものを Stripe 側で失効させ、決済済みの未記録分を確認してから切り替えてください。既存の購入行は引き続き有効です。

### 並行処理の回帰テスト

`BILLING_TEST_DATABASE_URL=postgresql://...@127.0.0.1:54322/postgres pnpm exec vitest run src/lib/billing/billing.integration.test.ts`

ローカル DB だけを受け付け、実行ごとに専用スキーマを作成・破棄します。アプリの表は変更しません。Stripe はモックで、顧客ロック・予約の一意制約・購入と返金の並行処理は複数の実 PostgreSQL 接続で検証します。
