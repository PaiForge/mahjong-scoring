# Mahjong Scoring (Monorepo)

麻雀の点数計算を学習するアプリ。

This repository is a Monorepo managed by [Turborepo](https://turbo.build/).

## Directory Structure

- `apps/web`: Next.js web application
- `apps/mobile`: React Native (Expo) mobile application (planned)
- `docs/`: [PaiForge/docs](https://github.com/PaiForge/docs) (git submodule — コーディング規約等)

### Shared Packages

| Package                  | Description                    |
| ------------------------ | ------------------------------ |
| `packages/eslint-config` | Shared ESLint configuration    |
| `packages/types`         | Shared TypeScript type definitions |
| `packages/ui`            | Shared UI components / theme   |

## Quick Start

### Prerequisites

- Node.js 24.x
- pnpm 10.x

> [!TIP]
> This project uses [Volta](https://volta.sh/) to pin the Node.js version.
> If you have Volta installed, it will automatically switch to the correct Node.js version defined in `package.json`.
>
> ```bash
> volta pin node@24
> volta install pnpm@10
> ```

### Clone

```bash
git clone --recurse-submodules https://github.com/PaiForge/mahjong-scoring.git
cd mahjong-scoring
```

既にクローン済みで submodule が未取得の場合:

```bash
git submodule update --init --recursive
```

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Scripts

From the root directory:

- `pnpm dev`: Start all apps in development mode
- `pnpm build`: Build all apps for production
- `pnpm lint`: Lint all apps
- `pnpm typecheck`: Run type checking
- `pnpm test`: Run tests across the workspace
- `pnpm format`: Format code with Prettier

## Coding Standards

コーディング規約は `docs/` submodule で一元管理されています。

- [docs/coding-standards.md](docs/coding-standards.md)
- [docs/extended-mspz.md](docs/extended-mspz.md)

submodule を最新に更新するには:

```bash
git submodule update --remote docs
```

## Versioning Strategy

This project follows [Semantic Versioning](https://semver.org/).

### Git Tag Format

Git tags use a prefix to identify the application:

- **Web app**: `web/v0.1.0`, `web/v0.2.0`, ...
- **Mobile app**: `mobile/v0.1.0`, `mobile/v0.2.0`, ... (planned)
