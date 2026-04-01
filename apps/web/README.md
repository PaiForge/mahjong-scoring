# @mahjong-scoring/web

麻雀の点数計算を学習する Next.js Web アプリケーション。

## Quick Start

### Prerequisites

- Node.js 24.x
- pnpm 10.x
- Docker (required by Supabase CLI)
- [Supabase CLI](https://supabase.com/docs/guides/local-development)

### Setup

```bash
# Install dependencies (from monorepo root)
pnpm install

# Start Supabase local (first run downloads Docker images)
supabase start
```

After `supabase start` completes, retrieve the API keys by running `supabase status -o json`. Copy these values into `.env.local`:

```bash
supabase status -o json
cp .env.example .env.local
```

| `supabase status -o json` field | `.env.local` variable           | Notes                                         |
| ------------------------------- | ------------------------------- | --------------------------------------------- |
| `PUBLISHABLE_KEY`               | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key used by the browser client         |
| `API_URL`                       | `NEXT_PUBLIC_SUPABASE_URL`      | Already defaulted to `http://127.0.0.1:54321` |

> **Tip:** These values are also visible in the `supabase start` output under "Authentication Keys" (Publishable) and "APIs" (Project URL).

```bash
# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Local Development

### Google OAuth Setup (for Google Sign-In)

To test Google Sign-In locally, you need to configure OAuth credentials:

1. **Create OAuth credentials** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Go to **APIs & Services** > **Credentials** > **Create Credentials** > **OAuth client ID**
   - Select **Web application** as the application type

2. **Register redirect URIs** in Google Cloud Console:

   | Field                         | Value                                     |
   | ----------------------------- | ----------------------------------------- |
   | Authorized JavaScript origins | `http://localhost:3000`                   |
   | Authorized redirect URIs      | `http://127.0.0.1:54321/auth/v1/callback` |

   > **Note:** The redirect URI points to the local Supabase Auth endpoint, not your Next.js app. For production, the redirect URI is `https://<reference-id>.supabase.co/auth/v1/callback`.

3. **Configure Supabase environment**:

   ```bash
   cp supabase/.env.example supabase/.env
   ```

   Edit `supabase/.env` and fill in the values from the Google Cloud Console:
   - `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` — your OAuth Client ID
   - `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` — your OAuth Client Secret

4. **Restart Supabase** to pick up the new environment variables:
   ```bash
   supabase stop && supabase start
   ```

### Admin Panel Setup

管理画面（`/admin`）を利用するには、以下のセットアップが必要です。

#### 1. 環境変数の追加

`SUPABASE_SERVICE_ROLE_KEY` を `.env.local` に追加します。

```bash
supabase status -o json
```

| `supabase status -o json` field | `.env.local` variable           | Notes                                         |
| ------------------------------- | ------------------------------- | --------------------------------------------- |
| `SERVICE_ROLE_KEY`              | `SUPABASE_SERVICE_ROLE_KEY`     | Admin API 用シークレットキー                    |

> **WARNING**: `NEXT_PUBLIC_` プレフィックスを付けないでください。このキーは RLS をバイパスしてユーザー管理が可能なフルアクセスキーであり、ブラウザに露出させてはいけません。Admin Client は `import 'server-only'` ガードで保護されています。

#### 2. マイグレーションの実行

```bash
pnpm db:run-migrate
```

これにより `user_roles` テーブルが作成されます。

#### 3. 管理者ロールの付与

Supabase Studio（http://127.0.0.1:54323）の SQL Editor、または psql で以下を実行します:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('<your-user-uuid>', 'admin');
```

`<your-user-uuid>` は `auth.users` テーブルで確認できます。

#### 4. 確認

サインアウト → 再サインインし、`/admin` にアクセスして管理画面が表示されることを確認します。

### Local Services

- **Supabase Studio**: http://127.0.0.1:54323
- **Inbucket (email testing)**: http://127.0.0.1:54324
- **PostgreSQL**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

To stop Supabase:

```bash
supabase stop
```

## Deployment

### Vercel

This app is deployed to [Vercel](https://vercel.com/). Since the repository is a Turborepo monorepo, configure the Vercel project as follows:

| Setting          | Value     |
| ---------------- | --------- |
| Framework Preset | Next.js   |
| Root Directory   | `apps/web` |

### Environment Variables

| Variable Name                   | Description                                                                                          | Required               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL (e.g. `https://<reference-id>.supabase.co`)                                    | Yes                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public (anon) key                                                                           | Yes                    |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key (admin API access). See [Admin Panel Setup](#admin-panel-setup).             | Yes                    |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 Measurement ID (e.g. `G-XXXXXXXXXX`). GA script will only be loaded if this is set. | No (Production Only)   |

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS v4
- React 19
- Supabase (Auth, PostgreSQL)
- next-intl (i18n)
- Vitest (Unit Testing)
