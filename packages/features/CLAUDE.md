# packages/features — web とモバイルで共有するアプリのロジック

レジストリ・パス・セッションのフック・設定ストア・行程の計算を置く。`exports` は `./*` の
ファイル単位で、消費側は `@mahjong-scoring/features/<path>` で必要なファイルだけを import する
（バレルは作らない）。コーディング規約（TSDoc・命名・Result 型）は
https://raw.githubusercontent.com/PaiForge/docs/0b464878e4e24b6b8c154d90f96e1657e212ddaa/coding-standards.md
（新しいモジュールや TSDoc を書くときに読む）。

- **React・zustand・use-intl に触れてよいのは `use-*.ts` だけ。** それ以外の純粋なモジュールは
  サーバーコンポーネントからも Node のテストからも読める状態に保つ。純粋なモジュールから
  `use-*.ts` を import することも禁止。どちらも ESLint（ルートの `eslint.config.mjs`）が弾く。
  このため `use-rule-settings-store.ts` のようにフックではなくファクトリ（`createRuleSettingsStore`）
  を export するファイルも `use-` で始まる
- 辞書を引くフックは next-intl ではなく use-intl の `useTranslations` を使う。next-intl の
  クライアント用 `useTranslations` は use-intl のものを包んだだけで、`NextIntlClientProvider` も
  use-intl の Provider なので、web とモバイルの両方で同じに動く（`yaku/use-yaku-options.ts`）。
  use-intl は web・モバイル・features で同じ版にそろえる（版が分かれると Provider のコンテキストが別物になる）
- 設定ストアはファクトリ（`createRuleSettingsStore` 等）で、保存先とハイドレーションガードを
  アプリが渡す。web の実体は `apps/web/src/app/_hooks/use-*-store.ts`（localStorage・`useHydrated`）、
  モバイルは `apps/mobile/src/hooks/use-*-store.ts`（AsyncStorage）。設定の形と既定値
  （`RuleSettings` / `DEFAULT_RULE_SETTINGS`）は `packages/core/src/rules/settings.ts` にある
- web 固有のもの（DOM・Next・next-intl・Tailwind）は置かない。パスは両プラットフォームにある
  遷移先だけ `routes.ts` に置き、一覧の絞り込みやアンカーは web に残す
- アプリ（Static Hermes）でも動くため、`toSorted` / `Object.groupBy` 等の Hermes に無い組み込みは
  ESLint が弾く（理由と一覧は `eslint.config.mjs`）
- アプリ向け API（`/api/mobile/v1/*`）の応答の形は `*/mobile-api.ts` の契約で決める。項目を足すときは
  省略可能にする — ストアに出ている版のアプリが古い形のまま読む
- 練習の種類・バリアント・辞書キーの対応はレジストリ（`practice-menu-types.ts`）が正。練習を
  足すときの手順（型やテストが要求する場所と、黙って既定値に落ちる場所）は同ファイルの TSDoc
- 段級位の行程（「次にやること」）は `journey/journey.ts` の `buildJourney()` に一本化する。
  読む順・方針・模試の扱いは同ファイルの頭の TSDoc
