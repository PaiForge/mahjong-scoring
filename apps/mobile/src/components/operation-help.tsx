import { useState } from "react";
import { useTranslations } from "use-intl";

import { HelpIconButton } from "./help-icon-button";
import { HelpTourSheet, type HelpTourStep } from "./help-tour-sheet";

/** 見出しの横の「?」の大きさ（見出しの文字に合わせる） */
const HEADER_HELP_FONT_SIZE = 17;

/**
 * 辞書のキーの列を、`<key>.title` / `<key>.description` を引いた手順に変える
 * 操作ヘルプ手順
 *
 * @param t - 手順を持つ名前空間の `t`
 * @param keys - 説明する順のキー
 */
export function operationHelpSteps(
  t: (key: string) => string,
  keys: readonly string[],
): readonly HelpTourStep[] {
  return keys.map((key) => ({
    key,
    title: t(`${key}.title`),
    description: t(`${key}.description`),
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
      <HelpIconButton
        onPress={() => setIsOpen(true)}
        label={t("label")}
        fontSize={HEADER_HELP_FONT_SIZE}
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
