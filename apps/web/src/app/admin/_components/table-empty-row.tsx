interface TableEmptyRowProps {
  /** テーブルの列数（そのまま colSpan になる） */
  readonly columnCount: number;
  /** 表示する文言（i18n 済み） */
  readonly label: string;
}

/**
 * テーブルの「該当なし」行
 * テーブル空行
 *
 * 列数を props で受けて colSpan に反映する。列の増減時に colSpan の
 * 直書きが取り残されるのを防ぐため、管理画面のテーブルはここを使う。
 */
export function TableEmptyRow({ columnCount, label }: TableEmptyRowProps) {
  return (
    <tr>
      <td colSpan={columnCount} className="px-4 py-8 text-center text-gray-500">
        {label}
      </td>
    </tr>
  );
}
