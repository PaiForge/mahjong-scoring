import type { ComponentType } from "react";
import type { PracticeResultViewProps } from "./create-practice-result-page";
import { ResultView } from "../_components/result-view";

/**
 * カスタム結果ビューのファクトリー設定
 * カスタム結果ビュー設定
 */
interface CreateCustomResultViewConfig {
  /**
   * sessionStorage から結果を読み取って描画する Client Component。
   * 関数 props を使わず `storageKey` 文字列のみを受け取る設計にし、
   * Server → Client 境界のシリアライズ制約を満たす。
   */
  readonly ProblemListLoader: ComponentType<{ readonly storageKey: string }>;
  /** sessionStorage のキー */
  readonly storageKey: string;
}

/**
 * 練習固有の結果ビューコンポーネントを生成するファクトリー関数
 * カスタム結果ビュー生成
 *
 * Server Component として `ResultView` をラップし、各練習専用の
 * `ProblemListLoader`（Client Component）を `children` スロットに注入する。
 *
 * 以前は generic な `ProblemListLoader<T>` に `parse` 関数と `ProblemList`
 * コンポーネントを props として渡していたが、RSC の Server → Client
 * 境界では「関数を props として渡せない」制約があり、`Functions cannot
 * be passed directly to Client Components` ランタイムエラーが発生した。
 * このため各練習側で専用 Loader を用意し、Server からは `storageKey`
 * 文字列のみを渡す「Loader Component Pattern」に変更した。
 */
export function createCustomResultView(
  config: CreateCustomResultViewConfig,
): ComponentType<PracticeResultViewProps> {
  const { ProblemListLoader, storageKey } = config;

  async function CustomResultView(props: PracticeResultViewProps) {
    // `resultBlock` / `leaderboardBlock` は factory からそのまま透過。
    // `children` スロットには sessionStorage 読み取り付きの専用 Loader を差し込む。
    // 渡す props は `storageKey`（string）のみで、関数は一切渡さない。
    return (
      <ResultView {...props}>
        <ProblemListLoader storageKey={storageKey} />
      </ResultView>
    );
  }

  CustomResultView.displayName = `CustomResultView(${ProblemListLoader.displayName ?? ProblemListLoader.name ?? "Unknown"})`;

  return CustomResultView;
}
