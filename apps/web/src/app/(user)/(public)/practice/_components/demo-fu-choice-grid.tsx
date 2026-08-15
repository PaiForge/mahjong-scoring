"use client";

import { useTranslations } from "next-intl";

import { DemoChoiceCell } from "./demo-choice-cell";

interface DemoFuChoiceGridProps {
  /** 表示する符の選択肢 */
  readonly options: readonly number[];
  /** 正解の符（緑で強調される） */
  readonly answer: number;
  /** グリッドの列数クラス（例: "grid-cols-2"） */
  readonly columnsClassName: string;
  /** `fuOption` キーを持つ翻訳名前空間（例: "machiFu"） */
  readonly translationNamespace: string;
}

/**
 * 遊び方デモの符選択肢グリッド
 * デモ符選択肢
 *
 * 符を選ぶ練習（待ち符・面子符）の「遊び方」で、正解をハイライトした
 * 選択肢の並びを描く。選択肢の配列そのものは盤面と共有する定数から渡す。
 */
export function DemoFuChoiceGrid({
  options,
  answer,
  columnsClassName,
  translationNamespace,
}: DemoFuChoiceGridProps) {
  const t = useTranslations(translationNamespace);

  return (
    <div className={`grid ${columnsClassName} gap-3`}>
      {options.map((fu) => {
        const isCorrect = fu === answer;
        return (
          <DemoChoiceCell
            key={fu}
            isCorrect={isCorrect}
            className={`text-2xl font-bold ${isCorrect ? "text-green-700" : "text-surface-400"}`}
          >
            {t("fuOption", { value: fu })}
          </DemoChoiceCell>
        );
      })}
    </div>
  );
}
