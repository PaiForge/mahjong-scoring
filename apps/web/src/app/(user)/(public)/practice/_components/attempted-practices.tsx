"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { CheckIcon } from "@/app/(user)/_components/icons/check-icon";
import { useAuth } from "@/app/_contexts/auth-context";

import { getAttemptedPracticeSlugs } from "../_actions/get-attempted-practice-slugs";

/** 取得済みの挑戦。誰の分かを持ち、ユーザーが切り替わったら捨てる */
interface FetchedAttempts {
  readonly userId: string;
  readonly slugs: ReadonlySet<string>;
}

const AttemptedPracticesContext = createContext<
  ReadonlySet<string> | undefined
>(undefined);

/**
 * 本人が挑戦した練習を、配下の {@link PracticeAttemptedMark} に配る
 * 挑戦済み練習プロバイダー
 *
 * 練習一覧は静的生成なので、ログインを確かめてから Server Action で 1 度だけ
 * 取る（カードごとに取らない）。未ログイン・取得前は何も配らず、印は出ない。
 * web はゲストのチャレンジを記録しないので、ゲストに出す印は無い
 * （アプリはゲストの「チャレンジを終えた練習」を端末に持つ）。
 */
export function AttemptedPracticesProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { user } = useAuth();
  const userId = user?.id;
  const [fetched, setFetched] = useState<FetchedAttempts | undefined>(
    undefined,
  );

  useEffect(() => {
    if (userId === undefined) return;
    let cancelled = false;
    getAttemptedPracticeSlugs().then((slugs) => {
      if (!cancelled) setFetched({ userId, slugs: new Set(slugs) });
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 別のユーザーの分は使わない（ログアウト → 別アカウントでログインした場合）
  const slugs =
    fetched !== undefined && fetched.userId === userId
      ? fetched.slugs
      : undefined;

  return (
    <AttemptedPracticesContext value={slugs}>
      {children}
    </AttemptedPracticesContext>
  );
}

/**
 * 練習カードの「挑戦済み」の印
 * 挑戦済みマーク
 *
 * チャレンジを 1 回でも終えた練習のカードの下段の左に出す。道場の「練習する」の
 * 段と同じ数え方で、級で絞った一覧から「練習する 2 / 4」の残りがどれかを
 * 見分けるためのもの。未挑戦の側に印を付けないのは、何も始めていない人の
 * 一覧が全部「未挑戦」で埋まるため。形は段級位の「取得済み」の pill
 * （`RankStatusBadge`）と同じ淡緑の地にチェック。
 *
 * {@link AttemptedPracticesProvider} の外（練習一覧以外に置いたカード）では何も出さない。
 */
export function PracticeAttemptedMark({
  slug,
  label,
}: {
  readonly slug: string;
  /** 印の文言（「挑戦済み」） */
  readonly label: string;
}) {
  const slugs = useContext(AttemptedPracticesContext);
  if (slugs === undefined || !slugs.has(slug)) return undefined;
  return (
    <span
      data-practice-attempted={slug}
      className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md bg-success-subtle px-2.5 text-xs leading-none font-bold text-success-strong"
    >
      <CheckIcon className="size-3.5" />
      {label}
    </span>
  );
}
