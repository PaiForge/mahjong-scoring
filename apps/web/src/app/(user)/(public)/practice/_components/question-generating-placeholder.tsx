/**
 * 問題生成中のプレースホルダ
 * 生成中表示
 *
 * ジェネレータが有効な問題を組み立てるまでの短い待ち時間に出す。
 * 文言は呼び出し側の名前空間から渡す（各練習が自分の "generating" を持つ）。
 */
export function QuestionGeneratingPlaceholder({
  label,
}: {
  readonly label: string;
}) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-surface-500">{label}</div>
    </div>
  );
}
