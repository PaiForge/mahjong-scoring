import type { Metadata } from "next";
import { DrillCard } from "./_components/drill-card";

export const metadata: Metadata = {
  title: "練習 - Mahjong Scoring",
  description: "麻雀の符計算・点数計算をステップバイステップで練習できるドリル一覧",
};

const drills = [
  {
    href: "/practice/jantou-fu",
    title: "雀頭の符計算",
    description: "雀頭（アタマ）の牌種に応じた符を答えるドリル",
    difficulty: "beginner" as const,
  },
  {
    href: "/practice/machi-fu",
    title: "待ちの符計算",
    description: "待ち形（両面・嵌張・辺張・単騎・双碰）の符を答えるドリル",
    difficulty: "beginner" as const,
  },
  {
    href: "/practice/mentsu-fu",
    title: "面子の符計算",
    description: "面子の種類（順子・刻子・槓子）と明暗に応じた符を答えるドリル",
    difficulty: "intermediate" as const,
  },
  {
    href: "/practice/tehai-fu",
    title: "手牌の符計算",
    description: "手牌全体の符を合計して答える総合ドリル",
    difficulty: "advanced" as const,
  },
  {
    href: "/practice/score",
    title: "点数計算ドリル",
    description: "翻数・符から最終的な点数を算出する実戦形式のドリル",
    difficulty: "advanced" as const,
  },
] as const;

export default function PracticePage() {
  return (
    <div className="px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-surface-900">練習</h1>
        <p className="mt-2 text-sm text-surface-500">
          符計算の基礎から点数申告まで、段階的にマスターできるドリルを用意しています
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {drills.map((drill) => (
            <DrillCard key={drill.href} {...drill} />
          ))}
        </div>

        {/* Progress card */}
        <div className="mt-8 rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-surface-900">学習の進捗</h2>
          <p className="mt-1 text-sm text-surface-400">
            サインインすると学習履歴を記録できます
          </p>
        </div>
      </div>
    </div>
  );
}
