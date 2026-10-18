interface TableHeadProps {
  /** 列の見出し（i18n 済み）。左から順に並べる */
  readonly labels: readonly string[];
}

/**
 * 管理画面の一覧テーブルの見出し行
 * テーブル見出し
 *
 * 見出しは折り返さない。main が min-w-0 で縮むようになってから、表は
 * 横スクロールしつつ見出しセルも min-content まで縮むため、放っておくと
 * 「アクション」が「アクシ／ョン」のように語の途中で割れる（390px で実測）。
 */
export function TableHead({ labels }: TableHeadProps) {
  return (
    <thead>
      <tr className="border-b border-surface-200">
        {labels.map((label) => (
          <th key={label} className="px-4 py-3 font-medium whitespace-nowrap">
            {label}
          </th>
        ))}
      </tr>
    </thead>
  );
}
