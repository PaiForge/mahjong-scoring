import { SectionTitle } from "@/app/_components/section-title";

interface PracticeCategorySectionProps {
  title: string;
  children: React.ReactNode;
}

/**
 * 練習カテゴリセクション
 *
 * カテゴリタイトルを表示し、
 * 子要素として練習カードを2カラムグリッドで並べる。
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
