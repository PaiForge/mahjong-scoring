"use client";

import { useTranslations } from "next-intl";

import { DemoChoiceCell } from "./demo-choice-cell";
import { FU_CHOICE_LABEL_CLASSES } from "../_lib/fu-choice-classes";

interface DemoFuChoiceGridProps {
  /** 表示する符の選択肢 */
  readonly options: readonly number[];
  /** グリッドの列数クラス（例: "grid-cols-2"） */
  readonly columnsClassName: string;
  /** `fuOption` キーを持つ翻訳名前空間（例: "machiFu"） */
  readonly translationNamespace: string;
}

/**
 * 遊び方デモの符選択肢グリッド
 * デモ符選択肢
 *
 * 符を選ぶ練習（待ち符・面子符・合計符）の「問題方式」で、出題時（未回答）の
 * 選択肢の並びを描く。選択肢の配列そのものは盤面と共有する定数から渡す。
 */
export function DemoFuChoiceGrid({
  options,
  columnsClassName,
  translationNamespace,
}: DemoFuChoiceGridProps) {
  const t = useTranslations(translationNamespace);

  return (
    <div className={`grid ${columnsClassName} gap-3`}>
      {options.map((fu) => (
        <DemoChoiceCell
          key={fu}
          className={`font-bold ${FU_CHOICE_LABEL_CLASSES}`}
        >
          {t("fuOption", { value: fu })}
        </DemoChoiceCell>
      ))}
    </div>
  );
}
