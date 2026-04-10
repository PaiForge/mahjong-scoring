# Resend SMTP セットアップ (Supabase Auth)

本ガイドでは、本番環境の Supabase Auth で [Resend](https://resend.com/) をカスタム SMTP プロバイダーとして設定する手順を説明します。設定後、認証関連のすべてのメール（サインアップ確認、パスワードリセット、メールアドレス変更）が Supabase 組み込みのメールサービスではなく Resend 経由で送信されます。

> **Note:** このガイドは **本番環境**（Supabase Dashboard）の設定のみを対象としています。ローカル開発では Supabase が [Inbucket](http://127.0.0.1:54324) を使用してメールをキャプチャするため、SMTP の設定は不要です。

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

本番環境で同じブランドテンプレートを使用するには:

1. Supabase Dashboard で **Authentication** > **Email** > **Templates** タブに移動
2. 各テンプレートタイプについて、対応するローカルファイルから HTML コンテンツをコピー:

   | テンプレートタイプ         | ローカルファイル                       | Subject                                    |
   | -------------------------- | -------------------------------------- | ------------------------------------------ |
   | **Confirm signup**         | `supabase/templates/confirmation.html` | `麻雀点数道場 - メールアドレスの確認`      |
   | **Reset password**         | `supabase/templates/recovery.html`     | `麻雀点数道場 - パスワードのリセット`      |
   | **Change email address**   | `supabase/templates/email_change.html` | `麻雀点数道場 - メールアドレス変更の確認`  |

3. 各テンプレートについて:
   - **Subject** を上記の値に設定
   - **Body** をローカルファイルの HTML コンテンツで置換
   - テンプレート変数（`{{ .ConfirmationURL }}`、`{{ .NewEmail }}` など）がそのまま保持されていることを確認
4. 各テンプレートで **Save** をクリック

> **Important:** 今後ローカルのテンプレートファイルを更新した場合、Supabase Dashboard にも手動で変更を反映する必要があります。自動同期はありません。

## 4. Testing

セットアップ完了後、以下を確認してください:

1. **サインアップ確認のテスト**: 本番サイトでメール/パスワードを使って新規アカウントを作成し、正しいブランディングと件名で確認メールが届くことを確認。

2. **パスワードリセットのテスト**: 「パスワードを忘れた場合」フローを使用し、リセットメールが届いて `{{ .ConfirmationURL }}` リンクが正しく動作することを確認。

3. **メールアドレス変更のテスト**: プロフィール設定でメールアドレスを変更し、新しいアドレスに確認メールが送信されることを確認。

4. **メール到達率の確認**:
   - メールが迷惑メールフォルダに入っていないことを確認
   - Resend ダッシュボード（[resend.com/emails](https://resend.com/emails)）で配信状況やバウンス/苦情レポートを確認
   - [mail-tester.com](https://www.mail-tester.com/) でメールスコア（SPF、DKIM、DMARC の整合性）を確認

5. **レートリミットの監視**: Supabase の `config.toml` では `[auth.rate_limit]` の `email_sent` でローカル開発用のレートリミットが設定されています。本番環境では、Supabase Dashboard の **Authentication** > **Rate Limits** でレートリミットを設定します。想定されるトラフィックに応じて適切な値を設定してください。

### トラブルシューティング

| 問題                                | 考えられる原因                                      | 解決策                                                      |
| ----------------------------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| メールが届かない                    | Resend で送信元ドメインが認証されていない            | resend.com/domains でドメイン認証状況を確認                 |
| メールが迷惑メールに振り分けられる  | DNS レコード（SPF/DKIM/DMARC）が不正または未設定    | Resend ダッシュボードで DNS レコードを再確認                |
| "Invalid sender" エラー             | 送信元メールのドメインが認証済みドメインと不一致     | 送信元メールを認証済みドメインに変更                        |
| テンプレート変数が展開されない      | テンプレート変数が変更または欠落している              | `{{ .ConfirmationURL }}` などが正確にコピーされているか確認 |
