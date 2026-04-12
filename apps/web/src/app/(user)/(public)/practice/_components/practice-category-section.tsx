import { SectionTitle } from "@/app/_components/section-title";

interface PracticeCategorySectionProps {
  title: string;
  children: React.ReactNode;
}

/**
 * ドリルカテゴリセクション
 *
 * カテゴリタイトルを表示し、
 * 子要素としてドリルカードを2カラムグリッドで並べる。
 */
export function PracticeCategorySection({
  title,
  children,
}: PracticeCategorySectionProps) {
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
