"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import { Button } from "@/app/(user)/_components/button";
import { DoneMark } from "@/app/(user)/_components/done-mark";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { useAuth } from "@/app/_contexts/auth-context";
import { logExternalError } from "@/lib/log-error";
import { buildSignInHref } from "@/lib/redirect";
import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";
import { chapterHref } from "@mahjong-scoring/features/routes";

import { completeLesson } from "../_actions/complete-lesson";
import { useLessonCompletion } from "../_hooks/use-lesson-completion";

interface ChapterCompleteButtonProps {
  readonly slug: CurriculumChapterSlug;
}

/**
 * 確認問題を持たないレッスンの章末の完了ボタン
 * 章完了ボタン
 *
 * 確認問題を持つレッスンは問題を解き終えると完了になるが、持たないレッスン
 * （基礎・点数記憶術の章）にはその区切りが無いので、本人が押して完了にする。
 * 記録される印は確認問題と同じ `lesson_completions` で、レッスンの目次の完了の
 * 印・進捗バー・ダッシュボードの「レッスンの続き」が同じように読む。
 *
 * - 認証状態の確定前・完了状態の取得中: 同じ高さのプレースホルダ
 * - 未ログイン: ログインへの導線（戻り先はこの章）。完了の印はログイン済みの
 *   本人にしか付かないため
 * - 未完了: 「このレッスンを完了にする」の塗りのボタン。確認問題を持つ
 *   レッスンの「確認問題へ」と同じ位置・同じ重さで、どの章でも章末に
 *   「次へ進む 1 つの面」がある形に揃える
 * - 完了済み: 済みの印だけ。取り消しは無い（以前の読了トグルは解除できたが、
 *   完了は「取り組んだ」という事実で、消す理由が無い）
 *
 * 章ページは静的生成（cookie を読まない）なので、ユーザーに依存するのは
 * この 1 箇所だけ。認証状態は `useAuth()`、完了の初期値は Server Action で取る。
 */
export function ChapterCompleteButton({ slug }: ChapterCompleteButtonProps) {
  const t = useTranslations("learnCurriculum.chapter");
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { completed, fetched, markCompleted } = useLessonCompletion(slug);
  const [saving, setSaving] = useState(false);

  if (!isLoading && user === null) {
    return (
      <div className="text-center">
        <Link
          href={buildSignInHref(chapterHref(slug))}
          className={`text-sm ${TEXT_LINK_CLASSES}`}
        >
          {t("loginPromptCta")}
        </Link>
      </div>
    );
  }

  if (!fetched) {
    return <SkeletonBar radius="lg" tone={100} className="h-[50px] w-full" />;
  }

  if (completed) {
    return (
      <div className="flex justify-center" data-testid="chapter-completed">
        <DoneMark label={t("completedMark")} />
      </div>
    );
  }

  const handleClick = async () => {
    setSaving(true);
    try {
      const result = await completeLesson(slug);
      if (!result.success) {
        toast.error(t("updateFailedToast"));
        return;
      }
      if ("skipped" in result) {
        // サーバーにセッションが無い（クライアントではログイン済みに見えていた）。
        // ログインし直してこの章へ戻す
        router.push(buildSignInHref(chapterHref(slug)));
        return;
      }
      markCompleted();
    } catch (error: unknown) {
      logExternalError("completeLesson", slug, error);
      toast.error(t("updateFailedToast"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button size="lg" fullWidth disabled={saving} onClick={handleClick}>
      {saving ? t("completing") : t("completeCta")}
    </Button>
  );
}
