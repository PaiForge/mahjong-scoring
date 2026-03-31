# @mahjong-scoring/web

麻雀の点数計算を学習する Next.js Web アプリケーション。

## Development

```bash
# From the monorepo root
pnpm dev
```

Or run only the web app:

```bash
pnpm --filter @mahjong-scoring/web dev
```

## Deployment

### Vercel

This app is deployed to [Vercel](https://vercel.com/). Since the repository is a Turborepo monorepo, configure the Vercel project as follows:

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Root Directory | `apps/web` |

### Environment Variables

| Variable Name | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 Measurement ID (e.g. `G-XXXXXXXXXX`). GA script will only be loaded if this variable is set. | No (Production Only) |
