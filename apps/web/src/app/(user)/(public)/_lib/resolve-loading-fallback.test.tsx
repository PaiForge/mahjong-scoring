import { describe, expect, it } from "vitest";

import { PageSkeleton } from "@/app/(user)/_components/page-skeleton";

import { LeaderboardDetailSkeleton } from "../leaderboard/[period]/[module]/_components/leaderboard-detail-skeleton";
import { PracticeResultLoadingFallback } from "../practice/_components/practice-result-loading-fallback";
import { PublicProfileSkeleton } from "../u/[username]/_components/public-profile-skeleton";
import { resolveLoadingFallback } from "./resolve-loading-fallback";

describe("resolveLoadingFallback", () => {
  it("練習結果ページには slug 付きの結果スケルトンを返す", () => {
    const element = resolveLoadingFallback("/practice/jantou-fu/result");
    expect(element.type).toBe(PracticeResultLoadingFallback);
    expect(element.props).toEqual({ slug: "jantou-fu" });
  });

  it("末尾スラッシュ付きでも練習結果ページとして扱う", () => {
    const element = resolveLoadingFallback("/practice/machi-fu/result/");
    expect(element.type).toBe(PracticeResultLoadingFallback);
  });

  it("未知の slug の結果ページは汎用スケルトンに落とす", () => {
    const element = resolveLoadingFallback("/practice/unknown/result");
    expect(element.type).toBe(PageSkeleton);
  });

  it("練習の説明・本体ページは結果スケルトンにしない", () => {
    expect(resolveLoadingFallback("/practice/jantou-fu").type).toBe(
      PageSkeleton,
    );
    expect(resolveLoadingFallback("/practice/jantou-fu/play").type).toBe(
      PageSkeleton,
    );
  });

  it("リーダーボード詳細には詳細スケルトンを返す", () => {
    expect(resolveLoadingFallback("/leaderboard/all/jantou_fu").type).toBe(
      LeaderboardDetailSkeleton,
    );
  });

  it("リーダーボード一覧は汎用スケルトンにする", () => {
    expect(resolveLoadingFallback("/leaderboard").type).toBe(PageSkeleton);
  });

  it("公開プロフィールにはプロフィールスケルトンを返す", () => {
    expect(resolveLoadingFallback("/u/seed_user").type).toBe(
      PublicProfileSkeleton,
    );
  });

  it("その他のルートは汎用スケルトンにする", () => {
    expect(resolveLoadingFallback("/").type).toBe(PageSkeleton);
    expect(resolveLoadingFallback("/learn/jantou-fu").type).toBe(PageSkeleton);
  });
});
