/** 辞書を引く関数（web の next-intl・アプリの use-intl の `t` をそのまま渡せる形） */
type Translate = (
  key: string,
  values?: Readonly<Record<string, number>>,
) => string;

/**
 * 練習の設定画面の「?」が開くツアーの操作ラベル
 * ヘルプツアーラベル
 *
 * web の `HelpTourModal` は `prev` / `next` / `close` を、アプリの `HelpTourSheet`
 * はそれに `progress` を加えて使う。
 */
export interface PracticeHelpTourLabels {
  readonly prev: string;
  readonly next: string;
  readonly close: string;
  /** 「2 / 5」のような進み具合（アプリだけが出す） */
  readonly progress: (current: number, total: number) => string;
}

/**
 * 練習の辞書からツアーの操作ラベルを組む
 * ヘルプツアーラベル生成
 *
 * 和了形・聴牌形の点数計算の設定画面の「?」は、web もアプリも同じ辞書
 * （`<練習>.help.prev` / `.help.next` / `.tour.progress` と `common.close`）から
 * 同じラベルを組む。
 *
 * @param t - 練習の名前空間（`agariScore` / `tenpaiScore`）の `t`
 * @param tCommon - `common` の `t`
 */
export function practiceHelpTourLabels(
  t: Translate,
  tCommon: (key: string) => string,
): PracticeHelpTourLabels {
  return {
    prev: t("help.prev"),
    next: t("help.next"),
    close: tCommon("close"),
    progress: (current, total) => t("tour.progress", { current, total }),
  };
}
