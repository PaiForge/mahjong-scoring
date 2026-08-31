import { getTranslations } from "next-intl/server";

type GuideTranslator = Awaited<ReturnType<typeof getTranslations<string>>>;

/** {@link ExampleTable} に渡す列見出しと符の書式（章のあいだで使い回す） */
interface ExampleTableColumns {
  readonly colTiles: string;
  readonly colKind: string;
  readonly colFu: string;
  readonly formatFu: (value: number) => string;
}

interface LoadExampleTableColumnsOptions {
  /**
   * 牌の列の見出しを章の翻訳で差し替えるときのキー。
   * 待ちの章のように、並べるのが単なる「牌」ではない章が使う。
   */
  readonly colTilesKey?: string;
}

/**
 * 符の章の翻訳と、例示表の列定義をまとめて用意する
 * 例示表列定義
 *
 * 符の章（雀頭・面子・待ち）は同じ 3 列の例示表を繰り返し出すので、列見出しは
 * `learnCurriculum.exampleTable` に置いて章をまたいで共有している。章ごとの
 * 翻訳と共有の列見出しを両方引く必要があり、その組み立てが章の本文の頭に
 * 毎回並んでいたのでここへ寄せた。
 *
 * 符の書式（`fuUnit`）だけは章の名前空間から引く。単位の語は章の文脈で
 * 変わりうるため、共有の列見出しとは別に持たせている。
 *
 * @param namespace - 章の翻訳名前空間（例: `"jantouFu.learn"`）
 * @returns 章の翻訳関数と、`ExampleTable` にそのまま展開できる列定義
 */
export async function loadExampleTableColumns(
  namespace: string,
  options: LoadExampleTableColumnsOptions = {},
): Promise<{
  readonly t: GuideTranslator;
  readonly tableColumns: ExampleTableColumns;
}> {
  const [t, tTable] = await Promise.all([
    getTranslations(namespace),
    getTranslations("learnCurriculum.exampleTable"),
  ]);

  return {
    t,
    tableColumns: {
      colTiles:
        options.colTilesKey === undefined
          ? tTable("colTiles")
          : t(options.colTilesKey),
      colKind: tTable("colKind"),
      colFu: tTable("colFu"),
      formatFu: (value: number) => t("fuUnit", { value }),
    },
  };
}
