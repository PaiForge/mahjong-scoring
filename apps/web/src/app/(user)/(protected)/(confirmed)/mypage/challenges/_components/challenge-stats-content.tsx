"use client";

import { useAuth } from "@/app/_contexts/auth-context";

import { ChallengeDashboard } from "./challenge-dashboard";
import { DashboardSkeleton } from "./dashboard-skeleton";

/**
 * 認証ローディング状態をハンドリングしてダッシュボードを表示するラッパー
 * マイページコンテンツ
 */
export function ChallengeStatsContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return <ChallengeDashboard />;
}
