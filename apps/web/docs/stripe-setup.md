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

プラン 1 つ（Pro）に対して、売り方ごとに Price を 1 つ作ります。アプリ側の定義は `src/lib/billing/plans.ts` にあり、
Price ID は環境変数で結び付けます（`src/lib/billing/env.ts`）。

### テスト環境

1. [Stripe Dashboard](https://dashboard.stripe.com/test/products) > 商品カタログ > **+ 商品を追加**
2. 商品:
   - **名前**: `Pro`
   - **説明**: 任意（Checkout の画面に出ます）
3. 価格を 2 つ作る（商品の詳細画面で「別の価格を追加」）:

   | 用途      | 料金体系 | 請求 | 通貨 | 金額           | 環境変数                       |
   | --------- | -------- | ---- | ---- | -------------- | ------------------------------ |
   | 30 日パス | 標準     | 一括 | JPY  | 価格表のとおり | `STRIPE_PRICE_ID_PRO_PASS`     |
   | 買い切り  | 標準     | 一括 | JPY  | 価格表のとおり | `STRIPE_PRICE_ID_PRO_LIFETIME` |

   > **Note:** どちらも「**一括**」（one-time）で作ること。「継続」（recurring）にするとサブスクリプションになり、アプリは記録しません。

4. それぞれの Price ID（`price_...`）を対応する環境変数へ

### 本番環境

ライブモードで同じ手順を行います。Price ID はテスト環境と別の値になるので、Vercel の環境変数に本番の値を設定してください。

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
Price ID が環境変数のどれとも一致しない Session は購入として記録されません。

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
- [ ] 期間パスをもう 1 枚買うと、新しい行の `starts_at` が前のパスの期限になる
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
  - `unknown price` — Price ID が環境変数と一致していない
  - `no stripe_customers row` — Checkout を経ずに Dashboard で作った決済。アプリは記録しない
- 行があるのに特典が無いなら `revoked_at` と `expires_at` を確認する
