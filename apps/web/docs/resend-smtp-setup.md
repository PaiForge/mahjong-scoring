# Resend SMTP セットアップ (Supabase Auth)

本ガイドでは、本番環境の Supabase Auth で [Resend](https://resend.com/) をカスタム SMTP プロバイダーとして設定する手順を説明します。設定後、認証関連のすべてのメール（サインアップ確認、パスワードリセット、メールアドレス変更）が Supabase 組み込みのメールサービスではなく Resend 経由で送信されます。

> **Note:** このガイドは **本番環境**（Supabase Dashboard）の設定のみを対象としています。ローカル開発では Supabase が [Mailpit](http://127.0.0.1:54324) を使用してメールをキャプチャするため、SMTP の設定は不要です。

## Prerequisites

- [Resend](https://resend.com/) アカウント
- Resend で認証済みのドメイン（独自ドメインからメールを送信するために必要）
- ドメインの DNS 設定へのアクセス権（SPF、DKIM、DMARC レコードの設定用）
- プロジェクトの [Supabase Dashboard](https://supabase.com/dashboard) へのアクセス権

## 1. Verify Domain

> **ドメイン認証は必須です。** Supabase Auth が Resend 経由でメールを送信できるようにするには、[resend.com/domains](https://resend.com/domains) でドメインを認証する必要があります。ドメインが認証されていない場合、すべての認証メール（サインアップ確認、パスワードリセット、メールアドレス変更）が **500 エラー** で失敗します。このステップを省略しないでください。

Resend のダッシュボードで必要な DNS レコード（SPF、DKIM、DMARC）の追加手順が案内されます。DNS プロバイダー（Cloudflare、Route 53、Vercel Domains など）で指示に従ってレコードを追加し、Resend で **Verify** をクリックしてください。DNS の伝播には数分から最大 48 時間かかる場合があります。

## 2. Configure SMTP

公式の [Resend integration for Supabase](https://supabase.com/partners/integrations/resend) を使用して、2 つのサービスを接続します。これにより、Supabase プロジェクトの SMTP 設定が自動的に構成されます。

1. [resend.com/settings/integrations](https://resend.com/settings/integrations) にアクセス
2. **Supabase** integration を見つけて **Install** をクリック
3. 画面の指示に従って Supabase プロジェクトを接続

> **Note:** Supabase Dashboard に表示される SMTP Password は、実際には Resend API キー（`re_` プレフィックス付きの文字列）です。保存後、ページを再読み込みするとパスワード欄が空白になりますが、これは Supabase Dashboard のセキュリティ機能であり、バグではありません。値は保存されています。

> **Tip:** メール到達率を最大化する方法については、Resend のブログ記事を参照してください: [How to configure Supabase to send emails from your domain](https://resend.com/blog/how-to-configure-supabase-to-send-emails-from-your-domain)

## 3. Email Templates

ローカルの `config.toml`（`[auth.email.template.*]` セクション）および `supabase/templates/` 内の HTML ファイルは **ローカル開発専用** です。本番の Supabase プロジェクトには自動的に同期 **されません**。

3 通とも 1 通の中に日本語と英語を併記します。件名は「サイト名 - 日本語の見出し / 英語の見出し」、本文は日本語の段の後に英語の段で、ボタンも 2 つ（日本語のボタンは日本語のページへ、英語のボタンは英語のページ `/en/...` へ着く）です。Supabase は言語別のテンプレートを持たないので、言語ごとに送り分けません（iOS のアプリの登録・再設定も同じ 3 通を受けます）。

本番環境で同じブランドテンプレートを使用するには、**本番の Supabase Dashboard（Authentication > Emails > Templates）で 3 通の Subject と HTML を貼り替えます**（自動同期はありません。テンプレートや件名を変えたリリースのたびに行います）:

1. Supabase Dashboard で **Authentication** > **Emails** > **Templates** タブに移動
2. 各テンプレートタイプについて、対応するローカルファイルから HTML コンテンツをコピー:

   | テンプレートタイプ       | ローカルファイル                       | Subject                                                                           |
   | ------------------------ | -------------------------------------- | --------------------------------------------------------------------------------- |
   | **Confirm signup**       | `supabase/templates/confirmation.html` | `麻雀点数計算教室 - メールアドレスの確認 / Confirm your email address`            |
   | **Reset password**       | `supabase/templates/recovery.html`     | `麻雀点数計算教室 - パスワードのリセット / Reset your password`                   |
   | **Change email address** | `supabase/templates/email_change.html` | `麻雀点数計算教室 - メールアドレス変更の確認 / Confirm your email address change` |

3. 各テンプレートについて:
   - **Subject** を上記の値に設定（`config.toml` の `subject` と同じ文字列。確認メールの件名はメール確認待ちのページにも表示しているので、1 文字でも違うと利用者が受信箱で探せません）
   - **Body** をローカルファイルの HTML コンテンツで置換
   - テンプレート変数（`{{ .SiteURL }}`、`{{ .TokenHash }}`、`{{ .NewEmail }}` など）がそのまま保持されていることを確認
   - ボタンのリンクが 2 本あり、2 本目（英語）の末尾が `&amp;locale=en` であることを確認
4. 各テンプレートで **Save** をクリック
5. 貼り替えた後、本番で登録の確認メールを 1 通送り、件名が併記になっていること・英語のボタンで `/en/mypage/setup-username`（ユーザー名が設定済みなら `/en/mypage`）に着くことを確かめる

3 通ともリンクは `{{ .ConfirmationURL }}` ではなく `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=...` の形です。`ConfirmationURL` は PKCE の `?code=` で戻るため、登録や変更を始めた端末と別の端末（スマホのメールアプリ等）で開くと完了できません。`token_hash` は `/auth/callback` が検証するので端末を選びません。英語のボタンは同じリンクに `&locale=en` を足したもので、`/auth/callback` がこれを見て着地（ユーザー名の設定・パスワードの再設定・アカウントのページ等）を英語のページにします。`locale` の無いリンク（日本語のボタン・貼り替え前の旧いテンプレート）は日本語のページに着きます。

> **Important:** HTML は `scripts/email-templates/contents.ts` から `pnpm --filter web email:generate` で生成します（HTML を直接編集しない。テストが生成物との一致を検査します）。文言や件名を変えたら、生成し直して `config.toml` の `subject`（確認メールは辞書の `verifyEmail.mailSubject` も）を揃え、本番の Supabase Dashboard にも Subject と HTML を手動で貼り直してください。自動同期はありません。英語の文言は辞書ではなく `contents.ts` に直接持っています。

## 4. Testing

セットアップ完了後、以下を確認してください:

1. **サインアップ確認のテスト**: 本番サイトでメール/パスワードを使って新規アカウントを作成し、正しいブランディングと件名で確認メールが届くことを確認。

2. **パスワードリセットのテスト**: 「パスワードを忘れた方」フローを使用し、リセットメールが届いてリンク（`/auth/callback?type=recovery`）から `/reset-password` に着くことを確認。ログイン中のアカウントページ（`/mypage/account`）の「パスワードを変更」も同じメールを送る。

3. **メールアドレス変更のテスト**: アカウントページ（`/mypage/account`）でメールアドレスを変更し、変更前・変更後の**両方**のアドレスに確認メールが届くこと、両方のリンクを開くとアドレスが変わること（1 通目では「もう 1 通」の報せが出る）を確認。

4. **メール到達率の確認**:
   - メールが迷惑メールフォルダに入っていないことを確認
   - Resend ダッシュボード（[resend.com/emails](https://resend.com/emails)）で配信状況やバウンス/苦情レポートを確認
   - [mail-tester.com](https://www.mail-tester.com/) でメールスコア（SPF、DKIM、DMARC の整合性）を確認

5. **レートリミットの監視**: Supabase の `config.toml` では `[auth.rate_limit]` の `email_sent` でローカル開発用のレートリミットが設定されています。本番環境では、Supabase Dashboard の **Authentication** > **Rate Limits** でレートリミットを設定します。想定されるトラフィックに応じて適切な値を設定してください。

### トラブルシューティング

| 問題                               | 考えられる原因                                   | 解決策                                                      |
| ---------------------------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| メールが届かない                   | Resend で送信元ドメインが認証されていない        | resend.com/domains でドメイン認証状況を確認                 |
| メールが迷惑メールに振り分けられる | DNS レコード（SPF/DKIM/DMARC）が不正または未設定 | Resend ダッシュボードで DNS レコードを再確認                |
| "Invalid sender" エラー            | 送信元メールのドメインが認証済みドメインと不一致 | 送信元メールを認証済みドメインに変更                        |
| テンプレート変数が展開されない     | テンプレート変数が変更または欠落している         | `{{ .ConfirmationURL }}` などが正確にコピーされているか確認 |
