import type { ReactNode } from "react";

interface AdminChoiceTileOption<Key extends string> {
  readonly key: Key;
  readonly label: string;
  /** ラベルの下に小さく添える補足。無ければ出さない */
  readonly hint?: ReactNode;
}

interface AdminChoiceTilesProps<Key extends string> {
  /** ラジオの name。同じフォームの中で一意にする */
  readonly name: string;
  /** 選択肢の並びの見出し（fieldset の legend） */
  readonly legend: ReactNode;
  readonly options: readonly AdminChoiceTileOption<Key>[];
  /** 選択中のキー。undefined なら未選択 */
  readonly value: Key | undefined;
  readonly onChange: (key: Key) => void;
  /** 未選択のまま送らせない（ブラウザの必須の検証） */
  readonly required?: boolean;
  /** 列数。補足を持つ選択肢は 2〜3 列、短い値は 4 列 */
  readonly columns: 3 | 4;
}

// 狭い画面では 2 列に畳む。クラス名は Tailwind が拾えるよう完成形で持つ
const GRID_CLASSES = {
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
} as const;

/**
 * 少数の選択肢から 1 つ選ぶタイルの並び（中身はラジオ）
 * 選択タイル
 *
 * 素のラジオを横に並べると、選択肢が増えたときに行の折り返しで組が読み取りにくく、
 * 押せる範囲も文字の幅しか無い。タイルにして面全体を押せるようにし、選択中は枠と
 * 淡い塗りで示す（色だけに頼らないよう、ラジオの丸もそのまま見せる）。
 *
 * ラジオを隠さないのは、必須の検証でブラウザが出す吹き出しが入力欄の位置に付くため。
 * 見えない入力欄に付くと、何を選べと言われているのかが分からない。
 */
export function AdminChoiceTiles<Key extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  required = false,
  columns,
}: AdminChoiceTilesProps<Key>) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-surface-900">
        {legend}
      </legend>
      <div className={`grid gap-2 ${GRID_CLASSES[columns]}`}>
        {options.map((option) => (
          <label
            key={option.key}
            className="flex cursor-pointer items-start gap-2 rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm transition-colors hover:border-surface-400 has-checked:border-primary-600 has-checked:bg-primary-50 has-checked:ring-1 has-checked:ring-primary-600 has-checked:ring-inset has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary-600"
          >
            <input
              type="radio"
              name={name}
              value={option.key}
              required={required}
              checked={value === option.key}
              onChange={() => onChange(option.key)}
              className="mt-0.5 shrink-0 accent-primary-600 focus:outline-none"
            />
            <span className="min-w-0">
              <span className="block font-medium text-surface-900">
                {option.label}
              </span>
              {option.hint !== undefined && (
                <span className="mt-0.5 block text-xs text-surface-500 tabular-nums">
                  {option.hint}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
