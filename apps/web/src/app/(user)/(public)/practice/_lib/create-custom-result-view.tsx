import type { ComponentType } from "react";
import type { PracticeResultViewProps } from "./create-practice-result-page";
import { ResultView } from "../_components/result-view";
import { ProblemListLoader } from "../_components/problem-list-loader";

/**
 * カスタム結果ビューのファクトリー設定
 * カスタム結果ビュー設定
 */
interface CreateCustomResultViewConfig<T> {
  /** sessionStorage のキー */
  readonly storageKey: string;
  /** 生文字列を型付き配列にパースする関数 */
  readonly parse: (raw: string | undefined) => readonly T[];
  /** 問題結果一覧を描画するコンポーネント（Client Component） */
  readonly ProblemList: ComponentType<{ readonly results: readonly T[] }>;
}

/**
 * 練習固有の結果ビューコンポーネントを生成するファクトリー関数
 * カスタム結果ビュー生成
 *
 * Server Component として `ResultView` をラップし、sessionStorage から
 * 結果を読み取る小さな Client ラッパ（`ProblemListLoader`）を
 * `children` スロットに注入する。
 *
 * Server Component 化の理由: `factory` が `ResultView` を呼び出す際に
 * `resultBlock` / `leaderboardBlock` として `<Suspense>` 境界を props で
 * 渡すため、`CustomResultView` 自身が Client Component だと RSC の
 * シリアライズ規則上 Suspense 境界が正しく機能しない。`ResultView` を
 * Server Component 化したのと同じ理由でカスタム版もここで Server 化する。
 */
export function createCustomResultView<T>(
  config: CreateCustomResultViewConfig<T>,
): ComponentType<PracticeResultViewProps> {
  const { storageKey, parse, ProblemList } = config;

  async function CustomResultView(props: PracticeResultViewProps) {
    // `resultBlock` / `leaderboardBlock` は factory からそのまま透過。
    // `children` スロットには sessionStorage 読み取り付きの ProblemListLoader を差し込む。
    return (
      <ResultView {...props}>
        <ProblemListLoader
          storageKey={storageKey}
          parse={parse}
          ProblemList={ProblemList}
        />
      </ResultView>
    );
  }

  CustomResultView.displayName = `CustomResultView(${ProblemList.displayName ?? ProblemList.name ?? "Unknown"})`;

  return CustomResultView;
}
