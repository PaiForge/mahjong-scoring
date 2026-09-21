"use client";

import { useEffect, useState, type ReactNode } from "react";

import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { useAuth } from "@/app/_contexts/auth-context";

import { getChapterReadState } from "../_actions/get-chapter-read-state";
import type { CurriculumChapterSlug } from "../_lib/curriculum";
import { MarkAsReadButton } from "./mark-as-read-button";

interface ChapterReadStatusProps {
  /** 対象章のスラッグ */
  readonly slug: CurriculumChapterSlug;
  /** 未認証のときに出す導線（サーバーで描画済みのノードを受け取る） */
  readonly loginPrompt: ReactNode;
}

/** 取得済みの読了状態。誰の分かを持ち、ユーザーが切り替わったら捨てる */
interface FetchedReadState {
  readonly userId: string;
  readonly read: boolean;
}

/**
 * 章末の読了トグル / ログイン導線
 * 章読了スロット
 *
 * 章ページは静的生成（cookie を読まない）で、ユーザーに依存するのはこの 1 箇所だけ。
 * 認証状態は `useAuth()`、読了の初期値は Server Action で取り、解決するまでは
 * 同じ高さのプレースホルダを置く。章本文をユーザー依存にしないことで、
 * 初期 HTML に本文が入り CDN キャッシュにも乗る。
 */
export function ChapterReadStatus({
  slug,
  loginPrompt,
}: ChapterReadStatusProps) {
  const { user, isLoading } = useAuth();
  const [fetched, setFetched] = useState<FetchedReadState | undefined>(
    undefined,
  );

  const userId = user?.id;
  useEffect(() => {
    if (userId === undefined) return;
    let cancelled = false;
    getChapterReadState(slug).then((read) => {
      if (!cancelled) setFetched({ userId, read });
    });
    return () => {
      cancelled = true;
    };
  }, [userId, slug]);

  if (!isLoading && user === null) return <>{loginPrompt}</>;

  // 別のユーザーの分は使わない（ログアウト → 別アカウントでログインした場合）
  const initialRead =
    fetched !== undefined && fetched.userId === userId
      ? fetched.read
      : undefined;

  if (initialRead === undefined) {
    return (
      <SkeletonBar as="span" className="inline-block w-32">
        &nbsp;
      </SkeletonBar>
    );
  }

  return <MarkAsReadButton slug={slug} initialRead={initialRead} />;
}
