import { useState } from "react";
import { useTranslations } from "use-intl";

import { HeaderIconButton } from "./header-action";
import { HelpTourSheet, type HelpTourStep } from "./help-tour-sheet";

/**
 * 辞書のキーの列を、`<key>.title` / `<key>.description` を引いた手順に変える
 * 操作ヘルプ手順
 *
 * @param t - 手順を持つ名前空間の `t`
 * @param keys - 説明する順のキー
 * @param descriptionValues - 説明の文言に渡す ICU の引数（キーごと。設定で
 *   言い分ける説明だけが持つ）
 */
export function operationHelpSteps(
  t: (key: string, values?: Readonly<Record<string, string>>) => string,
  keys: readonly string[],
  descriptionValues: Readonly<
    Partial<Record<string, Readonly<Record<string, string>>>>
  > = {},
): readonly HelpTourStep[] {
  return keys.map((key) => ({
    key,
    title: t(`${key}.title`),
    description: t(`${key}.description`, descriptionValues[key]),
  }));
}

/**
 * 画面の操作を 1 枚ずつ説明する「?」（web の `SpotlightTour` に当たる）
 * 操作ヘルプ
 *
 * web で画面の要素を照らすツアー（道場の見出し・練習の play 画面）を、
 * 見本の無いシートで出す。`namespace` は web のツアーと同じ辞書で、
 * `label`（「?」の読み上げ）・`prev` / `next` / `done`・`progress` を持つこと。
 * 練習の進め方を見本付きで見せる設定画面の「?」は、文言の置き場が違うので
 * これを使わない。
 *
 * `Screen` の `titleAction` に渡す。「?」はヘッダー右のボタン
 * （`HeaderIconButton`）になり、シートは本文の木に残る。
 */
export function OperationHelp({
  namespace,
  steps,
}: {
  readonly namespace: string;
  readonly steps: readonly HelpTourStep[];
}) {
  const t = useTranslations(namespace);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <HeaderIconButton
        icon="help"
        onPress={() => setIsOpen(true)}
        label={t("label")}
        testID="header-help"
      />
      <HelpTourSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        steps={steps}
        labels={{
          prev: t("prev"),
          next: t("next"),
          close: t("done"),
          progress: (current, total) => t("progress", { current, total }),
        }}
      />
    </>
  );
}
